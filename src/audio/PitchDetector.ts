/**
 * High-Precision YIN Pitch Detection Algorithm with Decimation Optimization
 * Reference: A. de Cheveigné and H. Kawahara (2002), "YIN, a fundamental frequency estimator for speech and music"
 * Optimized for guitar and bass (35 Hz to 1200 Hz) with sub-sample parabolic interpolation
 * and zero-allocation memory pooling.
 */
export class PitchDetector {
  private minFreq: number;
  private maxFreq: number;
  private threshold: number;

  // Pre-allocated reusable buffers for zero GC overhead during audio loops
  private downsampledBuffer: Float32Array;
  private d: Float32Array;
  private dPrime: Float32Array;

  constructor(minFreq = 35, maxFreq = 1200, threshold = 0.15) {
    this.minFreq = minFreq;
    this.maxFreq = maxFreq;
    this.threshold = threshold;

    // Initial allocations (covers standard 4096 input buffer downsampled to 2048)
    this.downsampledBuffer = new Float32Array(2048);
    this.d = new Float32Array(1024);
    this.dPrime = new Float32Array(1024);
  }

  private ensureCapacity(sampleCapacity: number, lagCapacity: number): void {
    if (this.downsampledBuffer.length < sampleCapacity) {
      this.downsampledBuffer = new Float32Array(sampleCapacity);
    }
    if (this.d.length < lagCapacity) {
      this.d = new Float32Array(lagCapacity);
      this.dPrime = new Float32Array(lagCapacity);
    }
  }

  /**
   * Detect pitch from time-domain audio buffer (Float32Array)
   * Returns { frequency: number, clarity: number, rms: number }
   */
  public detect(
    buffer: Float32Array,
    sampleRate: number,
    sensitivityThreshold = 0.006
  ): {
    frequency: number;
    clarity: number;
    rms: number;
  } {
    const size = buffer.length;

    // 1. Calculate RMS energy (volume) to eliminate silence
    let sumSquares = 0;
    for (let i = 0; i < size; i++) {
      const val = buffer[i];
      sumSquares += val * val;
    }
    const rms = Math.sqrt(sumSquares / size);

    if (rms < sensitivityThreshold) {
      return { frequency: 0, clarity: 0, rms };
    }

    // 2. 2:1 Decimation with anti-aliasing boxcar filter
    // Reduces search space and operations by 4x while preserving sub-Hz precision via parabolic interpolation
    const halfLength = size >> 1;
    const effectiveSampleRate = sampleRate / 2;
    const halfSize = halfLength >> 1;
    const minLag = Math.max(2, Math.floor(effectiveSampleRate / this.maxFreq));
    const maxLag = Math.min(halfSize - 1, Math.ceil(effectiveSampleRate / this.minFreq));

    this.ensureCapacity(halfLength, maxLag + 2);

    for (let i = 0; i < halfLength; i++) {
      const idx = i << 1;
      this.downsampledBuffer[i] = 0.5 * (buffer[idx] + buffer[idx + 1]);
    }

    // 3. Difference Function: d(tau) = sum_{j=0}^{W-1} (x[j] - x[j+tau])^2
    for (let tau = 1; tau <= maxLag + 1; tau++) {
      let sum = 0;
      for (let j = 0; j < halfSize; j++) {
        const diff = this.downsampledBuffer[j] - this.downsampledBuffer[j + tau];
        sum += diff * diff;
      }
      this.d[tau] = sum;
    }

    // 4. Cumulative Mean Normalized Difference Function: d'(tau)
    this.dPrime[0] = 1;
    let runningSum = 0;

    for (let tau = 1; tau <= maxLag + 1; tau++) {
      runningSum += this.d[tau];
      if (runningSum === 0) {
        this.dPrime[tau] = 1;
      } else {
        this.dPrime[tau] = (this.d[tau] * tau) / runningSum;
      }
    }

    // 5. Absolute Thresholding: Find first dip tau where dPrime[tau] < threshold
    let tauEstimate = -1;

    for (let tau = minLag; tau <= maxLag; tau++) {
      if (this.dPrime[tau] < this.threshold) {
        // Continue downward to local minimum in this valley
        while (tau + 1 <= maxLag && this.dPrime[tau + 1] < this.dPrime[tau]) {
          tau++;
        }
        tauEstimate = tau;
        break;
      }
    }

    // If no valley fell below threshold, find the global minimum within range
    if (tauEstimate === -1) {
      let minVal = Infinity;
      for (let tau = minLag; tau <= maxLag; tau++) {
        if (this.dPrime[tau] < minVal) {
          minVal = this.dPrime[tau];
          tauEstimate = tau;
        }
      }
      // If even the best minimum has high aperiodicity, reject as noise
      if (minVal > 0.35) {
        return { frequency: 0, clarity: 0, rms };
      }
    }

    if (tauEstimate <= 0 || tauEstimate > maxLag) {
      return { frequency: 0, clarity: 0, rms };
    }

    // 6. Sub-Sample Parabolic Interpolation around the minimum
    const y0 = this.dPrime[tauEstimate - 1];
    const y1 = this.dPrime[tauEstimate];
    const y2 = this.dPrime[tauEstimate + 1];

    const denom = 2 * (y0 - 2 * y1 + y2);
    let delta = 0;
    if (Math.abs(denom) > 1e-6) {
      delta = (y0 - y2) / denom;
    }

    // Clamp delta to prevent unreasonable extrapolation
    delta = Math.max(-0.5, Math.min(0.5, delta));
    const fineTau = tauEstimate + delta;

    if (fineTau <= 0) {
      return { frequency: 0, clarity: 0, rms };
    }

    const frequency = effectiveSampleRate / fineTau;

    if (frequency < this.minFreq || frequency > this.maxFreq) {
      return { frequency: 0, clarity: 0, rms };
    }

    const clarity = Math.max(0, Math.min(1, 1 - this.dPrime[tauEstimate]));

    return {
      frequency,
      clarity,
      rms,
    };
  }
}
