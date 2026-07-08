import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppProgress, TestProgress, AnswerLetter } from '../types';

interface ProgressState {
  progress: AppProgress;
  currentSession: {
    testId: string;
    answers: Record<number, AnswerLetter>;
    startTime: number;
  } | null;

  // Actions
  startSession: (testId: string) => void;
  saveAnswer: (questionNumber: number, answer: AnswerLetter) => void;
  completeTest: (testId: string, score: number, total: number) => void;
  clearSession: () => void;
  getTestProgress: (testId: string) => TestProgress | undefined;
  resetTestProgress: (testId: string) => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      progress: {},
      currentSession: null,

      startSession: (testId) =>
        set({
          currentSession: {
            testId,
            answers: {},
            startTime: Date.now(),
          },
        }),

      saveAnswer: (questionNumber, answer) =>
        set((state) => ({
          currentSession: state.currentSession
            ? {
                ...state.currentSession,
                answers: {
                  ...state.currentSession.answers,
                  [questionNumber]: answer,
                },
              }
            : null,
        })),

      completeTest: (testId, score, total) => {
        const session = get().currentSession;
        const timeTaken = session
          ? Math.floor((Date.now() - session.startTime) / 1000)
          : 0;

        set((state) => ({
          progress: {
            ...state.progress,
            [testId]: {
              completed: true,
              score,
              total,
              timeTaken,
              lastAttempt: new Date().toISOString().split('T')[0],
              answers: session?.answers || {},
            },
          },
          currentSession: null,
        }));
      },

      clearSession: () => set({ currentSession: null }),

      getTestProgress: (testId) => get().progress[testId],

      resetTestProgress: (testId) =>
        set((state) => {
          const newProgress = { ...state.progress };
          delete newProgress[testId];
          return { progress: newProgress };
        }),
    }),
    {
      name: 'toefl_progress',
    }
  )
);
