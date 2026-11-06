import React, { useMemo, useState } from 'react';
import { highlightCode } from '../utils/prismHelper';
import { Copy, Check, Terminal, FileCode } from 'lucide-react';

interface CodeVisualizerProps {
  code: string;
  language?: string;
  highlightLines?: number[];
  fileName?: string;
  isReelMode?: boolean; // When rendered inside the 9:16 mobile canvas/player
  showLineNumbers?: boolean;
}

export const CodeVisualizer: React.FC<CodeVisualizerProps> = ({
  code,
  language = 'python',
  highlightLines = [],
  fileName,
  isReelMode = false,
  showLineNumbers = true,
}) => {
  const [copied, setCopied] = useState(false);

  const lines = useMemo(() => {
    return (code || '').split('\n');
  }, [code]);

  const defaultFileName = useMemo(() => {
    if (fileName) return fileName;
    switch (language.toLowerCase()) {
      case 'python':
      case 'django':
        return 'views.py';
      case 'sql':
      case 'postgresql':
        return 'queries.sql';
      case 'docker':
      case 'dockerfile':
        return 'Dockerfile';
      case 'bash':
        return 'terminal.sh';
      case 'json':
        return 'payload.json';
      default:
        return 'main.py';
    }
  }, [fileName, language]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`rounded-xl overflow-hidden border border-slate-800/80 bg-[#090d16] shadow-2xl transition-all ${
        isReelMode ? 'w-full text-xs font-mono' : 'w-full'
      }`}
    >
      {/* Editor Header / Title bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#0e1424] border-b border-slate-800/80 select-none">
        <div className="flex items-center gap-2">
          {/* macOS traffic light window buttons */}
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]/80 inline-block" />
          </div>

          {/* Active file tab */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#090d16] border border-slate-800 text-[11px] font-mono text-cyan-400">
            {language.toLowerCase() === 'bash' ? (
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>{defaultFileName}</span>
          </div>

          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
            UTF-8 · {language.toUpperCase()}
          </span>
        </div>

        {!isReelMode && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-colors"
            title="Copy snippet"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Code Area */}
      <div className="p-3.5 overflow-x-auto relative font-code">
        <pre className={`m-0 p-0 bg-transparent ${isReelMode ? 'text-[12px] leading-5' : 'text-xs sm:text-sm leading-6'}`}>
          <code>
            {lines.map((line, idx) => {
              const lineNum = idx + 1;
              const isHighlighted = highlightLines.includes(lineNum);
              const highlightedHtml = highlightCode(line, language);

              return (
                <div
                  key={idx}
                  className={`flex items-start transition-colors px-2 py-0.5 rounded ${
                    isHighlighted
                      ? 'bg-gradient-to-r from-violet-950/70 via-purple-900/30 to-transparent border-l-2 border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                      : 'hover:bg-slate-800/20'
                  }`}
                >
                  {showLineNumbers && (
                    <span
                      className={`select-none w-7 text-right pr-3 font-mono text-[11px] ${
                        isHighlighted ? 'text-cyan-400 font-semibold' : 'text-slate-600'
                      }`}
                    >
                      {lineNum}
                    </span>
                  )}
                  <span
                    className="flex-1 whitespace-pre"
                    dangerouslySetInnerHTML={{ __html: highlightedHtml || '&nbsp;' }}
                  />
                </div>
              );
            })}
          </code>
        </pre>
      </div>
    </div>
  );
};
