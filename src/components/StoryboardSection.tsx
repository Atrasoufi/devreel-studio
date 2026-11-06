import React from 'react';
import { Scene, ReelPackage } from '../types';
import { CodeVisualizer } from './CodeVisualizer';
import { 
  Layers, Clock, ArrowUp, ArrowDown, Sparkles, 
  Trash2, Plus, Volume2, CheckCircle2 
} from 'lucide-react';

interface StoryboardSectionProps {
  reel: ReelPackage;
  currentSceneIndex: number;
  onSelectScene: (index: number) => void;
  onMoveScene: (fromIndex: number, toIndex: number) => void;
  onAddScene: () => void;
  onDeleteScene: (index: number) => void;
}

export const StoryboardSection: React.FC<StoryboardSectionProps> = ({
  reel,
  currentSceneIndex,
  onSelectScene,
  onMoveScene,
  onAddScene,
  onDeleteScene,
}) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>STORYBOARD TIMELINE ({reel.scenes.length} Scenes)</span>
          </h3>
          <span className="text-[11px] text-slate-400">
            Total Target Duration: {reel.targetDurationSeconds}s · 9:16 Vertical Reel Layout
          </span>
        </div>

        <button
          onClick={onAddScene}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-xs font-semibold hover:from-violet-500 hover:to-cyan-500 transition-colors shadow-md"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Scene</span>
        </button>
      </div>

      {/* Grid of Scene Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reel.scenes.map((scene, idx) => {
          const isSelected = idx === currentSceneIndex;
          const hasAudio = !!scene.audioBase64;

          return (
            <div
              key={idx}
              onClick={() => onSelectScene(idx)}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-violet-950/40 border-cyan-400 shadow-xl shadow-violet-950/40 ring-1 ring-cyan-400/50'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Scene Card Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-xs font-bold text-cyan-400">
                    Scene #{scene.sceneNumber}
                  </span>
                  <span className="text-xs font-semibold text-white truncate max-w-[150px]">
                    {scene.onScreenTitleEnglish || 'Scene Title'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {scene.durationSeconds}s
                  </span>

                  {hasAudio && (
                    <span className="p-1 rounded bg-emerald-950 border border-emerald-700/60 text-emerald-400" title="Audio Generated">
                      <Volume2 className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>

              {/* Persian Title and Spoken Narration Preview */}
              <div className="space-y-1.5 my-2">
                <div className="text-xs font-fa font-bold text-slate-200 dir-rtl text-right">
                  {scene.onScreenTitlePersian}
                </div>
                <p className="text-[11px] font-fa text-slate-400 dir-rtl text-right line-clamp-2 leading-relaxed">
                  {scene.persianNarration}
                </p>
              </div>

              {/* Mini Code or Visual Preview */}
              {scene.codeSnippet && (
                <div className="my-2 rounded-lg overflow-hidden border border-slate-800 pointer-events-none opacity-90">
                  <CodeVisualizer
                    code={scene.codeSnippet.split('\n').slice(0, 4).join('\n')}
                    language={scene.codeLanguage || 'python'}
                    highlightLines={scene.highlightLines || []}
                    isReelMode={true}
                    showLineNumbers={false}
                  />
                </div>
              )}

              {/* Card Footer: Re-ordering and Delete */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-2 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase text-violet-400">
                    {scene.visualType.replace('_', ' ')}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-[10px] text-slate-500">
                    {scene.subtitles?.length || 0} subtitles
                  </span>
                </div>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    disabled={idx === 0}
                    onClick={() => onMoveScene(idx, idx - 1)}
                    className="p-1 rounded hover:bg-slate-800 disabled:opacity-20 text-slate-400"
                    title="Move Scene Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={idx === reel.scenes.length - 1}
                    onClick={() => onMoveScene(idx, idx + 1)}
                    className="p-1 rounded hover:bg-slate-800 disabled:opacity-20 text-slate-400"
                    title="Move Scene Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  {reel.scenes.length > 1 && (
                    <button
                      onClick={() => onDeleteScene(idx)}
                      className="p-1 rounded hover:bg-red-950/40 text-slate-500 hover:text-red-400"
                      title="Delete Scene"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
