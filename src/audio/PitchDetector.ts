/**
 * High-Precision YIN Pitch Detection Algorithm
 * Reference: A. de Cheveigné and H. Kawahara (2002), "YIN, a fundamental frequency estimator for speech and music"
 * Optimized for guitar and bass (35 Hz to 1200 Hz) with sub-sample parabolic interpolation
 */
export class PitchDetector {
  private minFreq: number;
  private maxFreq: number;
  private threshold: number;

  constructor(minFreq = 35, maxFreq = 1200, threshold = 0.15) {
    this.minFreq = minFreq;
    this.maxFreq = maxFreq;
    this.threshold = threshold;
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

    // 2. Window size W is fixed to half the buffer size (ensures zero tapering bias)
    const halfSize = Math.floor(size / 2);
    const minLag = Math.max(2, Math.floor(sampleRate / this.maxFreq)); // e.g. 48000 / 1200 = 40
    const maxLag = Math.min(halfSize - 1, Math.ceil(sampleRate / this.minFreq)); // e.g. 48000 / 35 = 1371

    // 3. Difference Function: d(tau) = sum_{j=0}^{W-1} (x[j] - x[j+tau])^2
    const d = new Float32Array(maxLag + 2);
    for (let tau = 1; tau <= maxLag + 1; tau++) {
      let sum = 0;
      for (let j = 0; j < halfSize; j++) {
        const diff = buffer[j] - buffer[j + tau];
        sum += diff * diff;
      }
      d[tau] = sum;
    }

    // 4. Cumulative Mean Normalized Difference Function: d'(tau)
    const dPrime = new Float32Array(maxLag + 2);
    dPrime[0] = 1;
    let runningSum = 0;

    for (let tau = 1; tau <= maxLag + 1; tau++) {
      runningSum += d[tau];
      if (runningSum === 0) {
        dPrime[tau] = 1;
      } else {
        dPrime[tau] = (d[tau] * tau) / runningSum;
      }
    }

    // 5. Absolute Thresholding: Find first dip tau where dPrime[tau] < threshold
    let tauEstimate = -1;

    for (let tau = minLag; tau <= maxLag; tau++) {
      if (dPrime[tau] < this.threshold) {
        // Continue downward to local minimum in this valley
        while (tau + 1 <= maxLag && dPrime[tau + 1] < dPrime[tau]) {
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
        if (dPrime[tau] < minVal) {
          minVal = dPrime[tau];
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
    const y0 = dPrime[tauEstimate - 1];
    const y1 = dPrime[tauEstimate];
    const y2 = dPrime[tauEstimate + 1];

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

    const frequency = sampleRate / fineTau;

    if (frequency < this.minFreq || frequency > this.maxFreq) {
      return { frequency: 0, clarity: 0, rms };
    }

    const clarity = Math.max(0, Math.min(1, 1 - dPrime[tauEstimate]));

    return {
      frequency,
      clarity,
      rms,
    };
  }
}
