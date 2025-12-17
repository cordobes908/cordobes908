import React from 'react';
import { Mic, LayoutDashboard, FileText, Settings } from 'lucide-react';
import { AppView } from '../types';

interface HeaderProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView }) => {
  const NavItem = ({ view, icon: Icon, label }: { view: AppView; icon: any; label: string }) => (
    <button
      onClick={() => setView(view)}
      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        currentView === view 
          ? 'bg-indigo-900/50 text-indigo-400' 
          : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );

  return (
    <header className="border-b border-gray-800 bg-gray-900/95 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Mic className="text-white" size={20} />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">VoxCast</span>
            </div>
            <nav className="hidden md:ml-8 md:flex space-x-2">
              <NavItem view={AppView.DASHBOARD} icon={LayoutDashboard} label="Mis Podcasts" />
              <NavItem view={AppView.EDITOR} icon={FileText} label="Editor de Guiones" />
              <NavItem view={AppView.LIVE_STUDIO} icon={Mic} label="Estudio en Vivo" />
            </nav>
          </div>
          <div className="flex items-center">
             <button className="p-2 text-gray-400 hover:text-white rounded-full">
                <Settings size={20} />
             </button>
             <div className="ml-3">
                 <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 border-2 border-gray-800 cursor-pointer"></div>
             </div>
          </div>
        </div>
      </div>
      {/* Mobile nav */}
      <div className="md:hidden border-t border-gray-800 flex justify-around p-2">
          <button onClick={() => setView(AppView.DASHBOARD)} className={`p-2 ${currentView === AppView.DASHBOARD ? 'text-indigo-400' : 'text-gray-400'}`}><LayoutDashboard size={24}/></button>
          <button onClick={() => setView(AppView.EDITOR)} className={`p-2 ${currentView === AppView.EDITOR ? 'text-indigo-400' : 'text-gray-400'}`}><FileText size={24}/></button>
          <button onClick={() => setView(AppView.LIVE_STUDIO)} className={`p-2 ${currentView === AppView.LIVE_STUDIO ? 'text-indigo-400' : 'text-gray-400'}`}><Mic size={24}/></button>
      </div>
    </header>
  );
};

export default Header;