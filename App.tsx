import React, { useState } from 'react';
import Header from './components/Header';
import ScriptEditor from './components/ScriptEditor';
import Dashboard from './components/Dashboard';
import LiveStudio from './components/LiveStudio';
import { AppView } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);

  const renderContent = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard />;
      case AppView.EDITOR:
        return <ScriptEditor />;
      case AppView.LIVE_STUDIO:
        return <LiveStudio />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-indigo-500 selection:text-white">
      <Header currentView={currentView} setView={setCurrentView} />
      <main>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;