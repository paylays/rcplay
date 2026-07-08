// ─── Core Data Types ──────────────────────────────────────────────────────────

export type AnswerLetter = 'A' | 'B' | 'C' | 'D';

export interface QuestionOptions {
  A: string;
  B: string;
  C: string;
  D: string;
}

export interface Question {
  id: string;
  number: number;
  text: string;
  options: QuestionOptions;
  correctAnswer: AnswerLetter;
}

export interface QuestionGroup {
  id: string;
  passageRange: string;
  passage: string;
  questions: Question[];
}

export interface PracticeTest {
  id: string;
  title: string;
  period: string;
  num: number;
  totalQuestions: number;
  timerMinutes: number;
  questionGroups: QuestionGroup[];
}

// ─── Progress & Session Types ─────────────────────────────────────────────────

export interface TestProgress {
  completed: boolean;
  score: number;
  total: number;
  timeTaken: number; // seconds
  lastAttempt: string; // ISO date string
  answers: Record<number, AnswerLetter>;
}

export interface AppProgress {
  [testId: string]: TestProgress;
}

// ─── Quiz Session ─────────────────────────────────────────────────────────────

export interface QuizSession {
  testId: string;
  currentQuestionIndex: number;
  answers: Record<number, AnswerLetter>;
  startTime: number; // Date.now()
  isFinished: boolean;
}
