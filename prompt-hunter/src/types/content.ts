export type Validator =
  | { type: 'equals'; value: string }
  | { type: 'not_equals'; value: string }
  | { type: 'equals_number'; value: number }
  | { type: 'text_contains'; value: string }
  | { type: 'regex_count'; pattern: string; count: number }
  | { type: 'contains_any'; patterns: string[] }
  | { type: 'keyword_any'; keywords: string[] }
  | { type: 'csv_count'; count: number }
  | { type: 'song_guess'; title_keywords: string[]; artist_keywords: string[] }
  | { type: 'manual_review'; note?: string }
  | { type: 'js_eval'; code: string }
  | { type: 'heal_exact_copy'; guidance: string }
  // AI numeric score validator; returns only a number string (e.g., '100' or '0')
  | { type: 'ai_score'; scheme: 'attack_100_once' | 'attack_50_two_parts' | 'attack_20_bugs'; guidance: string; bug_catalog?: { name: string; pattern: string; negate?: boolean; points?: number }[] };

// Special-case validator for the Mysterious role
export type MysteriousValidator = { type: 'mysterious'; keywords: string[]; prompt_mask?: string; hint?: string };

export type AnyValidator = Validator | MysteriousValidator;

export interface Phase {
  phase: number;
  task_type: string;
  question?: string; // Question shown to user
  prompt?: string; // AI guidance (old prompt field, now for AI context)
  assistant?: string; // AI assistant message to user
  hint?: string;
  bugged_code?: string;
  perfect_code?: string;
  lyric?: string;
  song?: string;
  bait_question?: string;
  hidden_html?: string;
  hidden_js?: string;
  hidden_data?: string;
  sentences?: string[]; // For healer phases
  validator?: Validator;
}

export interface Role {
  id: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'impossible';
  phases_per_run?: number;
  description?: string;
  phases: Phase[];
  secretWinningInputs?: string[];
}

export interface ContentPack {
  meta: {
    name: string;
    phases_per_run: number;
    monsters_per_phase_formula?: string;
    validator_api_note?: string;
    roles_included?: string[];
  };
  roles: Role[];
}


