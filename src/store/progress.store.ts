import { create } from 'zustand';

interface ProgressState {
  completedLessons: string[];
  markCompleted: (lessonId: string) => void;
}

export const useProgressStore = create<ProgressState>((set) => ({
  completedLessons: ['fastapi-architecture-asgi-deep-dive'],
  markCompleted: (id) => set((state) => ({ completedLessons: [...state.completedLessons, id] })),
}));
