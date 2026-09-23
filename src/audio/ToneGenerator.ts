/**
 * ToneGenerator synthesizes reference guitar tones and success chimes
 * using Web Audio API
 */
export class ToneGenerator {
  private ctx: AudioContext | null = null;

  private getAudioContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Plays a plucked-string acoustic sound at a specified frequency
   */
  public playPluck(frequency: number, duration = 1.5): void {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // Primary tone
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Triangle + Sine combination for warm acoustic string body
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(frequency, now);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(frequency * 2, now); // Second harmonic

      // Filter: pluck brightness that decays quickly
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.min(frequency * 6, 4000), now);
      filter.frequency.exponentialRampToValueAtTime(Math.min(frequency * 1.5, 800), now + duration * 0.4);

      // Amplitude envelope (ADSR for pluck)
      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(0.4, now + 0.02); // Sharp attack
      gainNode.gain.exponentialRampToValueAtTime(0.08, now + 0.3); // Quick decay
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration); // Long tail

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration);
      osc2.stop(now + duration);
    } catch (err) {
      console.warn('ToneGenerator error:', err);
    }
  }

  /**
   * Harmonic pleasant chime when string is tuned within ±3 cents
   */
  public playSuccessChime(): void {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      const freqs = [880, 1174.66]; // A5 + D6 harmonic bell
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.0001, now + idx * 0.05);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.05 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.65);
      });
    } catch (err) {
      console.warn('Success chime error:', err);
    }
  }
}

export const toneGenerator = new ToneGenerator();
