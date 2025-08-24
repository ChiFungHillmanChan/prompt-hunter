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
  scheme: 'attack_100_once' | 'attack_50_two_parts' | 'attack_20_bugs',
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


