import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useTuner } from '../context/TunerContext';
import type { AppTheme } from '../types';
import { Check, RotateCcw, Volume2, Smartphone, SlidersHorizontal, Palette, Info } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const {
    a4Calibration,
    setA4Calibration,
    sensitivity,
    setSensitivity,
    soundFeedbackEnabled,
    setSoundFeedbackEnabled,
    hapticFeedbackEnabled,
    setHapticFeedbackEnabled,
  } = useTuner();

  const themes: {
    id: AppTheme;
    name: string;
    desc: string;
    colors: string[];
  }[] = [
    {
      id: 'airy-pastel',
      name: 'Воздушная пастель (По умолчанию)',
      desc: 'Мягкие светлые тона утреннего неба, лаванда и нежный аквамарин',
      colors: ['#F3F7FD', '#6499F8', '#987BFA', '#34C78B'],
    },
    {
      id: 'midnight-dark',
      name: 'Глубокая ночь (Midnight)',
      desc: 'Эстетичный темный режим с неоновыми светящимися струнами',
      colors: ['#0A0E17', '#38BDF8', '#818CF8', '#10B981'],
    },
    {
      id: 'mint-breeze',
      name: 'Мятный бриз (Mint Breeze)',
      desc: 'Свежая пастельно-мятная гамма с эвкалиптовыми акцентами',
      colors: ['#F0F9F6', '#29B28D', '#20A69D', '#19BF7F'],
    },
  ];

  return (
    <div className="view-content settings-view">
      <h2 className="section-header-title">Настройки</h2>
      <p className="section-header-desc">Персонализация внешнего вида и параметров тюнера</p>

      {/* Theme Selection */}
      <div className="settings-group">
        <span className="group-title">
          <Palette size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
          Оформление и тема
        </span>

        <div className="themes-grid">
          {themes.map((t) => {
            const isActive = theme === t.id;
            return (
              <div
                key={t.id}
                className={`theme-card-option ${isActive ? 'active' : ''}`}
                onClick={() => setTheme(t.id)}
              >
                <div className="theme-info-box">
                  <div className="theme-name">{t.name}</div>
                  <div className="theme-desc">{t.desc}</div>
                </div>

                <div className="theme-preview-palette">
                  {t.colors.map((c, i) => (
                    <span
                      key={i}
                      className="palette-swatch"
                      style={{ background: c }}
                    />
                  ))}
                  {isActive && <Check size={18} color="var(--accent-primary)" style={{ marginLeft: 6 }} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Calibration & Pitch Settings */}
      <div className="settings-group">
        <span className="group-title">
          <SlidersHorizontal size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
          Калибровка и аудио
        </span>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* A4 calibration */}
          <div className="setting-row">
            <div className="setting-row-header">
              <span className="setting-label">Базовая частота (Ля 1-й октавы / A4):</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="setting-value">{a4Calibration} Hz</span>
                {a4Calibration !== 440 && (
                  <button
                    className="btn-icon"
                    style={{ width: 28, height: 28 }}
                    onClick={() => setA4Calibration(440)}
                    title="Сбросить на 440 Hz"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>
            </div>
            <input
              type="range"
              min="430"
              max="450"
              step="1"
              value={a4Calibration}
              onChange={(e) => setA4Calibration(Number(e.target.value))}
              className="slider-input"
            />
          </div>

          <div style={{ height: 1, background: 'var(--border-soft)' }} />

          {/* Sensitivity */}
          <div className="setting-row">
            <div className="setting-row-header">
              <span className="setting-label">Шумоподавление (порог чувствительности):</span>
              <span className="setting-value">{Math.round((0.03 - sensitivity) * 3333)}%</span>
            </div>
            <input
              type="range"
              min="0.002"
              max="0.025"
              step="0.001"
              value={sensitivity}
              onChange={(e) => setSensitivity(Number(e.target.value))}
              className="slider-input"
            />
          </div>

          <div style={{ height: 1, background: 'var(--border-soft)' }} />

          {/* Feedback Toggles */}
          <div className="toggle-switch-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Volume2 size={18} color="var(--accent-primary)" />
              <span className="setting-label">Звуковой сигнал при попадании в тон</span>
            </div>
            <input
              type="checkbox"
              checked={soundFeedbackEnabled}
              onChange={(e) => setSoundFeedbackEnabled(e.target.checked)}
              style={{ width: 20, height: 20, cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
            />
          </div>

          <div className="toggle-switch-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Smartphone size={18} color="var(--accent-primary)" />
              <span className="setting-label">Вибрация (Haptic) при попадании в тон</span>
            </div>
            <input
              type="checkbox"
              checked={hapticFeedbackEnabled}
              onChange={(e) => setHapticFeedbackEnabled(e.target.checked)}
              style={{ width: 20, height: 20, cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
            />
          </div>
        </div>
      </div>

      {/* About App */}
      <div className="settings-group">
        <span className="group-title">
          <Info size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
          О приложении
        </span>
        <div className="glass-card" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <strong>EasyTuna v1.0</strong>
          <p style={{ marginTop: 4 }}>
            Тюнер нового поколения с интеллектуальным распознаванием нот (алгоритм автокорреляции YIN) и поддержкой 6-струнной гитары, бас-гитары и укулеле.
          </p>
          <p style={{ marginTop: 6, fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
            Разработано с возможностью моментального добавления новых строев и инструментов через конфигурационные файлы.
          </p>
        </div>
      </div>
    </div>
  );
};
