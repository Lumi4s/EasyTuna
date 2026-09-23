import type { InstrumentString } from '../types';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Calculates cents difference between detected frequency and target frequency
 * positive = sharp (#), negative = flat (b)
 */
export function getCentsDifference(detectedFreq: number, targetFreq: number): number {
  if (detectedFreq <= 0 || targetFreq <= 0) return 0;
  return Math.round(1200 * Math.log2(detectedFreq / targetFreq));
}

/**
 * Returns standard note name and octave for any frequency given an A4 base
 */
export function frequencyToNote(frequency: number, a4 = 440): { note: string; octave: number; fullName: string; cents: number } {
  if (frequency <= 0) {
    return { note: '-', octave: 0, fullName: '-', cents: 0 };
  }

  // MIDI note number: 69 is A4 (440Hz)
  const midi = 69 + 12 * Math.log2(frequency / a4);
  const roundedMidi = Math.round(midi);
  const noteIndex = ((roundedMidi % 12) + 12) % 12;
  const octave = Math.floor(roundedMidi / 12) - 1;
  const note = NOTE_NAMES[noteIndex];
  const exactFreq = a4 * Math.pow(2, (roundedMidi - 69) / 12);
  const cents = getCentsDifference(frequency, exactFreq);

  return {
    note,
    octave,
    fullName: `${note}${octave}`,
    cents,
  };
}

/**
 * Finds the closest string from an instrument's strings for a detected frequency
 */
export function findClosestString(
  frequency: number,
  strings: InstrumentString[],
  a4ScaleFactor = 1.0
): { string: InstrumentString; cents: number; inTune: boolean } | null {
  if (frequency <= 0 || strings.length === 0) return null;

  let closestString: InstrumentString = strings[0];
  let minCentsDiff = Infinity;

  for (const str of strings) {
    // Calibrated target frequency
    const targetFreq = str.freq * a4ScaleFactor;
    const cents = getCentsDifference(frequency, targetFreq);
    if (Math.abs(cents) < Math.abs(minCentsDiff)) {
      minCentsDiff = cents;
      closestString = str;
    }
  }

  // Clamped to range -50 to +50 cents for visualization
  const clampedCents = Math.max(-50, Math.min(50, minCentsDiff));
  const inTune = Math.abs(minCentsDiff) <= 3; // within 3 cents is considered in-tune

  return {
    string: closestString,
    cents: clampedCents,
    inTune,
  };
}
