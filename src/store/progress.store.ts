import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ProgressState {
  completedLessons: string[];
  markCompleted: (lessonId: string) => void;
  toggleCompleted: (lessonId: string) => void;
  isCompleted: (lessonId: string) => boolean;
  exportProgress: () => string;
  importProgress: (jsonData: string) => boolean;
  resetProgress: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      completedLessons: ['fastapi-architecture-asgi-deep-dive', '01-01'],
      markCompleted: (id: string) =>
        set((state) => ({
          completedLessons: state.completedLessons.includes(id)
            ? state.completedLessons
            : [...state.completedLessons, id],
        })),
      toggleCompleted: (id: string) =>
        set((state) => ({
          completedLessons: state.completedLessons.includes(id)
            ? state.completedLessons.filter((item) => item !== id)
            : [...state.completedLessons, id],
        })),
      isCompleted: (id: string) => get().completedLessons.includes(id),
      exportProgress: () => {
        const data = {
          version: 1,
          timestamp: new Date().toISOString(),
          completedLessons: get().completedLessons,
        };
        return JSON.stringify(data, null, 2);
      },
      importProgress: (jsonData: string) => {
        try {
          const parsed = JSON.parse(jsonData);
          if (parsed && Array.isArray(parsed.completedLessons)) {
            set({ completedLessons: parsed.completedLessons });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },
      resetProgress: () => set({ completedLessons: [] }),
    }),
    {
      name: 'fastapi_academy_progress',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

