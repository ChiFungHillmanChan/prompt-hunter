import { create } from 'zustand';

type SessionState = {
  roleId: string | null;
  phaseIndex: number;
  playerHP: number;
  monsterHP: number;
  maxMonsterHP: number;
  nextAttackMs: number;
  running: boolean;
  resetForRole: (roleId: string, maxPlayerHP: number, monsterHP: number) => void;
  setPhaseIndex: (idx: number) => void;
  setPlayerHP: (hp: number) => void;
  setMonsterHP: (hp: number) => void;
  setNextAttackMs: (ms: number) => void;
  setRunning: (running: boolean) => void;
};

export const useSession = create<SessionState>((set) => ({
  roleId: null,
  phaseIndex: 0,
  playerHP: 0,
  monsterHP: 0,
  maxMonsterHP: 0,
  nextAttackMs: 0,
  running: false,
  resetForRole: (roleId, maxPlayerHP, monsterHP) =>
    set({
      roleId,
      phaseIndex: 0,
      playerHP: maxPlayerHP,
      monsterHP,
      maxMonsterHP: monsterHP,
      nextAttackMs: 0,
      running: true,
    }),
  setPhaseIndex: (idx) => set({ phaseIndex: idx }),
  setPlayerHP: (hp) => set({ playerHP: hp }),
  setMonsterHP: (hp) => set({ monsterHP: hp }),
  setNextAttackMs: (ms) => set({ nextAttackMs: ms }),
  setRunning: (running) => set({ running }),
}));


