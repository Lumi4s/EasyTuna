import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { TunerProvider } from './context/TunerContext';
import type { AppTab } from './types';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { TunerView } from './views/TunerView';
import { InstrumentsView } from './views/InstrumentsView';
import { SettingsView } from './views/SettingsView';
import './styles/App.css';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('tuner');

  return (
    <div className="app-viewport">
      <div className="app-container">
        {/* Header */}
        <Header onOpenInstruments={() => setActiveTab('instruments')} />

        {/* Dynamic View Pages */}
        {activeTab === 'tuner' && (
          <TunerView onOpenInstruments={() => setActiveTab('instruments')} />
        )}
        {activeTab === 'instruments' && (
          <InstrumentsView onInstrumentSelected={() => setActiveTab('tuner')} />
        )}
        {activeTab === 'settings' && <SettingsView />}

        {/* Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <TunerProvider>
        <AppContent />
      </TunerProvider>
    </ThemeProvider>
  );
};

export default App;
