import type { Phase } from '../types/content';

export async function validateAnswer(
  phase: Phase,
  userText: string,
  extras?: { songTitle?: string; songArtist?: string }
): Promise<{ ok: boolean; message: string; score?: number }> {
  const v = phase.validator as Record<string, unknown>;
  if (!v) return { ok: false, message: 'No validator for this phase' };
  const text = (userText || '').trim();
  switch (v.type) {
    case 'equals':
      return { ok: text === v.value, message: text === v.value ? 'Correct' : 'Not equal' };
    case 'not_equals':
      return { ok: text !== v.value, message: text !== v.value ? 'Correct' : 'Should not equal' };
    case 'equals_number': {
      // Handle array of numbers (for necromancer x,y format)
      if (Array.isArray(v.value)) {
        const parts = text.split(',').map(p => p.trim());
        if (parts.length !== v.value.length) {
          return { ok: false, message: `Expected ${v.value.length} numbers, got ${parts.length}` };
        }
        const numbers = parts.map(p => Number(p));
        const expectedNumbers = v.value.map(val => Number(val));
        const allMatch = numbers.every((n, i) => !Number.isNaN(n) && n === expectedNumbers[i]);
        return { ok: allMatch, message: allMatch ? 'Correct' : 'Wrong numbers' };
      }
      // Handle single number
      const n = Number(text);
      const value = Number(v.value);
      return { ok: !Number.isNaN(n) && n === value, message: n === value ? 'Correct' : 'Wrong number' };
    }
    case 'text_contains':
      return { ok: text.includes(String(v.value)), message: text.includes(String(v.value)) ? 'Correct' : 'Missing text' };
    case 'regex_count': {
      const re = new RegExp(String(v.pattern), 'g');
      const m = text.match(re);
      const count = m ? m.length : 0;
      const expectedCount = Number(v.count) || 0;
      return { ok: count === expectedCount, message: `Found ${count}/${expectedCount}` };
    }
    case 'contains_any': {
      const patterns = Array.isArray(v.patterns) ? v.patterns : [];
      const ok = patterns.some((p: unknown) => text.includes(String(p)));
      return { ok, message: ok ? 'Matched' : 'No patterns found' };
    }
    case 'keyword_any': {
      const lower = text.toLowerCase();
      const keywords = Array.isArray(v.keywords) ? v.keywords : [];
      const ok = keywords.some((k: unknown) => lower.includes(String(k).toLowerCase()));
      return { ok, message: ok ? 'Keyword matched' : 'No keyword' };
    }
    case 'csv_count': {
      const items = text.split(',').map((s) => s.trim()).filter(Boolean);
      const expectedCount = Number(v.count) || 0;
      return { ok: items.length === expectedCount, message: `Got ${items.length}/${expectedCount}` };
    }
    case 'song_guess': {
      const title = (extras?.songTitle || '').toLowerCase();
      const artist = (extras?.songArtist || '').toLowerCase();
      const titleKeywords = Array.isArray(v.title_keywords) ? v.title_keywords : [];
      const artistKeywords = Array.isArray(v.artist_keywords) ? v.artist_keywords : [];
      const titleOk = titleKeywords.some((k: unknown) => title.includes(String(k).toLowerCase()));
      const artistOk = artistKeywords.some((k: unknown) => artist.includes(String(k).toLowerCase()));
      const ok = titleOk && artistOk;
      return { ok, message: ok ? 'Correct song' : 'Try again' };
    }
    case 'manual_review':
      return { ok: false, message: String(v.note) || 'Manual review required' };
    case 'js_eval': {
      const result = await runInWorker(String(v.code), text);
      return { ok: !!result.ok, message: result.ok ? 'Passed' : result.error || 'Failed' };
    }
    case 'ai_score': {
      // Check for blank answers first
      if (!text || text.trim().length === 0) {
        return { ok: false, message: '0', score: 0 };
      }
      
      const scheme = String(v.scheme) as 'attack_100_once' | 'attack_50_two_parts' | 'attack_20_bugs';
      if (!['attack_100_once', 'attack_50_two_parts', 'attack_20_bugs'].includes(scheme)) {
        return { ok: false, message: 'Invalid scoring scheme' };
      }
      
      const result = await scoreWithAI(scheme, String(v.guidance), text, phase, v.bug_catalog as { name: string; pattern: string; negate?: boolean; points?: number }[] | undefined);
      if (typeof result === 'object') {
        // Error case
        return { ok: false, message: result.error };
      }
      // Success case - result is a number
      // Only pass if score is above 0 (strict validation)
      const ok = result >= 100; // Only perfect scores pass
      return { ok, message: String(result), score: result };
    }
    case 'keywords': {
      const lower = text.toLowerCase();
      const required = Array.isArray(v.required) ? v.required : [];
      const optional = Array.isArray(v.optional) ? v.optional : [];
      
      // Check required keywords - all must be present
      const missingRequired = required.filter((k: unknown) => 
        !lower.includes(String(k).toLowerCase())
      );
      
      // Check optional keywords - count how many are present
      const foundOptional = optional.filter((k: unknown) => 
        lower.includes(String(k).toLowerCase())
      );
      
      const allRequiredFound = missingRequired.length === 0;
      
      // Build feedback message
      let message = '';
      if (allRequiredFound) {
        message = `✅ All required keywords found. Optional: ${foundOptional.length}/${optional.length}`;
      } else {
        message = `❌ Missing required keywords: ${missingRequired.join(', ')}`;
        if (foundOptional.length > 0) {
          message += `. Found optional: ${foundOptional.map(String).join(', ')}`;
        }
      }
      
      return { 
        ok: allRequiredFound, 
        message,
        score: allRequiredFound ? 100 : 0
      };
    }
    case 'heal_exact_copy': {
      return await handleHealExactCopyFromSentences(text, phase);
    }
    case 'mysterious': {
      const lower = text.toLowerCase();
      const keywords = Array.isArray(v.keywords) ? v.keywords : [];
      const hit = keywords.some((k: unknown) => lower.includes(String(k).toLowerCase()));
      // Message intentionally masked
      return { ok: hit, message: '????????????????????', score: hit ? 100000000 : 1 };
    }
    default:
      return { ok: false, message: 'Unknown validator' };
  }
}


// Store state for healer sentences
const healerSentenceState: { 
  [phaseKey: string]: { 
    currentSentenceIndex: number;
    availableSentences: string[];
    isUsingPremade: boolean;
  } 
} = {};

// Function to clear healer target sentence for a specific phase (for new sentence requests)
export function clearHealerTargetSentence(phaseNumber: number, taskType: string) {
  const phaseKey = `${phaseNumber}-${taskType}`;
  if (healerSentenceState[phaseKey]) {
    healerSentenceState[phaseKey].currentSentenceIndex++;
  }
}

// Function to reset healer sentence state for a specific phase (for restart/death)
export function resetHealerSentenceState(phaseNumber: number, taskType: string) {
  const phaseKey = `${phaseNumber}-${taskType}`;
  if (healerSentenceState[phaseKey]) {
    healerSentenceState[phaseKey] = {
      currentSentenceIndex: 0,
      availableSentences: (healerSentenceState[phaseKey].availableSentences || []).slice(0, 10),
      isUsingPremade: true
    };
  }
}

// Function to completely clear all healer sentence state (for full reset)
export function clearAllHealerSentenceState() {
  Object.keys(healerSentenceState).forEach(key => {
    delete healerSentenceState[key];
  });
}

// Function to get AI-generated sentences when premade ones are exhausted
async function generateAISentences(phase: Phase): Promise<string[]> {
  try {
    const apiKey = sessionStorage.getItem('gemini_api_key') || '';
    if (!apiKey) {
      throw new Error('API key required for AI generation');
    }
    
    const { callGemini } = await import('./gemini');
    
    const prompt = `Generate 5 new sentences for a typing practice game. The sentences should be:
- Similar in length and complexity to the original sentences
- Engaging and varied in content
- Appropriate for all ages
- Each sentence should be unique and interesting

Original sentences for reference:
${(phase.sentences || []).slice(0, 3).join('\n')}

Generate exactly 5 new sentences, one per line, with no numbering or extra formatting:`;

    const res = await callGemini(apiKey, prompt);
    const text = res.text || '';
    
    // Parse the response into individual sentences
    const sentences = text
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.match(/^\d+\./)) // Remove empty lines and numbered items
      .slice(0, 5); // Take first 5 valid sentences
    
    if (sentences.length === 0) {
      throw new Error('Failed to generate sentences');
    }
    
    return sentences;
  } catch (error) {
    console.error('Failed to generate AI sentences:', error);
    // Return some fallback sentences if AI generation fails
    return [
      "The weather is beautiful today.",
      "I enjoy reading interesting books.",
      "Learning new things is exciting.",
      "Friends make life more enjoyable.",
      "Every day brings new opportunities."
    ];
  }
}

// Function to get the next sentence for healer without validation
export function getNextHealerSentence(phase: Phase): { target_sentence?: string; sentences_remaining?: number; isUsingPremade?: boolean } | null {
  const sentences = phase.sentences || [];
  
  if (sentences.length === 0) {
    return null;
  }
  
  const phaseKey = `${phase.phase}-${phase.task_type}`;
  
  // Initialize state for this phase if not exists
  if (!healerSentenceState[phaseKey]) {
    healerSentenceState[phaseKey] = {
      currentSentenceIndex: 0,
      availableSentences: sentences.slice(0, 10), // Take only first 10 sentences
      isUsingPremade: true
    };
  }
  
  const state = healerSentenceState[phaseKey];
  
  // Check if we've exhausted premade sentences and need to generate new ones
  if (state.isUsingPremade && state.currentSentenceIndex >= state.availableSentences.length) {
    // Return null to indicate we need AI generation
    return null;
  }
  
  const sentencesRemaining = Math.max(0, state.availableSentences.length - state.currentSentenceIndex);
  
  // Check if no more sentences available
  if (state.currentSentenceIndex >= state.availableSentences.length) {
    return null;
  }
  
  const targetSentence = state.availableSentences[state.currentSentenceIndex];
  
  return { 
    target_sentence: targetSentence,
    sentences_remaining: sentencesRemaining,
    isUsingPremade: state.isUsingPremade
  };
}

// Function to count character mismatches between two strings
function countStringMismatches(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  let mismatches = 0;
  
  for (let i = 0; i < maxLength; i++) {
    if (i >= str1.length || i >= str2.length || str1[i] !== str2[i]) {
      mismatches++;
    }
  }
  
  return mismatches;
}

async function handleHealExactCopyFromSentences(userText: string, phase: Phase): Promise<{ ok: boolean; message: string; score?: number; error_count?: number; target_sentence?: string; sentences_remaining?: number }> {
  
  const sentences = phase.sentences || [];
  
  if (sentences.length === 0) {
    return { ok: false, message: 'No sentences available for this phase' };
  }
  
  const phaseKey = `${phase.phase}-${phase.task_type}`;
  
  // Initialize state for this phase if not exists
  if (!healerSentenceState[phaseKey]) {
    healerSentenceState[phaseKey] = {
      currentSentenceIndex: 0,
      availableSentences: sentences.slice(0, 10), // Take only first 10 sentences
      isUsingPremade: true
    };
  }
  
  const state = healerSentenceState[phaseKey];
  
  // Check if we've exhausted premade sentences and need to generate new ones
  if (state.isUsingPremade && state.currentSentenceIndex >= state.availableSentences.length) {
    // Switch to AI-generated sentences
    try {
      const aiSentences = await generateAISentences(phase);
      state.availableSentences = aiSentences;
      state.currentSentenceIndex = 0;
      state.isUsingPremade = false;
    } catch (error) {
      // If AI generation fails, return error
      return { 
        ok: false, 
        message: 'No more sentences available. get new sentence.', 
        score: 0, 
        target_sentence: '', 
        sentences_remaining: 0 
      };
    }
  }
  
  const sentencesRemaining = Math.max(0, state.availableSentences.length - state.currentSentenceIndex);
  
  // Check if no more sentences available
  if (state.currentSentenceIndex >= state.availableSentences.length) {
    return { 
      ok: false, 
      message: 'No more questions. get new sentence.', 
      score: 0, 
      target_sentence: '', 
      sentences_remaining: 0 
    };
  }
  
  const targetSentence = state.availableSentences[state.currentSentenceIndex];
  
  // Use simple string comparison algorithm instead of AI checking
  const isExactMatch = userText === targetSentence;
  const errorCount = countStringMismatches(userText, targetSentence);
  
  if (isExactMatch) {
    // Move to next sentence only when correct
    state.currentSentenceIndex++;
    
    return { 
      ok: true, 
      message: '100', 
      score: 100, 
      error_count: 0, 
      target_sentence: targetSentence,
      sentences_remaining: sentencesRemaining - 1
    };
  } else {
    // Stay on same sentence when incorrect
    return { 
      ok: false, 
      message: errorCount.toString(), 
      score: 0, 
      error_count: errorCount, 
      target_sentence: targetSentence,
      sentences_remaining: sentencesRemaining
    };
  }
}

function runInWorker(code: string, input: string): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    const worker = new Worker(new URL('../workers/sandbox.worker.ts', import.meta.url), { type: 'module' });
    const timer = setTimeout(() => {
      try { worker.terminate(); } catch {
        // Worker already terminated
      }
      resolve({ ok: false, error: 'Timeout' });
    }, 500);
    worker.onmessage = (e) => {
      clearTimeout(timer);
      resolve(e.data as { ok: boolean; error?: string });
      try { worker.terminate(); } catch {
        // Worker already terminated
      }
    };
    worker.postMessage({ code, input });
  });
}

async function scoreWithAI(
  scheme: 'attack_100_once' | 'attack_50_two_parts' | 'attack_20_bugs' | 'heal_exact_copy',
  guidance: string,
  userText: string,
  phase: Phase,
  bugCatalog?: { name: string; pattern: string; negate?: boolean; points?: number }[]
): Promise<number | { error: string }> {
  const apiKey = sessionStorage.getItem('gemini_api_key') || '';
  if (!apiKey) return { error: 'API key required for validation' };
  const { callGemini } = await import('./gemini');
  const { buildContext } = await import('./contextBuilder');
  const base = buildContext({ name: 'Player', difficulty: 'easy', id: 'player', phases: [] }, phase);
  
  // For Hacker phases, include hidden content for AI validation
  let hiddenContent = '';
  if (phase.hidden_html) hiddenContent += `\nHidden HTML: ${phase.hidden_html}`;
  if (phase.hidden_data) hiddenContent += `\nHidden Data: ${phase.hidden_data}`;
  if (phase.hidden_js) hiddenContent += `\nHidden JS: ${phase.hidden_js}`;
  const schemeLine = `Scheme: ${scheme}`;
  const rules = [
    'Never reveal answers or full solutions; give hints only if asked later.',
    'Output ONLY a single integer with no explanation.',
    'Be STRICT: blank answers, incomplete answers, or wrong answers should return 0.',
    'REJECT HINTS: If user provides hints, explanations, or questions instead of concrete solutions, return 0.',
    'REJECT NON-CODE: For coding tasks, user must provide actual working code, not descriptions or suggestions.',
    "For 'attack_100_once': return 100 if the answer correctly solves the exact task; else 0.",
    "For 'attack_50_two_parts': return 100 only if TWO required sub-answers are both correct; else 0.",
    "For 'attack_20_bugs': count distinct valid bug patterns introduced and return count*20 (0..100).",
    'If the user provides no answer, incomplete answer, or wrong answer, return 0.',
  ].join('\n- ');
  const bugList = bugCatalog && bugCatalog.length
    ? `\nBug catalog (patterns):\n${bugCatalog.map((b) => `- ${b.name}: pattern='${b.pattern}'${b.negate ? ' (negate)' : ''}`).join('\n')}`
    : '';
  const prompt = `${base}${hiddenContent}
\n${schemeLine}
Validator Guidance:
${guidance}

Rules:
- ${rules}${bugList}

EXAMPLES OF INVALID ANSWERS (return 0):
- "You should check the loop condition" (hint, not solution)
- "Try using <= instead of <" (suggestion, not actual code)  
- "The problem is with the comparison operator" (explanation, not fix)
- "Think about what happens when..." (question, not answer)

EXAMPLES OF VALID ANSWERS (may return 100):
- "for(let i=1;i<=5;i++){console.log(i)}" (actual working code)
- "i<=5" (concrete fix)
- Actual code that solves the specific problem

User Answer:
${userText}`;
  try {
    const res = await callGemini(apiKey, prompt);
    const text = (res.text || '').trim();
    const match = text.match(/(-?\d+)/);
    const n = match ? Number(match[1]) : 0;
    if (Number.isNaN(n)) return { error: 'Invalid AI response' };
    return Math.max(0, Math.min(100, n));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage?.includes('Invalid API key')) {
      return { error: 'Invalid API key format' };
    }
    if (errorMessage?.includes('API key')) {
      return { error: 'API key required for validation' };
    }
    return { error: 'Validation failed' };
  }
}


