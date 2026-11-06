import React, { useState } from 'react';
import { Scene, ReelPackage } from '../types';
import { 
  Volume2, Mic, Play, Pause, RefreshCw, CheckCircle2, 
  AlertCircle, Sparkles, Sliders, Music 
} from 'lucide-react';

interface VoiceoverSettingsProps {
  reel: ReelPackage;
  onUpdateReel: (updated: ReelPackage) => void;
  voiceSpeed: number;
  onVoiceSpeedChange: (speed: number) => void;
}

export const VoiceoverSettings: React.FC<VoiceoverSettingsProps> = ({
  reel,
  onUpdateReel,
  voiceSpeed,
  onVoiceSpeedChange,
}) => {
  const [selectedVoice, setSelectedVoice] = useState<'Kore' | 'Zephyr' | 'Puck'>('Kore');
  const [voiceTone, setVoiceTone] = useState<string>('Friendly Educational Persian');
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [previewingSceneIdx, setPreviewingSceneIdx] = useState<number | null>(null);
  const audioPreviewRef = React.useRef<HTMLAudioElement | null>(null);

  const handleGenerateVoiceForScene = async (sceneIndex: number) => {
    const scene = reel.scenes[sceneIndex];
    if (!scene) return;

    // Set scene to generating
    const updatedScenes = [...reel.scenes];
    updatedScenes[sceneIndex] = { ...scene, audioStatus: 'generating' };
    onUpdateReel({ ...reel, scenes: updatedScenes });

    try {
      const response = await fetch('/api/generate-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: scene.persianNarration,
          voice: selectedVoice,
          speed: voiceSpeed,
          sceneNumber: scene.sceneNumber,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.audioBase64) {
        throw new Error(data.error || 'TTS generation failed');
      }

      const refreshedScenes = [...reel.scenes];
      refreshedScenes[sceneIndex] = {
        ...scene,
        audioBase64: data.audioBase64,
        audioStatus: 'ready',
        audioError: undefined,
      };
      onUpdateReel({ ...reel, scenes: refreshedScenes });
    } catch (err: any) {
      console.warn('Gemini TTS error, marking scene error:', err);
      const fallbackScenes = [...reel.scenes];
      fallbackScenes[sceneIndex] = {
        ...scene,
        audioStatus: 'error',
        audioError: err.message || 'Error generating TTS',
      };
      onUpdateReel({ ...reel, scenes: fallbackScenes });
    }
  };

  const handleBulkGenerateAll = async () => {
    setIsBulkGenerating(true);
    for (let i = 0; i < reel.scenes.length; i++) {
      await handleGenerateVoiceForScene(i);
    }
    setIsBulkGenerating(false);
  };

  const handlePlayAudio = (sceneIdx: number, base64: string) => {
    if (previewingSceneIdx === sceneIdx) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      setPreviewingSceneIdx(null);
      return;
    }

    if (!audioPreviewRef.current) {
      audioPreviewRef.current = new Audio();
    }
    audioPreviewRef.current.src = `data:audio/wav;base64,${base64}`;
    audioPreviewRef.current.playbackRate = voiceSpeed;
    audioPreviewRef.current.onended = () => setPreviewingSceneIdx(null);
    audioPreviewRef.current.play().catch((e) => console.log('Audio preview error:', e));
    setPreviewingSceneIdx(sceneIdx);
  };

  return (
    <div className="space-y-6">
      {/* Voice Configuration Banner */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs mb-1">
              <Mic className="w-4 h-4" />
              <span>PERSIAN AI FEMALE NARRATION (GEMINI 3.8 TTS)</span>
            </div>
            <h3 className="text-base font-bold text-white font-fa">
              تنظیمات صدای گوینده و تلفظ دقیق اصطلاحات انگلیسی
            </h3>
          </div>

          <button
            onClick={handleBulkGenerateAll}
            disabled={isBulkGenerating}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-violet-600/30 transition-all disabled:opacity-50"
          >
            {isBulkGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating All Audio...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                <span>Generate Voice for All Scenes</span>
              </>
            )}
          </button>
        </div>

        {/* Voice Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Voice Model Prebuilt Voice */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Voice Persona</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedVoice('Kore')}
                className={`flex-1 p-2 rounded-lg border text-left text-xs transition-colors ${
                  selectedVoice === 'Kore'
                    ? 'bg-violet-950/70 border-violet-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-semibold text-cyan-300">Kore (Female)</div>
                <div className="text-[10px] text-slate-400">Warm educational tone</div>
              </button>
              <button
                onClick={() => setSelectedVoice('Zephyr')}
                className={`flex-1 p-2 rounded-lg border text-left text-xs transition-colors ${
                  selectedVoice === 'Zephyr'
                    ? 'bg-violet-950/70 border-violet-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-semibold text-cyan-300">Zephyr (Bright)</div>
                <div className="text-[10px] text-slate-400">Crisp & energetic</div>
              </button>
            </div>
          </div>

          {/* Speed Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">Speech Pace</label>
              <span className="text-xs font-mono text-cyan-400 font-bold">{voiceSpeed}x</span>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <span className="text-[10px] text-slate-500">0.8x</span>
              <input
                type="range"
                min={0.8}
                max={1.3}
                step={0.05}
                value={voiceSpeed}
                onChange={(e) => onVoiceSpeedChange(parseFloat(e.target.value))}
                className="flex-1 accent-cyan-400"
              />
              <span className="text-[10px] text-slate-500">1.3x</span>
            </div>
          </div>

          {/* Technical Pronunciation Guidelines */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Pronunciation Rule</label>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-400 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Auto English Term Recognition</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Backend keywords (`select_related`, `QuerySet`, `atomic`) are preserved with authentic English phonetics.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scene-by-Scene Audio Status List */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-xs font-mono font-semibold text-slate-300">
            SCENE AUDIO TRACKS ({reel.scenes.filter((s) => s.audioBase64).length}/{reel.scenes.length} Generated)
          </span>
          <span className="text-[11px] text-slate-400 font-mono">Unary 24kHz WAV</span>
        </div>

        <div className="space-y-2">
          {reel.scenes.map((scene, idx) => {
            const hasAudio = !!scene.audioBase64;
            const isPlaying = previewingSceneIdx === idx;

            return (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <span className="font-mono font-bold text-cyan-400 text-sm mt-0.5">
                    #{scene.sceneNumber}
                  </span>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-300 font-medium">
                        {scene.onScreenTitleEnglish || `Scene ${scene.sceneNumber}`}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ({scene.durationSeconds}s)
                      </span>
                    </div>
                    <p className="text-slate-400 font-fa dir-rtl text-right line-clamp-1 max-w-lg">
                      {scene.persianNarration}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {hasAudio && (
                    <button
                      onClick={() => handlePlayAudio(idx, scene.audioBase64!)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors"
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isPlaying ? 'Stop' : 'Listen'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleGenerateVoiceForScene(idx)}
                    disabled={scene.audioStatus === 'generating'}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-950 hover:bg-violet-900 border border-violet-700/60 text-violet-200 transition-colors disabled:opacity-50"
                  >
                    {scene.audioStatus === 'generating' ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                    <span>{hasAudio ? 'Regenerate' : 'Generate'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
