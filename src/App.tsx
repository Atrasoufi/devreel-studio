import React, { useState } from 'react';
import { ReelPackage, Scene, Technology, TopicAnalysis } from './types';
import { DEFAULT_INITIAL_REEL, PRESET_TOPICS } from './data/presets';
import { Header, StudioTab } from './components/Header';
import { TopicInputSection } from './components/TopicInputSection';
import { ScriptEditor } from './components/ScriptEditor';
import { StoryboardSection } from './components/StoryboardSection';
import { VoiceoverSettings } from './components/VoiceoverSettings';
import { VideoExporter } from './components/VideoExporter';
import { ReelPreviewPlayer } from './components/ReelPreviewPlayer';
import { 
  Sparkles, CheckCircle2, AlertCircle, RefreshCw, 
  HelpCircle, Smartphone, SlidersHorizontal 
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<StudioTab>('input');
  const [reel, setReel] = useState<ReelPackage>(DEFAULT_INITIAL_REEL);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [analysis, setAnalysis] = useState<TopicAnalysis | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [mobileViewMode, setMobileViewMode] = useState<'workspace' | 'preview'>('workspace');

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  // 1. Analyze Topic with Gemini
  const handleAnalyzeTopic = async (data: {
    topic: string;
    notes: string;
    codeSnippet: string;
    technology: Technology;
  }) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to analyze topic');
      }

      setAnalysis(result.analysis);
      showNotification('Technical analysis verified with Gemini! Review the report below.', 'success');
    } catch (err: any) {
      console.error('Analysis error:', err);
      showNotification(err.message || 'Error communicating with Gemini API.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 2. Generate Complete Reel Package
  const handleGenerateReel = async (data: {
    topic: string;
    notes: string;
    codeSnippet: string;
    technology: Technology;
    targetDuration: number;
    hookStyle: string;
  }) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-reel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to generate reel');
      }

      const generatedReel: ReelPackage = {
        ...result.reel,
        id: `reel-${Date.now()}`,
        technology: data.technology,
        createdAt: new Date().toISOString(),
      };

      setReel(generatedReel);
      setCurrentSceneIndex(0);
      setActiveTab('editor');
      showNotification(`Reel generated! "${generatedReel.title}" with ${generatedReel.scenes.length} scenes.`, 'success');
    } catch (err: any) {
      console.error('Generate reel error:', err);
      showNotification(err.message || 'Error generating reel with Gemini.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. Scene Management
  const handleUpdateScene = (index: number, updatedScene: Scene) => {
    const updatedScenes = [...reel.scenes];
    updatedScenes[index] = updatedScene;
    setReel({ ...reel, scenes: updatedScenes });
  };

  const handleAddScene = () => {
    const newSceneNumber = reel.scenes.length + 1;
    const newScene: Scene = {
      sceneNumber: newSceneNumber,
      durationSeconds: 10,
      visualType: 'code_editor',
      visualDescription: `Scene #${newSceneNumber} technical demonstration`,
      persianNarration: 'نکته مهم بعدی در توسعه بک‌اند این است که...',
      englishNarrationTerms: ['Optimization'],
      onScreenTitlePersian: 'نکته کلیدی بعدی',
      onScreenTitleEnglish: 'Key Best Practice',
      codeSnippet: `# Python code for Scene ${newSceneNumber}\npass`,
      codeLanguage: 'python',
      highlightLines: [1],
      animationNote: 'Code typewriter animation',
      subtitles: [
        {
          startSecond: 0,
          endSecond: 5,
          persianText: 'نکته مهم بعدی در توسعه بک‌اند این است که...',
          englishKeywords: 'Best Practice',
        },
      ],
    };

    setReel({ ...reel, scenes: [...reel.scenes, newScene] });
    setCurrentSceneIndex(reel.scenes.length);
    showNotification(`Scene #${newSceneNumber} added.`, 'info');
  };

  const handleDeleteScene = (index: number) => {
    if (reel.scenes.length <= 1) return;
    const updated = reel.scenes.filter((_, idx) => idx !== index);
    // Renumber scenes
    const renumbered = updated.map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
    setReel({ ...reel, scenes: renumbered });
    setCurrentSceneIndex(Math.max(0, index - 1));
    showNotification('Scene deleted.', 'info');
  };

  const handleMoveScene = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= reel.scenes.length) return;
    const copy = [...reel.scenes];
    const [moved] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, moved);
    const renumbered = copy.map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
    setReel({ ...reel, scenes: renumbered });
    setCurrentSceneIndex(toIndex);
  };

  // 4. Generate AI Voice for Scene
  const handleGenerateSceneVoice = async (sceneIndex: number) => {
    const scene = reel.scenes[sceneIndex];
    if (!scene) return;

    setIsGeneratingVoice(true);
    const updatedScenes = [...reel.scenes];
    updatedScenes[sceneIndex] = { ...scene, audioStatus: 'generating' };
    setReel({ ...reel, scenes: updatedScenes });

    try {
      const response = await fetch('/api/generate-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: scene.persianNarration,
          voice: 'Kore',
          speed: voiceSpeed,
          sceneNumber: scene.sceneNumber,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.audioBase64) {
        throw new Error(data.error || 'TTS generation failed');
      }

      const refreshed = [...reel.scenes];
      refreshed[sceneIndex] = {
        ...scene,
        audioBase64: data.audioBase64,
        audioStatus: 'ready',
        audioError: undefined,
      };
      setReel({ ...reel, scenes: refreshed });
      showNotification(`Scene #${scene.sceneNumber} Persian voice generated!`, 'success');
    } catch (err: any) {
      console.error('TTS error:', err);
      const fallback = [...reel.scenes];
      fallback[sceneIndex] = {
        ...scene,
        audioStatus: 'error',
        audioError: err.message,
      };
      setReel({ ...reel, scenes: fallback });
      showNotification(err.message || 'TTS generation error', 'error');
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  const handleNewReel = () => {
    if (window.confirm('Start a new Reel project? Your current changes will be replaced with a fresh preset template.')) {
      setReel(DEFAULT_INITIAL_REEL);
      setCurrentSceneIndex(0);
      setAnalysis(null);
      setActiveTab('input');
      showNotification('New Reel workspace loaded.', 'info');
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Studio Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewReel={handleNewReel}
        reelTitle={reel.title}
        totalScenesCount={reel.scenes.length}
      />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce duration-300">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md text-xs font-medium ${
              notification.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-600 text-emerald-200 shadow-emerald-950/50'
                : notification.type === 'error'
                ? 'bg-red-950/90 border-red-600 text-red-200 shadow-red-950/50'
                : 'bg-slate-900/90 border-cyan-600 text-cyan-200 shadow-cyan-950/50'
            }`}
          >
            {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
            {notification.type === 'info' && <Sparkles className="w-4 h-4 text-cyan-400" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Mobile Toggle Bar (Workspace vs 9:16 Preview) */}
      <div className="lg:hidden max-w-7xl mx-auto w-full px-4 pt-3 flex gap-2">
        <button
          onClick={() => setMobileViewMode('workspace')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            mobileViewMode === 'workspace'
              ? 'bg-violet-950 border border-violet-500 text-white'
              : 'bg-slate-900 border border-slate-800 text-slate-400'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Editor & Settings</span>
        </button>
        <button
          onClick={() => setMobileViewMode('preview')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            mobileViewMode === 'preview'
              ? 'bg-cyan-950 border border-cyan-500 text-cyan-200'
              : 'bg-slate-900 border border-slate-800 text-slate-400'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>9:16 Reel Preview</span>
        </button>
      </div>

      {/* Main Studio Body Grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left/Main Column: Active Workspace Tab */}
          <div
            className={`lg:col-span-7 xl:col-span-8 space-y-6 ${
              mobileViewMode === 'preview' ? 'hidden lg:block' : 'block'
            }`}
          >
            {activeTab === 'input' && (
              <TopicInputSection
                onGenerateReel={handleGenerateReel}
                onAnalyzeTopic={handleAnalyzeTopic}
                isAnalyzing={isAnalyzing}
                isGenerating={isGenerating}
                analysis={analysis}
                onApplyAnalysisCode={(code) => {
                  showNotification('Code snippet applied to input.', 'info');
                }}
              />
            )}

            {activeTab === 'editor' && (
              <ScriptEditor
                scenes={reel.scenes}
                currentSceneIndex={currentSceneIndex}
                onSelectScene={setCurrentSceneIndex}
                onUpdateScene={handleUpdateScene}
                onAddScene={handleAddScene}
                onDeleteScene={handleDeleteScene}
                onGenerateSceneVoice={handleGenerateSceneVoice}
                isGeneratingVoice={isGeneratingVoice}
              />
            )}

            {activeTab === 'storyboard' && (
              <StoryboardSection
                reel={reel}
                currentSceneIndex={currentSceneIndex}
                onSelectScene={setCurrentSceneIndex}
                onMoveScene={handleMoveScene}
                onAddScene={handleAddScene}
                onDeleteScene={handleDeleteScene}
              />
            )}

            {activeTab === 'voiceover' && (
              <VoiceoverSettings
                reel={reel}
                onUpdateReel={setReel}
                voiceSpeed={voiceSpeed}
                onVoiceSpeedChange={setVoiceSpeed}
              />
            )}

            {activeTab === 'export' && <VideoExporter reel={reel} />}
          </div>

          {/* Right Column: Sticky 9:16 Instagram Reel Player */}
          <div
            className={`lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24 flex flex-col items-center ${
              mobileViewMode === 'workspace' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <div className="w-full max-w-[360px] mb-2 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-cyan-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
                <span>9:16 LIVE PLAYER</span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">1080x1920 Instagram Safe</span>
            </div>

            <ReelPreviewPlayer
              reel={reel}
              currentSceneIndex={currentSceneIndex}
              onSelectScene={setCurrentSceneIndex}
              voiceSpeed={voiceSpeed}
            />
          </div>
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060911] py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">DevReel Studio</span>
            <span>·</span>
            <span>Educational Reel Creation for Python & Django Developers</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span>Persian Narration</span>
            <span>·</span>
            <span>Bilingual Subtitles</span>
            <span>·</span>
            <span>9:16 Vertical Export</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
