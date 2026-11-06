import React, { useState } from 'react';
import { Technology, PresetTopic, TopicAnalysis } from '../types';
import { PRESET_TOPICS } from '../data/presets';
import { 
  Sparkles, Code, BookOpen, Clock, AlertTriangle, 
  CheckCircle2, ArrowRight, Lightbulb, RefreshCw, Cpu
} from 'lucide-react';

interface TopicInputSectionProps {
  onGenerateReel: (data: {
    topic: string;
    notes: string;
    codeSnippet: string;
    technology: Technology;
    targetDuration: number;
    hookStyle: string;
  }) => void;
  onAnalyzeTopic: (data: {
    topic: string;
    notes: string;
    codeSnippet: string;
    technology: Technology;
  }) => void;
  isAnalyzing: boolean;
  isGenerating: boolean;
  analysis: TopicAnalysis | null;
  onApplyAnalysisCode: (code: string) => void;
}

export const TopicInputSection: React.FC<TopicInputSectionProps> = ({
  onGenerateReel,
  onAnalyzeTopic,
  isAnalyzing,
  isGenerating,
  analysis,
  onApplyAnalysisCode,
}) => {
  const [selectedTech, setSelectedTech] = useState<Technology>('Django');
  const [topic, setTopic] = useState('Django N+1 Query: select_related vs prefetch_related');
  const [notes, setNotes] = useState(
    'Solving slow database performance in Django when looping over ForeignKey fields in templates or serializers.'
  );
  const [codeSnippet, setCodeSnippet] = useState(
    `# ❌ BAD: 50 SQL queries\nbooks = Book.objects.all()\nfor b in books: print(b.author.name)\n\n# ✅ GOOD: 1 SQL query with JOIN\nbooks = Book.objects.select_related("author").all()`
  );
  const [targetDuration, setTargetDuration] = useState<number>(45);
  const [hookStyle, setHookStyle] = useState('The Costly Mistake');

  const technologies: Technology[] = [
    'Django',
    'Django REST Framework',
    'Python',
    'PostgreSQL & SQL',
    'Docker & Linux',
    'Git & GitHub',
  ];

  const handleSelectPreset = (preset: PresetTopic) => {
    setSelectedTech(preset.technology);
    setTopic(preset.title);
    setNotes(preset.notes);
    setCodeSnippet(preset.codeSnippet);
    setTargetDuration(preset.suggestedDuration);
  };

  const handleAnalyze = () => {
    onAnalyzeTopic({
      topic,
      notes,
      codeSnippet,
      technology: selectedTech,
    });
  };

  const handleGenerate = () => {
    onGenerateReel({
      topic,
      notes,
      codeSnippet,
      technology: selectedTech,
      targetDuration,
      hookStyle,
    });
  };

  return (
    <div className="space-y-6">
      {/* Presets Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>QUICK PRESETS (PYTHON & DJANGO BACKEND)</span>
          </div>
          <span className="text-[11px] text-slate-500">Click to auto-populate</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {PRESET_TOPICS.map((preset) => {
            const isSelected = topic === preset.title;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                  isSelected
                    ? 'bg-violet-950/60 border-violet-500/80 text-white shadow-md shadow-violet-900/30'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="text-[10px] font-mono text-cyan-400 font-semibold mb-1">
                  {preset.technology}
                </div>
                <div className="font-medium line-clamp-2 leading-tight">
                  {preset.title.split(':')[0]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Input Form */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl space-y-4">
        {/* Technology Selector & Duration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Backend Technology Stack</label>
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-950/80 rounded-lg border border-slate-800">
              {technologies.map((tech) => (
                <button
                  key={tech}
                  onClick={() => setSelectedTech(tech)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    selectedTech === tech
                      ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tech}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
              <span>Target Duration</span>
              <span className="font-mono text-cyan-400">{targetDuration}s</span>
            </label>
            <div className="flex gap-2">
              {[30, 45, 60].map((dur) => (
                <button
                  key={dur}
                  onClick={() => setTargetDuration(dur)}
                  className={`flex-1 py-1.5 text-xs font-mono font-medium rounded-lg border transition-colors ${
                    targetDuration === dur
                      ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {dur}s
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Topic Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-violet-400" />
            <span>Lesson Topic or Learning Question</span>
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Django N+1 query problem, Celery Task Retries, PostgreSQL GIN Index..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
          />
        </div>

        {/* Personal Notes / Explanations */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
            <span>Technical Notes, Documentation, or Learning Experience</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Paste your personal notes, docs snippets, or common bug experiences you want to explain to junior developers..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
          />
        </div>

        {/* Real Code Snippet */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-cyan-400" />
              <span>Real Code Demonstration (Python, Django, SQL, Bash)</span>
            </label>
            <span className="text-[11px] text-slate-500 font-mono">
              Never invent fake APIs · Keep under 12 lines
            </span>
          </div>
          <textarea
            value={codeSnippet}
            onChange={(e) => setCodeSnippet(e.target.value)}
            rows={4}
            placeholder="# Provide real Python, Django, or SQL code to be visually demonstrated in the Reel"
            className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-slate-800 text-xs sm:text-sm font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
          />
        </div>

        {/* Hook Style Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">
            Opening Hook Style (First 3 Seconds of Reel)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'The Costly Mistake', desc: 'Stop doing this in production' },
              { label: 'Senior Dev Trick', desc: 'Under-the-radar feature' },
              { label: 'Performance 10x', desc: 'Speed & memory comparison' },
              { label: 'Under the Hood', desc: 'How Django ORM actually works' },
            ].map((style) => (
              <button
                key={style.label}
                onClick={() => setHookStyle(style.label)}
                className={`p-2 rounded-lg border text-left text-xs transition-colors ${
                  hookStyle === style.label
                    ? 'bg-violet-950/70 border-violet-500 text-white'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-medium text-[11px] text-cyan-300">{style.label}</div>
                <div className="text-[10px] text-slate-500 truncate">{style.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Actions Button Bar */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || isGenerating}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>Analyzing Accuracy with Gemini...</span>
              </>
            ) : (
              <>
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>1. Verify Technical Accuracy</span>
              </>
            )}
          </button>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || isAnalyzing}
            className="w-full sm:flex-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-600/30 transition-all disabled:opacity-50 active:scale-98"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Synthesizing Storyboard & Persian Script...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>2. Generate Complete Reel Package</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Technical Analysis Output (if available) */}
      {analysis && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-[#0c1222] border border-cyan-900/60 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-semibold text-cyan-300">
                GEMINI TECHNICAL VERIFICATION REPORT
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Technical Accuracy: Verified</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Core Summary & Notes */}
            <div className="space-y-2">
              <div>
                <span className="text-slate-400 block text-[11px] font-mono">CORE LEARNING ESSENCE:</span>
                <p className="text-slate-200 mt-0.5 leading-relaxed font-fa">{analysis.topicSummary}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-mono">PRODUCTION PROBLEM SOLVED:</span>
                <p className="text-slate-300 mt-0.5 leading-relaxed">{analysis.coreProblemSolved}</p>
              </div>
              <div>
                <span className="text-cyan-400 block text-[11px] font-mono">TECHNICAL ACCURACY CAVEATS:</span>
                <p className="text-slate-300 mt-0.5 leading-relaxed">{analysis.technicalAccuracyNotes}</p>
              </div>
            </div>

            {/* Misconceptions & Hook Ideas */}
            <div className="space-y-3">
              <div>
                <span className="text-amber-400 block text-[11px] font-mono flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  COMMON JUNIOR MISCONCEPTIONS TO ADDRESS:
                </span>
                <ul className="mt-1 space-y-1 list-disc list-inside text-slate-300">
                  {analysis.commonMisconceptions.map((item, idx) => (
                    <li key={idx} className="leading-tight">{item}</li>
                  ))}
                </ul>
              </div>

              {analysis.hookIdeas?.length > 0 && (
                <div>
                  <span className="text-violet-400 block text-[11px] font-mono">
                    SUGGESTED PERSIAN HOOK:
                  </span>
                  <div className="p-2.5 rounded-lg bg-violet-950/40 border border-violet-800/40 mt-1">
                    <p className="text-xs font-fa text-slate-200 font-semibold dir-rtl text-right">
                      {analysis.hookIdeas[0].persianHook}
                    </p>
                    <span className="text-[10px] font-mono text-cyan-400 block mt-1">
                      {analysis.hookIdeas[0].englishHook}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {analysis.recommendedCodeSnippet && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-mono text-slate-400">
                  VERIFIED ACCURATE CODE SNIPPET (READY FOR VIDEO):
                </span>
                <button
                  onClick={() => onApplyAnalysisCode(analysis.recommendedCodeSnippet)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold underline"
                >
                  Use this snippet in input
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-black/90 border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto">
                <code>{analysis.recommendedCodeSnippet}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
