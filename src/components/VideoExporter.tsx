import React, { useState, useRef } from 'react';
import { ReelPackage } from '../types';
import confetti from 'canvas-confetti';
import { 
  Download, FileText, Subtitles, Share2, Copy, Check, 
  Film, Sparkles, AlertCircle, RefreshCw, CheckCircle2 
} from 'lucide-react';

interface VideoExporterProps {
  reel: ReelPackage;
}

export const VideoExporter: React.FC<VideoExporterProps> = ({ reel }) => {
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedHashtags, setCopiedHashtags] = useState(false);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);

  // 1. Generate SRT Subtitles
  const generateSrtContent = (): string => {
    let srtText = '';
    let counter = 1;

    let cumulativeTime = 0;
    reel.scenes.forEach((scene) => {
      const sceneStart = cumulativeTime;
      const subtitles = scene.subtitles || [];

      subtitles.forEach((sub) => {
        const globalStart = sceneStart + sub.startSecond;
        const globalEnd = sceneStart + sub.endSecond;

        const formatSrtTime = (seconds: number) => {
          const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
          const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
          const s = Math.floor(seconds % 60).toString().padStart(2, '0');
          const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
          return `${h}:${m}:${s},${ms}`;
        };

        srtText += `${counter}\n`;
        srtText += `${formatSrtTime(globalStart)} --> ${formatSrtTime(globalEnd)}\n`;
        srtText += `${sub.persianText}\n`;
        if (sub.englishKeywords) {
          srtText += `[${sub.englishKeywords}]\n`;
        }
        srtText += '\n';
        counter++;
      });

      cumulativeTime += scene.durationSeconds;
    });

    return srtText;
  };

  const handleDownloadSrt = () => {
    const srt = generateSrtContent();
    const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reel.title.replace(/\s+/g, '_')}_subtitles.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 2. Download Narration Script Text
  const handleDownloadScript = () => {
    let scriptContent = `DEVREEL STUDIO - NARRATION SCRIPT\n`;
    scriptContent += `Title: ${reel.title}\n`;
    scriptContent += `Technology: ${reel.technology}\n`;
    scriptContent += `Target Duration: ${reel.targetDurationSeconds}s\n\n`;
    scriptContent += `HOOK:\nPersian: ${reel.hook.persian}\nEnglish: ${reel.hook.english}\n\n`;
    scriptContent += `=====================================\nSCENE-BY-SCENE NARRATION:\n=====================================\n\n`;

    reel.scenes.forEach((s) => {
      scriptContent += `--- SCENE #${s.sceneNumber} (${s.durationSeconds}s) ---\n`;
      scriptContent += `Visual Layout: ${s.visualType}\n`;
      scriptContent += `Title (FA): ${s.onScreenTitlePersian}\n`;
      scriptContent += `Title (EN): ${s.onScreenTitleEnglish}\n`;
      scriptContent += `Spoken Persian:\n${s.persianNarration}\n\n`;
      if (s.englishNarrationTerms?.length) {
        scriptContent += `English Terms: ${s.englishNarrationTerms.join(', ')}\n`;
      }
      if (s.codeSnippet) {
        scriptContent += `Code:\n${s.codeSnippet}\n`;
      }
      scriptContent += `\n`;
    });

    scriptContent += `\nCONCLUSION:\n${reel.conclusion.persianTakeaway}\n`;
    scriptContent += `CTA: ${reel.conclusion.callToActionPersian}\n`;

    const blob = new Blob([scriptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reel.title.replace(/\s+/g, '_')}_script.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 3. Download Full Storyboard JSON
  const handleDownloadStoryboard = () => {
    const jsonStr = JSON.stringify(reel, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reel.title.replace(/\s+/g, '_')}_storyboard.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 4. Client-side Canvas Video Renderer (generates real 9:16 vertical video)
  const handleRenderCanvasVideo = async () => {
    try {
      setIsExportingVideo(true);
      setExportProgress(10);

      // Create off-screen canvas at 540x960 (standard 9:16 HD vertical)
      const canvas = document.createElement('canvas');
      canvas.width = 540;
      canvas.height = 960;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not initialize 2D context');

      const stream = canvas.captureStream(30);
      let audioCtx: AudioContext | null = null;
      let dest: MediaStreamAudioDestinationNode | null = null;

      // Check if we have audio elements to mix into stream
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtx = new AudioContextClass();
          dest = audioCtx.createMediaStreamDestination();
          dest.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
        }
      } catch (e) {
        console.warn('AudioContext recording not supported in this browser:', e);
      }

      const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')
        ? 'video/mp4;codecs=avc1'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000,
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const recordedBlob = new Blob(chunks, { type: mimeType });
        const videoUrl = URL.createObjectURL(recordedBlob);
        setExportedVideoUrl(videoUrl);
        setIsExportingVideo(false);
        setExportProgress(100);

        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.8 } });
        } catch (_) {}

        // Trigger download
        const a = document.createElement('a');
        a.href = videoUrl;
        a.download = `${reel.title.replace(/\s+/g, '_')}_reel.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`;
        a.click();
      };

      mediaRecorder.start();

      // Render frames scene by scene
      const totalSecs = reel.scenes.reduce((acc, s) => acc + (s.durationSeconds || 10), 0);
      let currentGlobalSec = 0;
      const fps = 30;

      for (let sIdx = 0; sIdx < reel.scenes.length; sIdx++) {
        const scene = reel.scenes[sIdx];
        const sceneDur = scene.durationSeconds || 10;
        const totalSceneFrames = sceneDur * fps;

        for (let frame = 0; frame < totalSceneFrames; frame++) {
          const sceneSec = frame / fps;

          // 1. Draw Background
          const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
          grad.addColorStop(0, '#090d16');
          grad.addColorStop(0.5, '#0e1424');
          grad.addColorStop(1, '#05070d');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Subtle glowing accent circles
          ctx.fillStyle = 'rgba(124, 58, 237, 0.15)';
          ctx.beginPath();
          ctx.arc(100, 200, 180, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(34, 211, 238, 0.12)';
          ctx.beginPath();
          ctx.arc(450, 750, 200, 0, Math.PI * 2);
          ctx.fill();

          // 2. Top Segmented Progress Bar
          const segmentGap = 6;
          const barWidth = (canvas.width - 40 - segmentGap * (reel.scenes.length - 1)) / reel.scenes.length;
          reel.scenes.forEach((_, idx) => {
            const x = 20 + idx * (barWidth + segmentGap);
            ctx.fillStyle = 'rgba(51, 65, 85, 0.7)';
            ctx.fillRect(x, 24, barWidth, 4);

            let fill = 0;
            if (idx < sIdx) fill = 1;
            else if (idx === sIdx) fill = sceneSec / sceneDur;

            if (fill > 0) {
              ctx.fillStyle = '#22d3ee';
              ctx.fillRect(x, 24, barWidth * fill, 4);
            }
          });

          // 3. Header Title & Badge
          ctx.textAlign = 'center';
          ctx.font = 'bold 13px "JetBrains Mono", monospace';
          ctx.fillStyle = '#38bdf8';
          ctx.fillText(scene.onScreenTitleEnglish || 'DEVREEL STUDIO', canvas.width / 2, 70);

          ctx.font = 'bold 22px "Vazirmatn", sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(scene.onScreenTitlePersian, canvas.width / 2, 105);

          // 4. Code Box (IDE Window)
          const editorX = 24;
          const editorY = 140;
          const editorW = canvas.width - 48;
          const editorH = 460;

          // Box container
          ctx.fillStyle = '#090d16';
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(editorX, editorY, editorW, editorH, 16);
          ctx.fill();
          ctx.stroke();

          // Title bar
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.roundRect(editorX, editorY, editorW, 42, [16, 16, 0, 0]);
          ctx.fill();

          // Traffic lights
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(editorX + 22, editorY + 21, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(editorX + 38, editorY + 21, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(editorX + 54, editorY + 21, 5, 0, Math.PI * 2);
          ctx.fill();

          // File name
          ctx.font = '12px "JetBrains Mono", monospace';
          ctx.fillStyle = '#38bdf8';
          ctx.textAlign = 'left';
          ctx.fillText('views.py', editorX + 75, editorY + 25);

          // Code lines
          ctx.font = '14px "JetBrains Mono", monospace';
          const codeLines = (scene.codeSnippet || '').split('\n').slice(0, 14);
          codeLines.forEach((line, lIdx) => {
            const lineY = editorY + 75 + lIdx * 25;
            const isHighlight = scene.highlightLines?.includes(lIdx + 1);

            if (isHighlight) {
              ctx.fillStyle = 'rgba(124, 58, 237, 0.3)';
              ctx.fillRect(editorX + 4, lineY - 18, editorW - 8, 23);
              ctx.fillStyle = '#22d3ee';
              ctx.fillRect(editorX + 4, lineY - 18, 4, 23);
            }

            // Line number
            ctx.fillStyle = isHighlight ? '#38bdf8' : '#475569';
            ctx.fillText((lIdx + 1).toString().padStart(2, '0'), editorX + 16, lineY);

            // Code text
            ctx.fillStyle = line.trim().startsWith('#')
              ? '#64748b'
              : isHighlight
              ? '#ffffff'
              : '#cbd5e1';
            ctx.fillText(line.substring(0, 38), editorX + 45, lineY);
          });

          // 5. Bilingual Subtitles
          const activeSub = scene.subtitles?.find(
            (s) => sceneSec >= s.startSecond && sceneSec <= s.endSecond
          ) || scene.subtitles?.[0];

          if (activeSub) {
            const subBoxY = 660;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.beginPath();
            ctx.roundRect(30, subBoxY, canvas.width - 60, 95, 14);
            ctx.fill();
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.textAlign = 'center';
            ctx.font = 'bold 17px "Vazirmatn", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(activeSub.persianText, canvas.width / 2, subBoxY + 38);

            if (activeSub.englishKeywords) {
              ctx.font = '13px "JetBrains Mono", monospace';
              ctx.fillStyle = '#22d3ee';
              ctx.fillText(activeSub.englishKeywords, canvas.width / 2, subBoxY + 68);
            }
          }

          // 6. Reel Watermark & Brand
          ctx.font = 'bold 12px "Inter", sans-serif';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.textAlign = 'left';
          ctx.fillText('devreel.studio · Python & Django', 35, canvas.height - 40);

          currentGlobalSec += 1 / fps;
          if (frame % 15 === 0) {
            // yield to browser loop so UI updates
            const currentPct = Math.min(95, Math.floor((currentGlobalSec / totalSecs) * 100));
            setExportProgress(currentPct);
            await new Promise((r) => setTimeout(r, 2));
          }
        }
      }

      mediaRecorder.stop();
    } catch (err: any) {
      console.error('Canvas export error:', err);
      setIsExportingVideo(false);
      alert('Error rendering video: ' + (err.message || err));
    }
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(reel.socialExport.caption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const handleCopyHashtags = () => {
    navigator.clipboard.writeText(reel.socialExport.hashtags.join(' '));
    setCopiedHashtags(true);
    setTimeout(() => setCopiedHashtags(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Video Production Engine */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-950/70 via-slate-900 to-cyan-950/50 border border-violet-500/30 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs mb-1">
              <Film className="w-4 h-4" />
              <span>9:16 VERTICAL MP4 PRODUCTION ENGINE</span>
            </div>
            <h3 className="text-lg font-bold text-white font-fa">
              آماده‌سازی خروجی ویدیو و انتشار در اینستاگرام ریلز
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              رندر مستقیم ویدیو در نسبت ۹:۱۶ با فریم‌ریت ۳۰، سینک زیرنویس دو زبانه و هایلایت کد پایتون و جنگو.
            </p>
          </div>

          <button
            onClick={handleRenderCanvasVideo}
            disabled={isExportingVideo}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-violet-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isExportingVideo ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Rendering Reel ({exportProgress}%)...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Render & Download 9:16 Video</span>
              </>
            )}
          </button>
        </div>

        {isExportingVideo && (
          <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5">
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span>Synthesizing frames & code highlights...</span>
              <span className="text-cyan-400 font-bold">{exportProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-150"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Export Asset Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Subtitles (.SRT) */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400">
            <Subtitles className="w-4 h-4" />
            <span className="text-xs font-mono font-semibold">SUBTITLES (.SRT)</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Synchronized Persian & English subtitles ready to import into CapCut, Premiere, DaVinci Resolve, or Instagram.
          </p>
          <button
            onClick={handleDownloadSrt}
            className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .SRT File</span>
          </button>
        </div>

        {/* Narration Script (.TXT) */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-violet-400">
            <FileText className="w-4 h-4" />
            <span className="text-xs font-mono font-semibold">NARRATION SCRIPT (.TXT)</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Full scene-by-scene Persian voiceover text, English pronunciations, duration timings, and CTA cues.
          </p>
          <button
            onClick={handleDownloadScript}
            className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Script</span>
          </button>
        </div>

        {/* Storyboard (.JSON) */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <Share2 className="w-4 h-4" />
            <span className="text-xs font-mono font-semibold">STORYBOARD (.JSON)</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Full data structure of scenes, code snippets, highlighted lines, and video production metadata.
          </p>
          <button
            onClick={handleDownloadStoryboard}
            className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Storyboard</span>
          </button>
        </div>
      </div>

      {/* Social Media Instagram Caption & Hashtags */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-semibold text-white">
              INSTAGRAM CAPTION & HASHTAGS
            </span>
          </div>
          <span className="text-[11px] text-slate-400">High-Engagement Iranian Tech Community Format</span>
        </div>

        <div className="space-y-3">
          {/* Caption Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">
                Instagram Reel Caption (متن کپشن اینستاگرام)
              </label>
              <button
                onClick={handleCopyCaption}
                className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {copiedCaption ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCaption ? 'Copied!' : 'Copy Caption'}</span>
              </button>
            </div>
            <textarea
              readOnly
              value={reel.socialExport.caption}
              rows={8}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-fa text-slate-200 dir-rtl text-right leading-relaxed focus:outline-none"
            />
          </div>

          {/* Hashtags Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">
                Targeted Hashtags ({reel.socialExport.hashtags.length})
              </label>
              <button
                onClick={handleCopyHashtags}
                className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {copiedHashtags ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedHashtags ? 'Copied!' : 'Copy Hashtags'}</span>
              </button>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap gap-1.5">
              {reel.socialExport.hashtags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400 text-xs font-mono"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
