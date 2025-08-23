import { create } from 'zustand';
import type { ContentPack } from '../types/content';
import { PACK_URL } from '../lib/constants';
import { loadJSON } from '../lib/utils';

type ContentState = {
  pack: ContentPack | null;
  phasesPerRun: number;
  loadDefault: () => Promise<void>;
  setPack: (pack: ContentPack) => void;
};

export const useContent = create<ContentState>((set) => ({
  pack: null,
  phasesPerRun: 5,
  loadDefault: async () => {
    const pack = await loadJSON<ContentPack>(PACK_URL);
    set({ pack, phasesPerRun: pack.meta.phases_per_run });
  },
  setPack: (pack) => set({ pack, phasesPerRun: pack.meta.phases_per_run }),
}));


