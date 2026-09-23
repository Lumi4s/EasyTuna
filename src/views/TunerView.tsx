import React from 'react';
import { PitchMeter } from '../components/tuner/PitchMeter';
import { HeadstockView } from '../components/tuner/HeadstockView';
import { useTuner } from '../context/TunerContext';
import { Mic, MicOff, Volume2 } from 'lucide-react';

export const TunerView: React.FC<{ onOpenInstruments: () => void }> = () => {
  const { isListening, toggleListening, currentInstrument, activeTuning, playStringTone } = useTuner();

  const handleTestStrum = () => {
    // Play quick harmonic chord for demonstration
    activeTuning.strings.forEach((str, idx) => {
      setTimeout(() => {
        playStringTone(str);
      }, idx * 140);
    });
  };

  return (
    <div className="view-content tuner-view">
      {/* Cents meter & detected note */}
      <PitchMeter />

      {/* Interactive Headstock & Pegs */}
      <HeadstockView />

      {/* Bottom Microphone Control Bar */}
      <div className="tuner-mic-bar">
        <button
          className={`mic-toggle-btn ${isListening ? 'listening' : ''}`}
          onClick={toggleListening}
        >
          {isListening ? (
            <>
              <div className="mic-pulse-dot" />
              <Mic size={18} />
              <span>Микрофон активен</span>
            </>
          ) : (
            <>
              <MicOff size={18} />
              <span>Включить микрофон</span>
            </>
          )}
        </button>

        <button
          className="btn-icon"
          onClick={handleTestStrum}
          title={`Прослушать строй: ${currentInstrument.name}`}
        >
          <Volume2 size={18} />
        </button>
      </div>
    </div>
  );
};
