export type Technology = 
  | 'Python' 
  | 'Django' 
  | 'Django REST Framework' 
  | 'PostgreSQL & SQL' 
  | 'Docker & Linux' 
  | 'Git & GitHub';

export type VisualType = 'code_editor' | 'diagram' | 'terminal' | 'callout_card' | 'comparison';

export interface Subtitle {
  startSecond: number;
  endSecond: number;
  persianText: string;
  englishKeywords?: string;
}

export interface Scene {
  sceneNumber: number;
  durationSeconds: number;
  visualType: VisualType;
  visualDescription: string;
  persianNarration: string;
  englishNarrationTerms: string[];
  onScreenTitlePersian: string;
  onScreenTitleEnglish: string;
  codeSnippet: string;
  codeLanguage: string;
  highlightLines: number[];
  animationNote: string;
  subtitles: Subtitle[];
  audioBase64?: string;
  audioStatus?: 'idle' | 'generating' | 'ready' | 'error';
  audioError?: string;
}

export interface TopicAnalysis {
  topicSummary: string;
  coreProblemSolved: string;
  technicalAccuracyNotes: string;
  commonMisconceptions: string[];
  keyTakeaways: string[];
  hookIdeas: {
    persianHook: string;
    englishHook: string;
    hookStyle: string;
  }[];
  recommendedCodeSnippet: string;
  codeExplanation?: string;
}

export interface ReelPackage {
  id: string;
  title: string;
  targetDurationSeconds: number;
  technology: Technology;
  hook: {
    persian: string;
    english: string;
    visualCue: string;
  };
  summary: string;
  scenes: Scene[];
  conclusion: {
    persianTakeaway: string;
    callToActionPersian: string;
    callToActionEnglish?: string;
  };
  socialExport: {
    caption: string;
    hashtags: string[];
  };
  createdAt: string;
}

export interface PresetTopic {
  id: string;
  title: string;
  technology: Technology;
  shortDesc: string;
  notes: string;
  codeSnippet: string;
  suggestedDuration: number;
}
