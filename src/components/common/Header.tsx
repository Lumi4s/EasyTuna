import React from 'react';
import { useTuner } from '../../context/TunerContext';
import { Music, Radio, Hand } from 'lucide-react';

export const Header: React.FC<{ onOpenInstruments: () => void }> = ({ onOpenInstruments }) => {
  const { currentInstrument, activeTuning, tuningMode, setTuningMode } = useTuner();

  const toggleMode = () => {
    setTuningMode(tuningMode === 'auto' ? 'manual' : 'auto');
  };

  return (
    <header className="app-header">
      <div className="header-brand" onClick={onOpenInstruments} style={{ cursor: 'pointer' }}>
        <div className="brand-logo-icon">
          <Music size={20} strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="brand-title">EasyTuna</h1>
          <div className="header-instrument-badge">
            {currentInstrument.name} • {activeTuning.name.split(' ')[0]}
          </div>
        </div>
      </div>

      <div className="header-actions">
        <button
          className={`btn-pill ${tuningMode === 'auto' ? 'active' : ''}`}
          onClick={toggleMode}
          title={tuningMode === 'auto' ? 'Автоматическое определение' : 'Ручной выбор струны'}
        >
          {tuningMode === 'auto' ? <Radio size={14} /> : <Hand size={14} />}
          <span>{tuningMode === 'auto' ? 'Авто' : 'Ручной'}</span>
        </button>
      </div>
    </header>
  );
};
