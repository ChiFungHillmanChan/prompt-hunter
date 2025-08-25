import { create } from 'zustand';

type SessionState = {
  roleId: string | null;
  phaseIndex: number;
  playerHP: number;
  monsterHP: number;
  maxMonsterHP: number;
  nextAttackMs: number;
  running: boolean;
  // Detective-specific fields
  detectiveCompletedQuestions: number[];
  detectiveCurrentQuestions: number[];
  detectiveQuestionIndex: number;
  resetForRole: (roleId: string, maxPlayerHP: number, monsterHP: number) => void;
  setPhaseIndex: (idx: number) => void;
  setPlayerHP: (hp: number) => void;
  setMonsterHP: (hp: number) => void;
  setNextAttackMs: (ms: number) => void;
  setRunning: (running: boolean) => void;
  // Detective methods
  setDetectiveProgress: (completed: number[], current: number[], questionIndex: number) => void;
  completeDetectiveQuestion: (questionIndex: number) => void;
};

// Helper function to select 5 random questions for detective
export function selectDetectiveQuestions(totalQuestions: number, completedQuestions: number[]): number[] {
  const allQuestions = Array.from({ length: totalQuestions }, (_, i) => i);
  const unfinished = allQuestions.filter(q => !completedQuestions.includes(q));
  
  // If we have 5+ unfinished questions, pick 5 random unfinished
  if (unfinished.length >= 5) {
    return unfinished.sort(() => Math.random() - 0.5).slice(0, 5);
  }
  
  // If less than 5 unfinished, include all unfinished + random from completed
  const needed = 5 - unfinished.length;
  const completed = allQuestions.filter(q => completedQuestions.includes(q));
  const randomCompleted = completed.sort(() => Math.random() - 0.5).slice(0, needed);
  
  return [...unfinished, ...randomCompleted].sort(() => Math.random() - 0.5);
}

export const useSession = create<SessionState>((set) => ({
  roleId: null,
  phaseIndex: 0,
  playerHP: 0,
  monsterHP: 0,
  maxMonsterHP: 0,
  nextAttackMs: 0,
  running: false,
  detectiveCompletedQuestions: [],
  detectiveCurrentQuestions: [],
  detectiveQuestionIndex: 0,
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
  setDetectiveProgress: (completed, current, questionIndex) => 
    set({ 
      detectiveCompletedQuestions: completed, 
      detectiveCurrentQuestions: current, 
      detectiveQuestionIndex: questionIndex 
    }),
  completeDetectiveQuestion: (questionIndex) => 
    set((state) => ({
      detectiveCompletedQuestions: [...state.detectiveCompletedQuestions, questionIndex]
    })),
}));


