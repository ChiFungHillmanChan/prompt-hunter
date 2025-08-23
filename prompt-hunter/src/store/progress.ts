import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ProgressState = {
  completedRoles: string[];
  markRoleWin: (id: string) => void;
  resetRole: (id: string) => void;
};

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      completedRoles: [],
      markRoleWin: (id) => {
        const setNew = new Set(get().completedRoles);
        setNew.add(id);
        set({ completedRoles: Array.from(setNew) });
      },
      resetRole: (id) => set({ completedRoles: get().completedRoles.filter((r) => r !== id) }),
    }),
    { name: 'ph-progress' }
  )
);


