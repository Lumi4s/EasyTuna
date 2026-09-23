import React from 'react';
import { useTuner } from '../../context/TunerContext';
import type { InstrumentString } from '../../types';

export const HeadstockView: React.FC = () => {
  const {
    activeTuning,
    selectedString,
    pitchResult,
    tuningMode,
    selectString,
    playStringTone,
  } = useTuner();

  const handlePegClick = (str: InstrumentString) => {
    playStringTone(str);
    if (tuningMode === 'manual') {
      selectString(selectedString?.id === str.id ? null : str);
    } else {
      selectString(str);
    }
  };

  const isLeftString = (str: InstrumentString) => str.pegSide === 'left';

  const leftStrings = activeTuning.strings
    .filter(isLeftString)
    .sort((a, b) => b.pegIndex - a.pegIndex); // Top to bottom

  const rightStrings = activeTuning.strings
    .filter((s) => !isLeftString(s))
    .sort((a, b) => b.pegIndex - a.pegIndex); // Top to bottom

  // Geometry configuration for SVG (viewBox="0 0 380 430")
  const totalStrings = activeTuning.strings.length;
  const nutY = 275;
  const nutHeight = 12;
  const nutTopY = nutY;
  const nutBottomY = nutY + nutHeight;
  const fretboardBottomY = 430;

  // Nut width and string spacing
  const nutWidth = 84;
  const nutLeft = 190 - nutWidth / 2; // 148
  const nutRight = 190 + nutWidth / 2; // 232
  const stringNutSpacing = nutWidth / (totalStrings + 1);

  // Helper to get slot X for a string
  const getNutSlotX = (str: InstrumentString) => {
    // stringNumber 1 is highest pitch (rightmost), stringNumber N is lowest (leftmost)
    const slotIdx = totalStrings - str.stringNumber + 1;
    return nutLeft + slotIdx * stringNutSpacing;
  };

  // Peg button & post coordinates
  const getCoordinates = (str: InstrumentString) => {
    const isLeft = isLeftString(str);
    const sideList = isLeft ? leftStrings : rightStrings;
    const count = sideList.length;

    // Y positions: evenly spaced from ~Y=85 to ~Y=225
    const minY = count === 2 ? 115 : 85;
    const maxY = count === 2 ? 205 : 225;
    const ySpacing = count > 1 ? (maxY - minY) / (count - 1) : 0;

    // Index from top
    const indexFromTop = sideList.findIndex((s) => s.id === str.id);
    const pegY = minY + indexFromTop * ySpacing;

    // Peg button center X
    const pegCenterX = isLeft ? 45 : 335;

    // Post center on headstock
    const postX = isLeft ? 144 : 236;

    // Nut slot X
    const nutX = getNutSlotX(str);

    return {
      pegCenterX,
      pegY,
      postX,
      postY: pegY,
      nutX,
      fretX: nutX, // straight down the neck
    };
  };

  const getStringStatus = (str: InstrumentString) => {
    const isDetected = pitchResult?.closestString?.id === str.id;
    const isSelected = selectedString?.id === str.id;
    const isInTune = isDetected && Boolean(pitchResult?.inTune);

    return {
      isActive: isDetected || isSelected,
      isInTune,
    };
  };

  return (
    <div className="headstock-container">
      <svg
        className="headstock-svg"
        viewBox="0 0 380 430"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle wood shadow */}
          <filter id="woodShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodOpacity="0.16" />
          </filter>

          {/* Peg button shadow */}
          <filter id="pegShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.14" />
          </filter>

          {/* Glowing string filter */}
          <filter id="stringGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Headstock body gradient */}
          <linearGradient id="headstockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--headstock-wood)" />
            <stop offset="100%" stopColor="var(--headstock-wood)" stopOpacity="0.85" />
          </linearGradient>

          {/* Fretboard gradient */}
          <linearGradient id="fretboardGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1E2430" stopOpacity="0.12" />
            <stop offset="50%" stopColor="#1E2430" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#1E2430" stopOpacity="0.12" />
          </linearGradient>

          {/* Metallic shaft / post gradient */}
          <linearGradient id="metalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="45%" stopColor="#CAD5E8" />
            <stop offset="70%" stopColor="#8A9BB5" />
            <stop offset="100%" stopColor="#B8C5DA" />
          </linearGradient>
        </defs>

        {/* 1. GUITAR HEADSTOCK WOOD BODY */}
        <g filter="url(#woodShadow)">
          {/* Classic curved headstock path with Martin/Gibson dual-curve crest */}
          <path
            d={`
              M 148 ${nutTopY}
              C 134 230, 130 170, 126 120
              C 124 75, 118 60, 132 44
              C 146 28, 168 36, 190 48
              C 212 36, 234 28, 248 44
              C 262 60, 256 75, 254 120
              C 250 170, 246 230, 232 ${nutTopY}
              Z
            `}
            fill="url(#headstockGrad)"
            stroke="var(--headstock-border)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Inner decorative bevel line */}
          <path
            d={`
              M 152 ${nutTopY - 6}
              C 140 226, 136 170, 132 122
              C 130 82, 126 68, 137 54
              C 148 40, 168 46, 190 56
              C 212 46, 232 40, 243 54
              C 254 68, 250 82, 248 122
              C 244 170, 240 226, 228 ${nutTopY - 6}
            `}
            fill="none"
            stroke="var(--headstock-border)"
            strokeWidth="1"
            strokeOpacity="0.45"
          />
        </g>

        {/* Brand Text on Headstock */}
        <text
          x="190"
          y="78"
          textAnchor="middle"
          fill="var(--text-tertiary)"
          fontSize="8.5"
          fontWeight="800"
          letterSpacing="2.8"
          opacity="0.85"
        >
          EASYTUNA
        </text>

        {/* Truss Rod Cover Plate */}
        <path
          d="M 183 234 L 197 234 L 194 254 L 186 254 Z"
          fill="var(--headstock-border)"
          opacity="0.75"
        />
        <circle cx="190" cy="238" r="1.5" fill="#FFFFFF" opacity="0.8" />
        <circle cx="190" cy="250" r="1.5" fill="#FFFFFF" opacity="0.8" />

        {/* 2. FRETBOARD BELOW NUT */}
        <rect
          x={nutLeft}
          y={nutBottomY}
          width={nutWidth}
          height={fretboardBottomY - nutBottomY}
          fill="url(#fretboardGrad)"
          stroke="var(--headstock-border)"
          strokeWidth="1.5"
        />

        {/* Fret wire 1 */}
        <line
          x1={nutLeft}
          y1="340"
          x2={nutRight}
          y2="340"
          stroke="var(--headstock-border)"
          strokeWidth="2.5"
        />
        {/* Fret wire 2 */}
        <line
          x1={nutLeft}
          y1="395"
          x2={nutRight}
          y2="395"
          stroke="var(--headstock-border)"
          strokeWidth="2.5"
        />

        {/* Mother of Pearl Position Inlay Dot (3rd Fret) */}
        <circle
          cx="190"
          cy="367"
          r="4.5"
          fill="#FFFFFF"
          stroke="var(--headstock-border)"
          strokeWidth="1"
          opacity="0.8"
        />

        {/* 3. GUITAR NUT (Порожек) */}
        <rect
          x={nutLeft}
          y={nutTopY}
          width={nutWidth}
          height={nutHeight}
          rx="3"
          fill="#FCFDFD"
          stroke="var(--headstock-border)"
          strokeWidth="1.5"
          filter="url(#woodShadow)"
        />

        {/* Nut grooves for strings */}
        {activeTuning.strings.map((str) => {
          const slotX = getNutSlotX(str);
          return (
            <line
              key={`nut-slot-${str.id}`}
              x1={slotX}
              y1={nutTopY}
              x2={slotX}
              y2={nutBottomY}
              stroke="var(--headstock-border)"
              strokeWidth="1.8"
            />
          );
        })}

        {/* 4. TUNING POSTS AND CONNECTING SHAFTS */}
        {activeTuning.strings.map((str) => {
          const { pegCenterX, pegY, postX, postY } = getCoordinates(str);
          const { isActive, isInTune } = getStringStatus(str);

          return (
            <g key={`post-shaft-${str.id}`}>
              {/* Chrome connecting shaft from peg dial to post */}
              <line
                x1={pegCenterX}
                y1={pegY}
                x2={postX}
                y2={postY}
                stroke="url(#metalGrad)"
                strokeWidth="5"
                strokeLinecap="round"
              />

              {/* Tuning Post on headstock (metal cylinder) */}
              <circle
                cx={postX}
                cy={postY}
                r="7"
                fill="url(#metalGrad)"
                stroke="var(--headstock-border)"
                strokeWidth="1.5"
              />
              <circle
                cx={postX}
                cy={postY}
                r="3"
                fill={isInTune ? 'var(--color-intune)' : isActive ? 'var(--accent-primary)' : '#7C8EA9'}
              />
            </g>
          );
        })}

        {/* 5. STRINGS (From Post -> Nut Slot -> Fretboard Bottom) */}
        {activeTuning.strings.map((str) => {
          const { postX, postY, nutX, fretX } = getCoordinates(str);
          const { isActive, isInTune } = getStringStatus(str);
          const thickness = str.thickness || 2;

          let strokeColor = 'var(--string-color)';
          if (isInTune) strokeColor = 'var(--color-intune)';
          else if (isActive) strokeColor = 'var(--accent-primary)';

          return (
            <g key={`string-${str.id}`} filter={isActive ? 'url(#stringGlow)' : undefined}>
              {/* Headstock segment: Post to Nut */}
              <line
                x1={postX}
                y1={postY}
                x2={nutX}
                y2={nutTopY}
                stroke={strokeColor}
                strokeWidth={thickness}
                strokeLinecap="round"
                className={`guitar-string-svg ${isActive ? 'active' : ''} ${isInTune ? 'in-tune' : ''}`}
              />

              {/* Fretboard segment: Nut to Bottom */}
              <line
                x1={nutX}
                y1={nutBottomY}
                x2={fretX}
                y2={fretboardBottomY}
                stroke={strokeColor}
                strokeWidth={thickness}
                strokeLinecap="round"
                className={`guitar-string-svg ${isActive ? 'active' : ''} ${isInTune ? 'in-tune' : ''}`}
              />
            </g>
          );
        })}

        {/* 6. INTERACTIVE TUNING PEGS (Dials) */}
        {activeTuning.strings.map((str) => {
          const { pegCenterX, pegY } = getCoordinates(str);
          const { isActive, isInTune } = getStringStatus(str);

          let dialFill = 'var(--peg-body)';
          let strokeColor = 'var(--peg-border)';
          let letterColor = 'var(--text-primary)';

          if (isInTune) {
            dialFill = 'var(--color-intune-soft)';
            strokeColor = 'var(--color-intune)';
            letterColor = 'var(--color-intune)';
          } else if (isActive) {
            dialFill = 'var(--bg-surface-elevated)';
            strokeColor = 'var(--accent-primary)';
            letterColor = 'var(--accent-primary)';
          }

          return (
            <g
              key={`peg-${str.id}`}
              transform={`translate(${pegCenterX}, ${pegY})`}
              className={`svg-peg-unit ${isActive ? 'active' : ''} ${isInTune ? 'in-tune' : ''}`}
              onClick={() => handlePegClick(str)}
              style={{ cursor: 'pointer' }}
            >
              {/* Active / In-Tune Outer Pulsing Aura */}
              {isActive && (
                <circle
                  cx="0"
                  cy="0"
                  r="34"
                  fill="none"
                  stroke={isInTune ? 'var(--color-intune)' : 'var(--accent-primary)'}
                  strokeWidth="2.5"
                  strokeOpacity="0.4"
                  className={isInTune ? 'pulse-intune-ring' : 'pulse-active-ring'}
                />
              )}

              {/* Peg Dial Button Body & Texts: Centered at (0, 0) */}
              <g className="peg-dial-interactive">
                <circle
                  cx="0"
                  cy="0"
                  r="26"
                  fill={dialFill}
                  stroke={strokeColor}
                  strokeWidth={isActive ? '2.8' : '2'}
                  filter="url(#pegShadow)"
                  className="peg-circle-surface"
                />

                {/* Note Name Text */}
                <text
                  x="0"
                  y="6"
                  textAnchor="middle"
                  fill={letterColor}
                  fontSize="17"
                  fontWeight="800"
                  fontFamily="var(--font-sans)"
                  pointerEvents="none"
                >
                  {str.name}
                </text>

                {/* Octave Subscript */}
                <text
                  x="12"
                  y="10"
                  textAnchor="start"
                  fill="var(--text-secondary)"
                  fontSize="9"
                  fontWeight="700"
                  fontFamily="var(--font-sans)"
                  pointerEvents="none"
                >
                  {str.octave}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
