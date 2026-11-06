import React, { useState, useEffect, useRef } from 'react';
import { Scene, ReelPackage } from '../types';
import { CodeVisualizer } from './CodeVisualizer';
import { 
  Play, Pause, RotateCcw, SkipForward, SkipBack, 
  Volume2, VolumeX, Eye, EyeOff, Sparkles, Heart, 
  MessageCircle, Send, Bookmark, Music2, CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ReelPreviewPlayerProps {
  reel: ReelPackage;
  currentSceneIndex: number;
  onSelectScene: (index: number) => void;
  voiceSpeed?: number;
}

export const ReelPreviewPlayer: React.FC<ReelPreviewPlayerProps> = ({
  reel,
  currentSceneIndex,
  onSelectScene,
  voiceSpeed = 1.0,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0); // time in current scene
  const [totalElapsedTime, setTotalElapsedTime] = useState(0);
  const [showInstagramOverlay, setShowInstagramOverlay] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scenes = reel.scenes || [];
  const currentScene: Scene | undefined = scenes[currentSceneIndex] || scenes[0];

  const totalDuration = scenes.reduce((acc, s) => acc + (s.durationSeconds || 10), 0);

  // Calculate cumulative start time for the current scene
  const sceneStartTime = scenes.slice(0, currentSceneIndex).reduce((acc, s) => acc + (s.durationSeconds || 10), 0);
  const currentSceneDuration = currentScene ? (currentScene.durationSeconds || 10) : 10;

  // Audio handling
  useEffect(() => {
    if (!currentScene) return;

    if (currentScene.audioBase64) {
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      audioRef.current.src = `data:audio/wav;base64,${currentScene.audioBase64}`;
      audioRef.current.playbackRate = voiceSpeed;
      audioRef.current.muted = isMuted;

      if (isPlaying) {
        audioRef.current.currentTime = Math.min(playbackTime, currentSceneDuration);
        audioRef.current.play().catch(e => console.log('Audio autoplay prevented:', e));
      } else {
        audioRef.current.pause();
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [currentSceneIndex, currentScene?.audioBase64, isPlaying, isMuted, voiceSpeed]);

  // Main playback loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTimestamp = performance.now();

    const tick = (now: number) => {
      if (!isPlaying) return;

      const deltaSeconds = (now - lastTimestamp) / 1000 * voiceSpeed;
      lastTimestamp = now;

      setPlaybackTime((prevTime) => {
        const nextTime = prevTime + deltaSeconds;
        if (nextTime >= currentSceneDuration) {
          // Advance to next scene or loop
          if (currentSceneIndex < scenes.length - 1) {
            onSelectScene(currentSceneIndex + 1);
            return 0;
          } else {
            // Finished entire reel
            setIsPlaying(false);
            onSelectScene(0);
            return 0;
          }
        }
        return nextTime;
      });

      animationFrameId = requestAnimationFrame(tick);
    };

    if (isPlaying) {
      lastTimestamp = performance.now();
      animationFrameId = requestAnimationFrame(tick);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, currentSceneIndex, currentSceneDuration, scenes.length, onSelectScene, voiceSpeed]);

  // Keep total elapsed time synced
  useEffect(() => {
    setTotalElapsedTime(sceneStartTime + playbackTime);
  }, [sceneStartTime, playbackTime]);

  // When switching scenes externally, reset scene playback time
  useEffect(() => {
    setPlaybackTime(0);
  }, [currentSceneIndex]);

  // Current active subtitle
  const activeSubtitle = currentScene?.subtitles?.find(
    (sub) => playbackTime >= sub.startSecond && playbackTime <= sub.endSecond
  ) || currentScene?.subtitles?.[0];

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    onSelectScene(0);
    setPlaybackTime(0);
    setTotalElapsedTime(0);
    setIsPlaying(true);
  };

  const handleNextScene = () => {
    if (currentSceneIndex < scenes.length - 1) {
      onSelectScene(currentSceneIndex + 1);
      setPlaybackTime(0);
    }
  };

  const handlePrevScene = () => {
    if (currentSceneIndex > 0) {
      onSelectScene(currentSceneIndex - 1);
      setPlaybackTime(0);
    }
  };

  if (!currentScene) {
    return <div className="text-slate-500 text-center py-12">No scenes available.</div>;
  }

  return (
    <div className="flex flex-col items-center select-none">
      {/* Top Player Header Controls */}
      <div className="w-full max-w-[380px] flex items-center justify-between py-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-mono text-cyan-400 font-semibold">
            Scene {currentSceneIndex + 1}/{scenes.length}
          </span>
          <span className="text-slate-600">·</span>
          <span className="font-mono">
            {Math.floor(totalElapsedTime)}s / {totalDuration}s
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInstagramOverlay(!showInstagramOverlay)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors ${
              showInstagramOverlay
                ? 'bg-violet-950/80 text-violet-300 border border-violet-800'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
            title="Toggle Instagram Reels Safe Margin Overlay"
          >
            {showInstagramOverlay ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Overlay</span>
          </button>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 9:16 Instagram Reel Container */}
      <div
        className="relative w-full max-w-[360px] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-800/90 bg-gradient-to-b from-[#090d16] via-[#0d1322] to-[#060911] flex flex-col justify-between"
        style={{
          boxShadow: '0 25px 60px -15px rgba(124, 58, 237, 0.25), 0 0 30px rgba(34, 211, 238, 0.1)',
        }}
      >
        {/* Subtle Background Lighting & Grid Effect */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Story/Reel Segmented Progress Bars */}
        <div className="absolute top-2.5 inset-x-3 flex gap-1 z-30">
          {scenes.map((s, idx) => {
            let progress = 0;
            if (idx < currentSceneIndex) {
              progress = 100;
            } else if (idx === currentSceneIndex) {
              progress = Math.min(100, (playbackTime / currentSceneDuration) * 100);
            }

            return (
              <div
                key={idx}
                onClick={() => onSelectScene(idx)}
                className="h-1 flex-1 bg-slate-800/80 rounded-full overflow-hidden cursor-pointer"
              >
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-75"
                  style={{ width: `${progress}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Scene Content Body */}
        <div className="relative z-10 flex-1 pt-7 pb-24 px-3.5 flex flex-col justify-center">
          {/* On-screen Persian Title & English Sub-Badge */}
          <div className="mb-3 text-center">
            <span className="inline-block text-[10px] tracking-wider uppercase font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 font-semibold mb-1">
              {currentScene.onScreenTitleEnglish || 'BACKEND MASTERY'}
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white font-fa text-center leading-snug drop-shadow-md">
              {currentScene.onScreenTitlePersian}
            </h2>
          </div>

          {/* Visual Type Renderers */}
          {currentScene.visualType === 'code_editor' && (
            <div className="w-full my-auto">
              <CodeVisualizer
                code={currentScene.codeSnippet}
                language={currentScene.codeLanguage || 'python'}
                highlightLines={currentScene.highlightLines || []}
                isReelMode={true}
              />
            </div>
          )}

          {currentScene.visualType === 'callout_card' && (
            <div className="w-full my-auto p-4 rounded-xl bg-slate-900/90 border border-violet-500/40 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-2 mb-2 text-violet-400">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-[11px] font-mono uppercase font-bold tracking-wider">
                  Senior Backend Concept
                </span>
              </div>
              <p className="text-sm font-fa text-slate-100 leading-relaxed text-right dir-rtl mb-3">
                {currentScene.visualDescription}
              </p>
              {currentScene.codeSnippet && (
                <div className="mt-2">
                  <CodeVisualizer
                    code={currentScene.codeSnippet}
                    language={currentScene.codeLanguage || 'python'}
                    highlightLines={currentScene.highlightLines || []}
                    isReelMode={true}
                  />
                </div>
              )}
            </div>
          )}

          {currentScene.visualType === 'diagram' && (
            <div className="w-full my-auto p-3.5 rounded-xl bg-[#0a0f1d] border border-cyan-500/30 flex flex-col items-center">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-2">
                Architecture Flow
              </span>
              <div className="flex flex-col gap-2 w-full text-xs font-mono">
                <div className="p-2 rounded bg-slate-800/70 border border-slate-700 text-center text-slate-200">
                  🌐 HTTP Request (Mobile App / Client)
                </div>
                <div className="text-center text-cyan-400 text-xs">↓</div>
                <div className="p-2 rounded bg-violet-950/80 border border-violet-600/50 text-center text-violet-200 font-semibold shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                  ⚡ Django REST Framework ViewSet
                </div>
                <div className="text-center text-cyan-400 text-xs">↓ (ORM select_related)</div>
                <div className="p-2 rounded bg-cyan-950/70 border border-cyan-600/50 text-center text-cyan-200">
                  🗄️ PostgreSQL Database (1 Single Query)
                </div>
              </div>
            </div>
          )}

          {currentScene.visualType === 'terminal' && (
            <div className="w-full my-auto rounded-xl bg-black/90 border border-slate-800 p-3 font-mono text-xs">
              <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-800 text-slate-500 text-[10px]">
                <span className="w-2 h-2 rounded-full bg-red-500/80" />
                <span className="w-2 h-2 rounded-full bg-yellow-500/80" />
                <span className="w-2 h-2 rounded-full bg-green-500/80" />
                <span className="ml-2 text-cyan-400">bash — dev@django-server:~</span>
              </div>
              <div className="text-emerald-400 mb-1">$ python manage.py test --verbosity=2</div>
              <div className="text-slate-400 text-[11px] leading-tight space-y-1">
                <div>Running database checks... <span className="text-emerald-400">OK</span></div>
                <div>Applying query optimization... <span className="text-cyan-400">ACTIVE</span></div>
                <div className="text-yellow-300">Queries reduced: 51 → 1 query (-98% latency)</div>
              </div>
            </div>
          )}

          {currentScene.visualType === 'comparison' && (
            <div className="w-full my-auto space-y-2">
              <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/50 text-left font-mono text-[11px]">
                <div className="flex items-center gap-1 text-red-400 font-bold mb-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>BAD (N+1 Slow Query)</span>
                </div>
                <code className="text-slate-300 text-[10px]">Book.objects.all() # 51 Queries!</code>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-700/60 text-left font-mono text-[11px] shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <div className="flex items-center gap-1 text-emerald-400 font-bold mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>OPTIMIZED (Fast 1 Query)</span>
                </div>
                <code className="text-cyan-300 text-[10px]">Book.objects.select_related("author")</code>
              </div>
            </div>
          )}

          {/* Bilingual Synchronized Subtitles Area (Placed above Instagram action buttons) */}
          <div className="mt-auto pt-3 pb-1 text-center">
            {activeSubtitle && (
              <div className="inline-block max-w-[92%] px-3.5 py-2 rounded-xl bg-black/85 backdrop-blur-md border border-slate-700/80 shadow-2xl">
                <p className="text-sm font-fa font-bold text-white text-center leading-relaxed dir-rtl mb-1">
                  {activeSubtitle.persianText}
                </p>
                {activeSubtitle.englishKeywords && (
                  <span className="inline-block text-[11px] font-mono font-semibold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/70">
                    {activeSubtitle.englishKeywords}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Instagram Right-Hand Action Overlay (Like, Comment, Share, Save) */}
        {showInstagramOverlay && (
          <div className="absolute right-2.5 bottom-12 z-20 flex flex-col items-center gap-3.5 text-white/90 drop-shadow-md pointer-events-none">
            <div className="flex flex-col items-center">
              <Heart className="w-6 h-6 stroke-[1.8] hover:text-red-500" />
              <span className="text-[10px] font-mono font-medium mt-0.5">2.4k</span>
            </div>
            <div className="flex flex-col items-center">
              <MessageCircle className="w-6 h-6 stroke-[1.8]" />
              <span className="text-[10px] font-mono font-medium mt-0.5">188</span>
            </div>
            <div className="flex flex-col items-center">
              <Send className="w-5 h-5 stroke-[1.8]" />
              <span className="text-[10px] font-mono font-medium mt-0.5">850</span>
            </div>
            <div className="flex flex-col items-center">
              <Bookmark className="w-5 h-5 stroke-[1.8]" />
              <span className="text-[10px] font-mono font-medium mt-0.5">1.9k</span>
            </div>
          </div>
        )}

        {/* Instagram Bottom Reel Creator Info */}
        {showInstagramOverlay && (
          <div className="absolute left-3 bottom-3 right-12 z-20 text-white/90 pointer-events-none">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-400 p-[1.5px]">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-[11px] font-bold text-cyan-300">
                  DR
                </div>
              </div>
              <span className="text-xs font-semibold tracking-tight">devreel.studio</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 font-medium">Follow</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
              <Music2 className="w-3 h-3 text-cyan-400 animate-spin" />
              <span className="truncate">DevReel Studio · Python & Django Mastery</span>
            </div>
          </div>
        )}
      </div>

      {/* Media Playback Controls Bar */}
      <div className="w-full max-w-[360px] mt-4 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
        <button
          onClick={handleRestart}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Restart Video"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevScene}
            disabled={currentSceneIndex === 0}
            className="p-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent hover:bg-slate-800 transition-colors"
            title="Previous Scene"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={handlePlayPause}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-violet-600/30 transition-all active:scale-95"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-white" />
                <span className="text-xs">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span className="text-xs">Play Reel</span>
              </>
            )}
          </button>

          <button
            onClick={handleNextScene}
            disabled={currentSceneIndex === scenes.length - 1}
            className="p-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent hover:bg-slate-800 transition-colors"
            title="Next Scene"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        <span className="text-[11px] font-mono text-slate-400 px-2 py-1 rounded bg-slate-800/80">
          {voiceSpeed}x
        </span>
      </div>
    </div>
  );
};
