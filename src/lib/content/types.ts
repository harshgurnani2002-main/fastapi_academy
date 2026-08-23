export type Difficulty = 'intermediate' | 'advanced' | 'expert' | 'production';
export type TechCategory = 'backend' | 'database' | 'infrastructure' | 'devops' | 'observability' | 'testing';

export interface Technology {
  id: string;
  name: string;
  color: string;  // tailwind bg color class
  textColor: string;
  category: TechCategory;
  description?: string;
  iconEmoji?: string;
}

export interface CodeExample {
  id: string;
  title: string;
  language?: string;
  code?: string;
  highlightLines?: number[];
  filename?: string;
  files?: Record<string, { code: string, language: string }>; // For multi-file structures
  runnableUrl?: string; // For CodeSandbox / StackBlitz execution
}

export interface LessonSection {
  id: string;
  type: 'concept' | 'architecture' | 'implementation' | 'production' | 'realworld' | 'interview' | 'mistake' | 'challenge';
  title: string;
  content: string;
  codeExample?: CodeExample;
  diagram?: {
    title: string;
    diagram: string;
    caption?: string;
  };
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  hint?: string;
  solution: string;
  solutionCode?: CodeExample;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  answer: string;
  difficulty: Difficulty;
}

export interface ProductionNote {
  id: string;
  content: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface RealWorldScenario {
  id: string;
  scenario: string;
  problem: string;
  solution: string;
  code?: CodeExample;
}

export interface CommonMistake {
  id: string;
  title: string;
  description: string;
  badCode?: CodeExample;
  goodCode?: CodeExample;
}

export interface Lab {
  id: string;
  title: string;
  description: string;
  durationMinutes?: number;
  setupInstructions?: string;
  tasks?: string[];
  validation?: string;
}

export interface SystemDesign {
  id: string;
  context: string;
  components?: string[];
  challenges?: string[];
  solutions?: string[];
  options?: {
    name: string;
    pros: string[];
    cons: string[];
  }[];
  recommended?: string;
  justification?: string;
}

export interface FailureScenario {
  id: string;
  title: string;
  description?: string;
  resolution?: string;
  trigger?: string;
  symptom?: string;
  diagnosis?: string;
  mitigation?: string;
}

export interface ProductionChecklistItem {
  id: string;
  category: string;
  item: string;
  isRequired: boolean;
}

export interface Lesson {
  id: string;
  slug: string;
  chapterId: number;
  order: number;
  title: string;
  description: string;
  duration: number;
  difficulty: Difficulty;
  objectives: string[];
  sections: LessonSection[];
  codeExamples: CodeExample[];
  challenges: Challenge[];
  interviewQuestions: InterviewQuestion[];
  productionNotes: ProductionNote[];
  realWorldScenarios: RealWorldScenario[];
  commonMistakes: CommonMistake[];
  technologies: Technology[];
  prerequisites?: string[];
  nextLesson?: string;
  prevLesson?: string;
  labs?: Lab[];
  systemDesign?: SystemDesign;
  productionChecklist?: ProductionChecklistItem[];
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  estimatedHours: number;
  technologies: Technology[];
  skills: string[];
  architecture: string;
  fileStructure?: string;
  chapterId: number;
  featured?: boolean;
  failureScenarios?: FailureScenario[];
  prerequisites?: string[];
  milestones?: string[];
  deploymentRequirements?: string[];
}

export interface Chapter {
  id: number;
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  difficulty: Difficulty;
  estimatedHours: number;
  lessons: Lesson[];
  project: Project;
  technologies: Technology[];
  topics: string[];
  order: number;
  color: string; // tailwind color for chapter accent
}

export interface UserProgress {
  completedLessons: string[];
  completedChapters: number[];
  currentLesson?: string;
  currentChapter?: number;
  bookmarks: string[];
  notes: Record<string, string>;
  streak: number;
  lastActiveDate?: string;
  challengesCompleted: string[];
  projectsCompleted: string[];
}

export interface SearchResult {
  type: 'lesson' | 'chapter' | 'technology' | 'project';
  id: string;
  title: string;
  description: string;
  chapterId?: number;
  chapterTitle?: string;
  slug: string;
  technologies?: Technology[];
}
