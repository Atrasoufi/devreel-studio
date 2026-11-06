import React, { useState } from 'react';
import { Scene, VisualType, Subtitle } from '../types';
import { CodeVisualizer } from './CodeVisualizer';
import { 
  FileText, Clock, Volume2, Sparkles, Plus, Trash2, 
  Code, RefreshCw, CheckCircle2, ChevronDown, ChevronUp,
  Play, Pause, Wand2, Tag
} from 'lucide-react';

interface ScriptEditorProps {
  scenes: Scene[];
  currentSceneIndex: number;
  onSelectScene: (index: number) => void;
  onUpdateScene: (index: number, updatedScene: Scene) => void;
  onAddScene: () => void;
  onDeleteScene: (index: number) => void;
  onGenerateSceneVoice: (index: number) => void;
  isGeneratingVoice: boolean;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  scenes,
  currentSceneIndex,
  onSelectScene,
  onUpdateScene,
  onAddScene,
  onDeleteScene,
  onGenerateSceneVoice,
  isGeneratingVoice,
}) => {
  const [activeTab, setActiveTab] = useState<'script' | 'code' | 'subtitles'>('script');

  const currentScene = scenes[currentSceneIndex] || scenes[0];

  if (!currentScene) {
    return <div className="text-slate-500 py-6 text-center">No scenes available.</div>;
  }

  // Estimate Persian reading speed: ~130 words per minute (~2.2 words/sec)
  const wordCount = currentScene.persianNarration
    ? currentScene.persianNarration.trim().split(/\s+/).length
    : 0;
  const estimatedSeconds = Math.max(3, Math.ceil(wordCount / 2.2));

  const visualTypes: { value: VisualType; label: string; icon: string }[] = [
    { value: 'code_editor', label: 'Code Editor', icon: '💻' },
    { value: 'callout_card', label: 'Callout Card', icon: '📌' },
    { value: 'diagram', label: 'Architecture Diagram', icon: '📐' },
    { value: 'terminal', label: 'Interactive Terminal', icon: '⌨️' },
    { value: 'comparison', label: 'Side-by-Side Comparison', icon: '⚖️' },
  ];

  const handleFieldChange = (field: keyof Scene, value: any) => {
    const updated = { ...currentScene, [field]: value };
    onUpdateScene(currentSceneIndex, updated);
  };

  const handleSubtitleChange = (subIdx: number, field: keyof Subtitle, val: any) => {
    const updatedSubs = [...(currentScene.subtitles || [])];
    updatedSubs[subIdx] = { ...updatedSubs[subIdx], [field]: val };
    handleFieldChange('subtitles', updatedSubs);
  };

  const handleAddSubtitle = () => {
    const lastSub = currentScene.subtitles?.[currentScene.subtitles.length - 1];
    const newStart = lastSub ? lastSub.endSecond : 0;
    const newEnd = newStart + 3;
    const newSub: Subtitle = {
      startSecond: newStart,
      endSecond: newEnd,
      persianText: 'متن زیرنویس جدید...',
      englishKeywords: 'Keyword',
    };
    handleFieldChange('subtitles', [...(currentScene.subtitles || []), newSub]);
  };

  const handleRemoveSubtitle = (subIdx: number) => {
    const updatedSubs = currentScene.subtitles.filter((_, idx) => idx !== subIdx);
    handleFieldChange('subtitles', updatedSubs);
  };

  return (
    <div className="space-y-4">
      {/* Scene Navigation Strip / Tabs */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {scenes.map((scene, idx) => {
            const isSelected = idx === currentSceneIndex;
            return (
              <button
                key={idx}
                onClick={() => onSelectScene(idx)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-violet-950 text-white border border-violet-500 shadow-md shadow-violet-950/50'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span className="font-bold text-cyan-400">#{scene.sceneNumber}</span>
                <span className="truncate max-w-[100px]">{scene.onScreenTitleEnglish || `Scene ${scene.sceneNumber}`}</span>
                <span className="text-[10px] text-slate-500">{scene.durationSeconds}s</span>
              </button>
            );
          })}

          <button
            onClick={onAddScene}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-cyan-300 hover:bg-slate-800 border border-dashed border-slate-700 transition-colors"
            title="Add Scene"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {scenes.length > 1 && (
            <button
              onClick={() => onDeleteScene(currentSceneIndex)}
              className="p-1.5 text-slate-500 hover:text-red-400 rounded hover:bg-red-950/30 transition-colors"
              title="Delete Scene"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Active Scene Editor Container */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        {/* Scene Meta Row: Visual Type & Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Visual Layout Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {visualTypes.map((vt) => (
                <button
                  key={vt.value}
                  onClick={() => handleFieldChange('visualType', vt.value)}
                  className={`p-2 rounded-lg border text-left text-xs transition-colors flex items-center gap-1.5 ${
                    currentScene.visualType === vt.value
                      ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{vt.icon}</span>
                  <span className="truncate">{vt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">Duration (Seconds)</label>
              <span className="text-xs font-mono text-cyan-400">
                Word count: {wordCount} (~{estimatedSeconds}s audio)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={3}
                max={25}
                step={1}
                value={currentScene.durationSeconds}
                onChange={(e) => handleFieldChange('durationSeconds', Number(e.target.value))}
                className="flex-1 accent-cyan-400"
              />
              <span className="w-12 text-center py-1 rounded bg-slate-950 border border-slate-800 font-mono text-xs text-white">
                {currentScene.durationSeconds}s
              </span>
            </div>
            {wordCount > currentScene.durationSeconds * 2.5 && (
              <p className="text-[11px] text-amber-400 leading-tight">
                ⚠️ Script text may be too long for {currentScene.durationSeconds} seconds. Consider increasing duration to {estimatedSeconds}s.
              </p>
            )}
          </div>
        </div>

        {/* On-screen Titles (Bilingual) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">
              عنوان فارسی روی صفحه (RTL Title)
            </label>
            <input
              type="text"
              value={currentScene.onScreenTitlePersian || ''}
              onChange={(e) => handleFieldChange('onScreenTitlePersian', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm font-fa dir-rtl text-white focus:outline-none focus:border-cyan-500"
              placeholder="مثال: چرا دیتابیس جنگو کند میشه؟"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">
              English Badge / Subtitle Title
            </label>
            <input
              type="text"
              value={currentScene.onScreenTitleEnglish || ''}
              onChange={(e) => handleFieldChange('onScreenTitleEnglish', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              placeholder="e.g. The Silent N+1 Killer"
            />
          </div>
        </div>

        {/* Sub-tabs for Narration Script, Code, Subtitles */}
        <div className="flex border-b border-slate-800 pt-2 gap-4">
          <button
            onClick={() => setActiveTab('script')}
            className={`pb-2 text-xs font-medium transition-colors border-b-2 ${
              activeTab === 'script'
                ? 'border-violet-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Persian Narration & Voice
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`pb-2 text-xs font-medium transition-colors border-b-2 ${
              activeTab === 'code'
                ? 'border-violet-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Real Code & Highlighting
          </button>
          <button
            onClick={() => setActiveTab('subtitles')}
            className={`pb-2 text-xs font-medium transition-colors border-b-2 ${
              activeTab === 'subtitles'
                ? 'border-violet-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Synchronized Subtitles ({currentScene.subtitles?.length || 0})
          </button>
        </div>

        {/* TAB 1: Narration & Voice */}
        {activeTab === 'script' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">
                  متن گویندگی فارسی (آموزشی، روان و صمیمی)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onGenerateSceneVoice(currentSceneIndex)}
                    disabled={isGeneratingVoice}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:from-violet-500 hover:to-cyan-500 transition-all font-medium disabled:opacity-50"
                  >
                    {isGeneratingVoice ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Volume2 className="w-3 h-3" />
                    )}
                    <span>Generate AI Voice (Gemini TTS)</span>
                  </button>
                </div>
              </div>
              <textarea
                value={currentScene.persianNarration}
                onChange={(e) => handleFieldChange('persianNarration', e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-fa text-slate-100 dir-rtl text-right focus:outline-none focus:border-cyan-500 leading-relaxed"
                placeholder="متن گویندگی فارسی این صحنه را بنویسید..."
              />
            </div>

            {/* English Technical Keywords */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-cyan-400" />
                <span>English Technical Terminology Spoken</span>
              </label>
              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg bg-slate-950 border border-slate-800">
                {currentScene.englishNarrationTerms?.map((term, tIdx) => (
                  <span
                    key={tIdx}
                    className="px-2 py-0.5 rounded bg-violet-950/80 border border-violet-700/60 text-cyan-300 text-xs font-mono"
                  >
                    {term}
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="+ Add term and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      e.preventDefault();
                      const newTerms = [
                        ...(currentScene.englishNarrationTerms || []),
                        e.currentTarget.value.trim(),
                      ];
                      handleFieldChange('englishNarrationTerms', newTerms);
                      e.currentTarget.value = '';
                    }
                  }}
                  className="bg-transparent text-xs text-white placeholder-slate-600 focus:outline-none ml-1 flex-1 min-w-[120px]"
                />
              </div>
            </div>

            {/* Animation & Visual Cue Notes */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">
                Visual Description & Animation Note
              </label>
              <input
                type="text"
                value={currentScene.animationNote || currentScene.visualDescription}
                onChange={(e) => handleFieldChange('animationNote', e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                placeholder="e.g. Neon pulse on line 4, typewriter effect..."
              />
            </div>
          </div>
        )}

        {/* TAB 2: Code & Highlighting */}
        {activeTab === 'code' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Programming Language</label>
                <select
                  value={currentScene.codeLanguage || 'python'}
                  onChange={(e) => handleFieldChange('codeLanguage', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="python">Python / Django</option>
                  <option value="sql">SQL / PostgreSQL</option>
                  <option value="bash">Bash / Terminal</option>
                  <option value="dockerfile">Dockerfile</option>
                  <option value="json">JSON / REST Payload</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">
                  Highlight Line Numbers (comma separated)
                </label>
                <input
                  type="text"
                  value={(currentScene.highlightLines || []).join(', ')}
                  onChange={(e) => {
                    const parsed = e.target.value
                      .split(',')
                      .map((x) => parseInt(x.trim(), 10))
                      .filter((x) => !isNaN(x));
                    handleFieldChange('highlightLines', parsed);
                  }}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  placeholder="e.g. 2, 4"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">
                Scene Code Snippet (Real Python/Django/SQL Code)
              </label>
              <textarea
                value={currentScene.codeSnippet}
                onChange={(e) => handleFieldChange('codeSnippet', e.target.value)}
                rows={6}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-slate-800 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                placeholder="# Code to display in this scene"
              />
            </div>

            <div>
              <span className="text-[11px] font-mono text-slate-400 block mb-1.5">
                LIVE PREVIEW:
              </span>
              <CodeVisualizer
                code={currentScene.codeSnippet}
                language={currentScene.codeLanguage || 'python'}
                highlightLines={currentScene.highlightLines || []}
              />
            </div>
          </div>
        )}

        {/* TAB 3: Synchronized Subtitles */}
        {activeTab === 'subtitles' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">
                Subtitles Synchronized for Instagram Reels
              </span>
              <button
                onClick={handleAddSubtitle}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Subtitle</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {(currentScene.subtitles || []).map((sub, sIdx) => (
                <div
                  key={sIdx}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-cyan-400 font-semibold">#{sIdx + 1}</span>
                      <div className="flex items-center gap-1 font-mono text-slate-400 text-[11px]">
                        <input
                          type="number"
                          step="0.5"
                          value={sub.startSecond}
                          onChange={(e) =>
                            handleSubtitleChange(sIdx, 'startSecond', parseFloat(e.target.value) || 0)
                          }
                          className="w-12 px-1 py-0.5 rounded bg-slate-900 border border-slate-700 text-center"
                        />
                        <span>s -</span>
                        <input
                          type="number"
                          step="0.5"
                          value={sub.endSecond}
                          onChange={(e) =>
                            handleSubtitleChange(sIdx, 'endSecond', parseFloat(e.target.value) || 0)
                          }
                          className="w-12 px-1 py-0.5 rounded bg-slate-900 border border-slate-700 text-center"
                        />
                        <span>s</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveSubtitle(sIdx)}
                      className="text-slate-500 hover:text-red-400 p-1"
                      title="Delete Subtitle"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={sub.persianText}
                    onChange={(e) => handleSubtitleChange(sIdx, 'persianText', e.target.value)}
                    placeholder="متن فارسی زیرنویس..."
                    className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs font-fa dir-rtl text-right text-white focus:outline-none focus:border-cyan-500"
                  />

                  <input
                    type="text"
                    value={sub.englishKeywords || ''}
                    onChange={(e) => handleSubtitleChange(sIdx, 'englishKeywords', e.target.value)}
                    placeholder="English Keywords (e.g. select_related, ForeignKey)"
                    className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
