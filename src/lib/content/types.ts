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
  language: string;
  title: string;
  code: string;
  highlightLines?: number[];
  filename?: string;
}

export interface LessonSection {
  id: string;
  type: 'concept' | 'architecture' | 'implementation' | 'production' | 'realworld' | 'interview' | 'mistake' | 'challenge';
  title: string;
  content: string;
  codeExample?: CodeExample;
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
