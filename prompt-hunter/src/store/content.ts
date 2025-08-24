import { create } from 'zustand';
import type { ContentPack } from '../types/content';
import { PACK_URL, PACK_URLS } from '../lib/constants';
import { loadJSON } from '../lib/utils';

type ContentState = {
  pack: ContentPack | null;
  phasesPerRun: number;
  loading: boolean;
  error: string | null;
  loadDefault: () => Promise<void>;
  loadLanguage: (language: 'en' | 'zh-hk') => Promise<void>;
  setPack: (pack: ContentPack) => void;
};

export const useContent = create<ContentState>((set) => ({
  pack: null,
  phasesPerRun: 5,
  loading: false,
  error: null,
  loadDefault: async () => {
    set({ loading: true, error: null });
    try {
      const pack = await loadJSON<ContentPack>(PACK_URL);
      set({ pack, phasesPerRun: pack.meta.phases_per_run, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load content';
      console.error('Failed to load default content:', error);
      set({ error: errorMessage, loading: false });
    }
  },
  loadLanguage: async (language: 'en' | 'zh-hk') => {
    set({ loading: true, error: null });
    try {
      const packUrl = PACK_URLS[language];
      const pack = await loadJSON<ContentPack>(packUrl);
      set({ pack, phasesPerRun: pack.meta.phases_per_run, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load content';
      console.error('Failed to load language content:', error);
      set({ error: errorMessage, loading: false });
    }
  },
  setPack: (pack) => set({ pack, phasesPerRun: pack.meta.phases_per_run }),
}));


