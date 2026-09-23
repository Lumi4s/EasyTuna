import React from 'react';
import { useTuner } from '../../context/TunerContext';

export const PitchMeter: React.FC = () => {
  const { pitchResult, isListening, activeTuning, selectedString } = useTuner();

  // Determine note to display
  let noteLetter = '-';
  let noteOctave = '';
  let statusText = isListening ? 'Сыграйте струну...' : 'Нажмите «Слушать»';
  let statusClass = 'status-idle';
  let needlePositionPercent = 50;
  let needleStatusClass = '';
  let freqText = 'Готов к настройке';

  if (pitchResult && pitchResult.frequency > 0) {
    const rawNote = pitchResult.noteName;
    noteLetter = rawNote.slice(0, -1);
    noteOctave = rawNote.slice(-1);

    const cents = pitchResult.cents;
    // Map -50..+50 cents to 8%..92% of the bar width
    needlePositionPercent = 50 + (cents / 50) * 42;
    needlePositionPercent = Math.max(5, Math.min(95, needlePositionPercent));

    if (pitchResult.inTune) {
      statusText = 'В тон!';
      statusClass = 'status-intune';
      needleStatusClass = 'intune';
    } else if (cents < -3) {
      statusText = `Ниже на ${Math.abs(cents)} ц.`;
      statusClass = 'status-flat';
      needleStatusClass = 'flat';
    } else {
      statusText = `Выше на ${cents} ц.`;
      statusClass = 'status-sharp';
      needleStatusClass = 'sharp';
    }

    freqText = `${pitchResult.frequency} Hz (цель: ${Math.round(pitchResult.targetFrequency * 10) / 10} Hz)`;
  } else if (selectedString) {
    noteLetter = selectedString.name;
    noteOctave = String(selectedString.octave);
    freqText = `Цель: ${selectedString.freq} Hz`;
    statusText = `Ручной выбор: струна ${selectedString.stringNumber}`;
  } else if (activeTuning && activeTuning.strings.length > 0) {
    const firstStr = activeTuning.strings[0];
    freqText = `Строй: ${activeTuning.name}`;
    noteLetter = firstStr.name;
    noteOctave = String(firstStr.octave);
  }

  return (
    <div className="pitch-meter-container">
      <div className="glass-card pitch-meter-card">
        <div className="meter-header">
          <span className="meter-target-badge">{activeTuning.name.split(' ')[0]}</span>
          <span className={`meter-status-text ${statusClass}`}>{statusText}</span>
        </div>

        {/* Big Note Visualization */}
        <div className="detected-note-box">
          <span className={`note-main-letter ${statusClass}`}>{noteLetter}</span>
          {noteOctave && <span className="note-octave">{noteOctave}</span>}
        </div>

        <div className="note-frequency">{freqText}</div>

        {/* Cents Scale */}
        <div className="scale-wrapper">
          <div className="scale-track">
            {/* Center zero mark */}
            <div className="center-marker" />

            {/* Dynamic Needle */}
            <div
              className="cents-needle"
              style={{ left: `${needlePositionPercent}%` }}
            >
              <div className="needle-pointer">
                <div className={`needle-pip ${needleStatusClass}`} />
              </div>
            </div>
          </div>

          <div className="scale-labels">
            <span>-50b</span>
            <span>-25</span>
            <span style={{ color: 'var(--color-intune)', fontWeight: 800 }}>0</span>
            <span>+25</span>
            <span>+50#</span>
          </div>
        </div>
      </div>
    </div>
  );
};
