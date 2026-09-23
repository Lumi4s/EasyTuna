export type PegSide = 'left' | 'right' | 'top' | 'inline';

export interface InstrumentString {
  id: string;
  name: string;        // e.g. "E", "A", "D", "G", "B", "E"
  octave: number;      // e.g. 2, 2, 3, 3, 3, 4
  fullName: string;    // e.g. "E2"
  freq: number;        // Target frequency in Hz (based on A4 = 440Hz standard)
  stringNumber: number;// 1 to 6 (1 is highest pitch / thinnest string in standard guitar convention)
  pegSide: PegSide;    // Visual placement on headstock
  pegIndex: number;    // Vertical order on that side (0 = lowest/closest to nut or vice versa)
  thickness?: number;  // Relative gauge for rendering visual string width
}

export interface TuningPreset {
  id: string;
  name: string;
  strings: InstrumentString[];
}

export type InstrumentCategory = 'all' | 'guitars' | 'bass' | 'folk' | 'strings';

export interface Instrument {
  id: string;
  name: string;
  category: InstrumentCategory;
  description: string;
  iconName: string;
  stringCount: number;
  isStub?: boolean;
  stubMessage?: string;
  tunings: TuningPreset[];
  activeTuningId: string;
  headstockStyle: 'classic-3x3' | 'bass-4' | 'ukulele-2x2' | 'inline-6';
}

export interface PitchDetectionResult {
  frequency: number;          // Detected Hz
  clarity: number;            // 0.0 to 1.0 confidence
  closestString: InstrumentString | null;
  cents: number;              // Deviation from -50 to +50 cents
  inTune: boolean;            // within ±3 cents
  noteName: string;           // Note letter + octave (e.g. "E2")
  targetFrequency: number;
  rms: number;                // Volume / amplitude
}

export type AppTheme = 'airy-pastel' | 'midnight-dark' | 'mint-breeze';

export type AppTab = 'tuner' | 'instruments' | 'settings';
