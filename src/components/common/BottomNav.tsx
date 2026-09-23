import React from 'react';
import type { AppTab } from '../../types';
import { Disc, Settings, Sliders } from 'lucide-react';

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="bottom-nav-container">
      <div className="bottom-nav-glass">
        <button
          className={`nav-item-btn ${activeTab === 'tuner' ? 'active' : ''}`}
          onClick={() => onTabChange('tuner')}
        >
          <Sliders size={22} className="nav-icon" />
          <span className="nav-label">Тюнер</span>
        </button>

        <button
          className={`nav-item-btn ${activeTab === 'instruments' ? 'active' : ''}`}
          onClick={() => onTabChange('instruments')}
        >
          <Disc size={22} className="nav-icon" />
          <span className="nav-label">Инструменты</span>
        </button>

        <button
          className={`nav-item-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => onTabChange('settings')}
        >
          <Settings size={22} className="nav-icon" />
          <span className="nav-label">Настройки</span>
        </button>
      </div>
    </nav>
  );
};
