import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULTS } from '../lib/constants';

type SettingsState = {
  attackIntervalMs: number;
  monsterDamagePerTick: number;
  playerMaxHP: number;
  playerAnswerDamage: number;
  geminiModel: 'gemini-1.5-flash';
  useApi: boolean;
  reducedMotion: boolean;
  set<K extends keyof Omit<SettingsState, 'set'>>(key: K, value: SettingsState[K]): void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      attackIntervalMs: DEFAULTS.attackIntervalMs,
      monsterDamagePerTick: DEFAULTS.monsterDamagePerTick,
      playerMaxHP: DEFAULTS.playerMaxHP,
      playerAnswerDamage: DEFAULTS.playerAnswerDamage,
      geminiModel: 'gemini-1.5-flash',
      useApi: false,
      reducedMotion: false,
      set: (key, value) => set(() => ({ [key]: value } as Partial<SettingsState>)),
    }),
    { name: 'ph-settings' }
  )
);


