import { PitchDetector } from '../PitchDetector';
import { frequencyToNote, findClosestString, getCentsDifference } from '../PitchUtils';
import { INSTRUMENTS } from '../../config/instruments';

function generateSineWave(freq: number, sampleRate: number, durationSeconds: number): Float32Array {
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const buffer = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    buffer[i] = 0.5 * Math.sin((2 * Math.PI * freq * i) / sampleRate);
  }
  return buffer;
}

export function runTests(): boolean {
  console.log('--- Testing PitchUtils ---');

  // Test standard A4 (440Hz)
  const a4 = frequencyToNote(440);
  console.log(`440Hz -> Note: ${a4.fullName}, cents: ${a4.cents}`);
  if (a4.fullName !== 'A4' || a4.cents !== 0) {
    console.error('FAIL: A4 note detection incorrect');
    return false;
  }

  // Test E2 (82.41Hz)
  const e2 = frequencyToNote(82.41);
  console.log(`82.41Hz -> Note: ${e2.fullName}, cents: ${e2.cents}`);
  if (e2.fullName !== 'E2') {
    console.error('FAIL: E2 note detection incorrect');
    return false;
  }

  // Test cents calculation
  const cents10 = getCentsDifference(442.55, 440);
  console.log(`442.55Hz vs 440Hz -> cents: ${cents10}`);

  // Test string matching
  const guitar = INSTRUMENTS[0];
  const matchE2 = findClosestString(82.5, guitar.tunings[0].strings);
  console.log(`82.5Hz match -> ${matchE2?.string.fullName}, cents: ${matchE2?.cents}, inTune: ${matchE2?.inTune}`);
  if (!matchE2 || matchE2.string.fullName !== 'E2' || !matchE2.inTune) {
    console.error('FAIL: String matching incorrect');
    return false;
  }

  console.log('--- Testing PitchDetector with Synthesized Strings ---');
  const detector = new PitchDetector(35, 1200);
  const sampleRate = 48000;

  // Test strings: E2 (82.41Hz), A2 (110Hz), D3 (146.83Hz), G3 (196Hz), B3 (246.94Hz), E4 (329.63Hz)
  const testFreqs = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];

  for (const target of testFreqs) {
    const buffer = generateSineWave(target, sampleRate, 0.1);
    const result = detector.detect(buffer, sampleRate, 0.005);
    const errorHz = Math.abs(result.frequency - target);
    console.log(`Target: ${target} Hz -> Detected: ${result.frequency.toFixed(2)} Hz (error: ${errorHz.toFixed(2)} Hz, clarity: ${(result.clarity * 100).toFixed(1)}%)`);

    if (errorHz > 1.5 || result.clarity < 0.7) {
      console.error(`FAIL: Low accuracy for ${target} Hz`);
      return false;
    }
  }

  console.log('--- Testing Bass String: E1 (41.20Hz) ---');
  const bassBuffer = generateSineWave(41.20, sampleRate, 0.1);
  const bassResult = detector.detect(bassBuffer, sampleRate, 0.005);
  console.log(`Target: 41.20 Hz -> Detected: ${bassResult.frequency.toFixed(2)} Hz (clarity: ${(bassResult.clarity * 100).toFixed(1)}%)`);
  if (Math.abs(bassResult.frequency - 41.20) > 1.5) {
    console.error('FAIL: Low accuracy for bass E1');
    return false;
  }

  console.log('ALL TESTS PASSED SUCCESSFULLY! ✓');
  return true;
}

runTests();
