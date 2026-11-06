import React from 'react';
import { 
  Film, Sparkles, Plus, Code2, Layers, Mic, 
  Download, BookOpen, Terminal, CheckCircle2 
} from 'lucide-react';

export type StudioTab = 'input' | 'editor' | 'storyboard' | 'voiceover' | 'export';

interface HeaderProps {
  activeTab: StudioTab;
  onTabChange: (tab: StudioTab) => void;
  onNewReel: () => void;
  reelTitle?: string;
  totalScenesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onNewReel,
  reelTitle,
  totalScenesCount,
}) => {
  const tabs: { id: StudioTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'input', label: '1. Topic & AI Analysis', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'editor', label: '2. Script & Code Editor', icon: <Code2 className="w-3.5 h-3.5" />, badge: `${totalScenesCount}` },
    { id: 'storyboard', label: '3. Storyboard', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'voiceover', label: '4. Voiceover (TTS)', icon: <Mic className="w-3.5 h-3.5" /> },
    { id: 'export', label: '5. Export & Caption', icon: <Download className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800/80">
      {/* Top Studio Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-cyan-400 p-[1.5px] shadow-lg shadow-violet-600/20">
            <div className="w-full h-full rounded-[10px] bg-[#090d16] flex items-center justify-center">
              <Film className="w-4 h-4 text-cyan-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                DevReel <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Studio</span>
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-violet-950/70 border border-violet-700/50 text-violet-300">
                Python & Django
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              AI-Powered Educational Instagram Reel Creator for Backend Developers
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Gemini 3.8 Flash & Lite TTS</span>
          </div>

          <button
            onClick={onNewReel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>New Reel</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-slate-800/40 py-1.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-violet-900/60 to-cyan-950/60 text-white border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <span className={isActive ? 'text-cyan-400' : 'text-slate-500'}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  isActive ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/50' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
