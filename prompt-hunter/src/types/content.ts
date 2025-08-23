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
  | { type: 'js_eval'; code: string };

export interface Phase {
  phase: number;
  task_type: string;
  prompt: string;
  hint?: string;
  bugged_code?: string;
  perfect_code?: string;
  lyric?: string;
  song?: string;
  bait_question?: string;
  hidden_html?: string;
  hidden_js?: string;
  hidden_data?: string;
  validator?: Validator;
}

export interface Role {
  id: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'impossible';
  description?: string;
  phases: Phase[];
  secretWinningInputs?: string[]; // for Mysterious
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


