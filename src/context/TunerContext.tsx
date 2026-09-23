import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type { Instrument, InstrumentString, PitchDetectionResult, TuningPreset } from '../types';
import { INSTRUMENTS } from '../config/instruments';
import { audioEngine } from '../audio/AudioEngine';
import { toneGenerator } from '../audio/ToneGenerator';

interface TunerContextType {
  currentInstrument: Instrument;
  activeTuning: TuningPreset;
  tuningMode: 'auto' | 'manual';
  selectedString: InstrumentString | null;
  pitchResult: PitchDetectionResult | null;
  isListening: boolean;
  a4Calibration: number;
  sensitivity: number;
  soundFeedbackEnabled: boolean;
  hapticFeedbackEnabled: boolean;

  // Actions
  setTuningMode: (mode: 'auto' | 'manual') => void;
  selectInstrument: (instrumentId: string) => void;
  selectTuning: (tuningId: string) => void;
  selectString: (str: InstrumentString | null) => void;
  toggleListening: () => Promise<void>;
  startListening: () => Promise<void>;
  stopListening: () => void;
  playStringTone: (str: InstrumentString) => void;
  setA4Calibration: (hz: number) => void;
  setSensitivity: (val: number) => void;
  setSoundFeedbackEnabled: (enabled: boolean) => void;
  setHapticFeedbackEnabled: (enabled: boolean) => void;
}

const TunerContext = createContext<TunerContextType | undefined>(undefined);

export const TunerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentInstrument, setCurrentInstrument] = useState<Instrument>(INSTRUMENTS[0]);
  const [activeTuning, setActiveTuning] = useState<TuningPreset>(INSTRUMENTS[0].tunings[0]);
  const [tuningMode, setTuningMode] = useState<'auto' | 'manual'>('auto');
  const [selectedString, setSelectedString] = useState<InstrumentString | null>(null);
  const [pitchResult, setPitchResult] = useState<PitchDetectionResult | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Settings
  const [a4Calibration, setA4CalibrationState] = useState(440);
  const [sensitivity, setSensitivityState] = useState(0.007);
  const [soundFeedbackEnabled, setSoundFeedbackEnabled] = useState(true);
  const [hapticFeedbackEnabled, setHapticFeedbackEnabled] = useState(true);

  const lastInTuneTriggerTime = useRef<number>(0);
  const lastInTuneStringId = useRef<string | null>(null);

  // Synchronize active strings to audio engine
  useEffect(() => {
    if (activeTuning && activeTuning.strings) {
      audioEngine.setActiveStrings(activeTuning.strings);
    }
  }, [activeTuning]);

  // Synchronize locked string
  useEffect(() => {
    audioEngine.setLockedString(tuningMode === 'manual' ? selectedString : null);
  }, [tuningMode, selectedString]);

  // Synchronize A4 calibration
  useEffect(() => {
    audioEngine.setA4(a4Calibration);
  }, [a4Calibration]);

  // Synchronize sensitivity
  useEffect(() => {
    audioEngine.setSensitivity(sensitivity);
  }, [sensitivity]);

  const onPitchDetected = useCallback((result: PitchDetectionResult | null) => {
    setPitchResult(result);

    if (result && result.inTune && result.closestString) {
      const now = Date.now();
      const stringChanged = lastInTuneStringId.current !== result.closestString.id;
      const cooldownElapsed = now - lastInTuneTriggerTime.current > 1800;

      if (stringChanged || cooldownElapsed) {
        lastInTuneTriggerTime.current = now;
        lastInTuneStringId.current = result.closestString.id;

        if (soundFeedbackEnabled) {
          toneGenerator.playSuccessChime();
        }

        if (hapticFeedbackEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(40);
          } catch {
            // ignore
          }
        }
      }
    } else if (!result) {
      lastInTuneStringId.current = null;
    }
  }, [soundFeedbackEnabled, hapticFeedbackEnabled]);

  const startListening = async () => {
    const success = await audioEngine.start(onPitchDetected);
    setIsListening(success);
  };

  const stopListening = () => {
    audioEngine.stop();
    setIsListening(false);
    setPitchResult(null);
  };

  const toggleListening = async () => {
    if (isListening) {
      stopListening();
    } else {
      await startListening();
    }
  };

  const selectInstrument = (id: string) => {
    const inst = INSTRUMENTS.find((i) => i.id === id);
    if (!inst) return;
    setCurrentInstrument(inst);
    if (inst.tunings.length > 0) {
      setActiveTuning(inst.tunings[0]);
    }
    setSelectedString(null);
  };

  const selectTuning = (tuningId: string) => {
    const t = currentInstrument.tunings.find((item) => item.id === tuningId);
    if (t) {
      setActiveTuning(t);
      setSelectedString(null);
    }
  };

  const selectString = (str: InstrumentString | null) => {
    setSelectedString(str);
  };

  const playStringTone = (str: InstrumentString) => {
    const a4Scale = a4Calibration / 440;
    toneGenerator.playPluck(str.freq * a4Scale);
  };

  const setA4Calibration = (hz: number) => {
    setA4CalibrationState(hz);
  };

  const setSensitivity = (val: number) => {
    setSensitivityState(val);
  };

  return (
    <TunerContext.Provider
      value={{
        currentInstrument,
        activeTuning,
        tuningMode,
        selectedString,
        pitchResult,
        isListening,
        a4Calibration,
        sensitivity,
        soundFeedbackEnabled,
        hapticFeedbackEnabled,
        setTuningMode,
        selectInstrument,
        selectTuning,
        selectString,
        toggleListening,
        startListening,
        stopListening,
        playStringTone,
        setA4Calibration,
        setSensitivity,
        setSoundFeedbackEnabled,
        setHapticFeedbackEnabled,
      }}
    >
      {children}
    </TunerContext.Provider>
  );
};

export const useTuner = (): TunerContextType => {
  const context = useContext(TunerContext);
  if (!context) {
    throw new Error('useTuner must be used within TunerProvider');
  }
  return context;
};
