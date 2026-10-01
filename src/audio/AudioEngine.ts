import { PitchDetector } from './PitchDetector';
import type { InstrumentString, PitchDetectionResult } from '../types';
import { findClosestString, getCentsDifference } from './PitchUtils';

export type PitchCallback = (result: PitchDetectionResult | null) => void;

interface ActiveNoteLock {
  string: InstrumentString;
  targetFreq: number;
  lastRms: number;
  peakRms: number;
  lockedAt: number;
  lastHeardAt: number;
}

export class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private highpassFilter: BiquadFilterNode | null = null;
  private lowpassFilter: BiquadFilterNode | null = null;
  private detector: PitchDetector;
  private isRunning = false;
  private animFrameId: number | null = null;

  // Smoothing & Physics
  private smoothedFreq = 0;
  private smoothedCents = 0;
  private recentFreqs: number[] = [];
  private readonly medianWindowSize = 5;

  // Loop cadence & performance throttling (~30-33 Hz analysis, zero-waste UI)
  private lastDetectTime = 0;
  private readonly detectIntervalMs = 32;
  private lastResultTimestamp = 0;

  // Dynamic Noise Floor tracking
  private noiseFloor = 0.003;

  // Note Attack-Lock State Machine
  private activeLock: ActiveNoteLock | null = null;
  private pendingNewString: { string: InstrumentString; count: number } | null = null;
  private lastPitchResult: PitchDetectionResult | null = null;
  private lastRms = 0;

  // Configuration
  private manualLockedString: InstrumentString | null = null; // User-selected string in manual mode
  private sensitivity = 0.007; // Base RMS threshold
  private a4Calibration = 440;
  private activeStrings: InstrumentString[] = [];

  constructor() {
    this.detector = new PitchDetector(35, 1200, 0.14);
  }

  public setSensitivity(val: number): void {
    this.sensitivity = val;
  }

  public setA4(hz: number): void {
    this.a4Calibration = hz;
  }

  public setLockedString(str: InstrumentString | null): void {
    this.manualLockedString = str;
    if (str) {
      const a4Scale = this.a4Calibration / 440;
      this.activeLock = {
        string: str,
        targetFreq: str.freq * a4Scale,
        lastRms: 0.05,
        peakRms: 0.05,
        lockedAt: performance.now(),
        lastHeardAt: performance.now(),
      };
    } else {
      this.activeLock = null;
    }
  }

  public setActiveStrings(strings: InstrumentString[]): void {
    this.activeStrings = strings;
  }

  private getMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  public async start(onPitch: PitchCallback): Promise<boolean> {
    if (this.isRunning) return true;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtx();

      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const source = this.audioCtx.createMediaStreamSource(this.mediaStream);

      // Hardware Biquad Filters:
      // 1. High-pass filter (32 Hz) cuts off rumble, handling thumps, and DC bias below musical range
      this.highpassFilter = this.audioCtx.createBiquadFilter();
      this.highpassFilter.type = 'highpass';
      this.highpassFilter.frequency.setValueAtTime(32, this.audioCtx.currentTime);
      this.highpassFilter.Q.setValueAtTime(0.707, this.audioCtx.currentTime);

      // 2. Low-pass filter (1350 Hz) cuts off fret buzz, mic hiss, and ultrasonic harmonics
      this.lowpassFilter = this.audioCtx.createBiquadFilter();
      this.lowpassFilter.type = 'lowpass';
      this.lowpassFilter.frequency.setValueAtTime(1350, this.audioCtx.currentTime);
      this.lowpassFilter.Q.setValueAtTime(0.707, this.audioCtx.currentTime);

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 4096;

      // Connect DSP chain: Source -> Highpass -> Lowpass -> Analyser
      source.connect(this.highpassFilter);
      this.highpassFilter.connect(this.lowpassFilter);
      this.lowpassFilter.connect(this.analyser);

      this.isRunning = true;
      const buffer = new Float32Array(this.analyser.fftSize);

      const loop = () => {
        if (!this.isRunning || !this.analyser || !this.audioCtx) return;

        const now = performance.now();

        // Throttle pitch detection to ~30-33 Hz (every ~32ms)
        // Eliminates CPU waste while staying well within human auditory perception window
        if (now - this.lastDetectTime < this.detectIntervalMs) {
          this.animFrameId = requestAnimationFrame(loop);
          return;
        }
        this.lastDetectTime = now;

        this.analyser.getFloatTimeDomainData(buffer);
        const a4Scale = this.a4Calibration / 440;

        // Dynamic threshold with Noise Floor tracking:
        const isCurrentlyLocked = this.activeLock !== null;
        if (!isCurrentlyLocked || this.lastRms < this.sensitivity * 1.5) {
          this.noiseFloor = this.noiseFloor * 0.95 + this.lastRms * 0.05;
        }

        const baseSensitivity = Math.max(this.sensitivity, this.noiseFloor * 1.8);
        const currentSensitivity = isCurrentlyLocked ? baseSensitivity * 0.45 : baseSensitivity;

        const { frequency, clarity, rms } = this.detector.detect(
          buffer,
          this.audioCtx.sampleRate,
          currentSensitivity
        );

        const deltaRms = rms - this.lastRms;
        this.lastRms = rms;

        // If manual mode: lock is permanently bound to manualLockedString
        if (this.manualLockedString) {
          const targetStr = this.manualLockedString;
          const targetFreq = targetStr.freq * a4Scale;

          if (frequency > 0 && clarity > 0.65) {
            this.recentFreqs.push(frequency);
            if (this.recentFreqs.length > this.medianWindowSize) this.recentFreqs.shift();
            const medianFreq = this.getMedian(this.recentFreqs);

            let cents = getCentsDifference(medianFreq, targetFreq);
            cents = Math.max(-50, Math.min(50, cents));

            // Smooth needle damping
            const diff = Math.abs(cents - this.smoothedCents);
            const alpha = diff < 6 ? 0.12 : 0.35;
            this.smoothedCents = this.smoothedCents * (1 - alpha) + cents * alpha;
            this.smoothedFreq = this.smoothedFreq * 0.8 + medianFreq * 0.2;

            const inTune = Math.abs(this.smoothedCents) <= 3;
            const result: PitchDetectionResult = {
              frequency: Math.round(this.smoothedFreq * 10) / 10,
              clarity,
              closestString: targetStr,
              cents: Math.round(this.smoothedCents),
              inTune,
              noteName: targetStr.fullName,
              targetFrequency: targetFreq,
              rms,
            };
            this.lastPitchResult = result;
            this.lastResultTimestamp = now;
            onPitch(result);
          } else if (this.lastPitchResult && now - this.lastResultTimestamp < 300) {
            onPitch(this.lastPitchResult);
          } else {
            onPitch(null);
          }

          this.animFrameId = requestAnimationFrame(loop);
          return;
        }

        // ========================================================
        // AUTO MODE: NOTE ATTACK-LOCK STATE MACHINE
        // ========================================================
        if (frequency > 0 && clarity > 0.68) {
          // Add to rolling median buffer
          this.recentFreqs.push(frequency);
          if (this.recentFreqs.length > this.medianWindowSize) this.recentFreqs.shift();
          const medianFreq = this.getMedian(this.recentFreqs);

          const candidate = findClosestString(medianFreq, this.activeStrings, a4Scale);

          if (candidate) {
            const candidateStr = candidate.string;
            const candidateTargetFreq = candidateStr.freq * a4Scale;

            // Check if we already have a locked note
            if (!this.activeLock) {
              // NO LOCK YET: A clear strike locks on immediately!
              if (rms >= baseSensitivity) {
                this.activeLock = {
                  string: candidateStr,
                  targetFreq: candidateTargetFreq,
                  lastRms: rms,
                  peakRms: rms,
                  lockedAt: now,
                  lastHeardAt: now,
                };
                this.pendingNewString = null;
                this.smoothedFreq = medianFreq;
                this.smoothedCents = candidate.cents;
              }
            } else {
              // ALREADY LOCKED ON A STRING
              const isSameString = candidateStr.id === this.activeLock.string.id;

              // Check if a NEW string was distinctly struck:
              // Criteria: candidate is different string, clear volume surge (pluck attack), and high clarity
              const isPluckAttack = (deltaRms > 0.008 || rms > this.activeLock.peakRms * 0.8) && rms > 0.012;
              const isStrongCandidate = clarity > 0.82;

              if (!isSameString && isPluckAttack && isStrongCandidate) {
                // Potential new string pluck
                if (this.pendingNewString?.string.id === candidateStr.id) {
                  this.pendingNewString.count++;
                  if (this.pendingNewString.count >= 2) {
                    // Confirmed new string strike! Switch lock to new string
                    this.activeLock = {
                      string: candidateStr,
                      targetFreq: candidateTargetFreq,
                      lastRms: rms,
                      peakRms: rms,
                      lockedAt: now,
                      lastHeardAt: now,
                    };
                    this.pendingNewString = null;
                    this.smoothedFreq = medianFreq;
                    this.smoothedCents = candidate.cents;
                  }
                } else {
                  this.pendingNewString = { string: candidateStr, count: 1 };
                }
              } else {
                // Reset pending candidate count if false alarm
                this.pendingNewString = null;

                // User is playing / tuning the LOCKED string
                // Check if detected frequency is within reasonable tuning neighborhood (+/- 140 cents)
                const centsFromLocked = getCentsDifference(medianFreq, this.activeLock.targetFreq);

                if (Math.abs(centsFromLocked) <= 140) {
                  // Legitimate tuning of the locked string
                  this.activeLock.lastHeardAt = now;
                  this.activeLock.lastRms = rms;
                  if (rms > this.activeLock.peakRms) {
                    this.activeLock.peakRms = rms;
                  }

                  const targetCents = Math.max(-50, Math.min(50, centsFromLocked));

                  // Adaptive needle damping:
                  // Calm and stable when in tune or tuning gently, responsive when moving fast
                  const centsDiff = Math.abs(targetCents - this.smoothedCents);
                  let alpha = 0.18;
                  if (centsDiff < 5) {
                    alpha = 0.10; // Extra silky when close to in-tune
                  } else if (centsDiff > 15) {
                    alpha = 0.38;
                  }

                  this.smoothedCents = this.smoothedCents * (1 - alpha) + targetCents * alpha;
                  this.smoothedFreq = this.smoothedFreq * 0.8 + medianFreq * 0.2;
                } else {
                  // Frequency is an overtone / room noise outside legitimate range
                  // Ignore frequency spike and keep needle steady on current position
                }
              }
            }
          }
        }

        // Output Result based on Current Lock
        if (this.activeLock) {
          const timeSinceHeard = now - this.activeLock.lastHeardAt;

          // If note is still vibrating or within 1.4 second timeout after sound fades
          if (timeSinceHeard < 1400) {
            const inTune = Math.abs(this.smoothedCents) <= 3;
            const result: PitchDetectionResult = {
              frequency: Math.round(this.smoothedFreq * 10) / 10,
              clarity,
              closestString: this.activeLock.string,
              cents: Math.round(this.smoothedCents),
              inTune,
              noteName: this.activeLock.string.fullName,
              targetFrequency: this.activeLock.targetFreq,
              rms,
            };
            this.lastPitchResult = result;
            this.lastResultTimestamp = now;
            onPitch(result);
          } else {
            // Lock expired (user stopped playing for 1.4s)
            this.activeLock = null;
            this.pendingNewString = null;
            this.smoothedFreq = 0;
            this.smoothedCents = 0;
            this.recentFreqs = [];
            this.lastPitchResult = null;
            onPitch(null);
          }
        } else {
          // No active note
          this.smoothedFreq = 0;
          this.smoothedCents = 0;
          this.recentFreqs = [];
          this.lastPitchResult = null;
          onPitch(null);
        }

        this.animFrameId = requestAnimationFrame(loop);
      };

      this.animFrameId = requestAnimationFrame(loop);
      return true;
    } catch (err) {
      console.error('Failed to start AudioEngine:', err);
      this.stop();
      return false;
    }
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.highpassFilter) {
      this.highpassFilter.disconnect();
      this.highpassFilter = null;
    }
    if (this.lowpassFilter) {
      this.lowpassFilter.disconnect();
      this.lowpassFilter = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    this.analyser = null;
    this.recentFreqs = [];
    this.smoothedFreq = 0;
    this.smoothedCents = 0;
    this.activeLock = null;
    this.pendingNewString = null;
    this.lastPitchResult = null;
    this.lastResultTimestamp = 0;
    this.lastDetectTime = 0;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }
}

export const audioEngine = new AudioEngine();
