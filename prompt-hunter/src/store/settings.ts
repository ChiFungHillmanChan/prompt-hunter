import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULTS } from '../lib/constants';

type SettingsState = {
  attackIntervalMs: number;
  monsterDamagePerTick: number;
  playerMaxHP: number;
  playerAnswerDamage: number;
  geminiModel: 'gemini-2.5-flash-lite';
  useApi: boolean;  
  reducedMotion: boolean;
  language: 'en' | 'zh-hk';
  set<K extends keyof Omit<SettingsState, 'set'>>(key: K, value: SettingsState[K]): void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      attackIntervalMs: DEFAULTS.attackIntervalMs,
      monsterDamagePerTick: DEFAULTS.monsterDamagePerTick,
      playerMaxHP: DEFAULTS.playerMaxHP,
      playerAnswerDamage: DEFAULTS.playerAnswerDamage,
      geminiModel: 'gemini-2.5-flash-lite',
      useApi: false,
      reducedMotion: false,
      language: 'en',
      set: (key, value) => set(() => ({ [key]: value } as Partial<SettingsState>)),
    }),
    { name: 'ph-settings' }
  )
);


