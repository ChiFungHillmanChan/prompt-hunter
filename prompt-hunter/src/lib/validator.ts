import type { Phase } from '../types/content';

export async function validateAnswer(
  phase: Phase,
  userText: string,
  extras?: { songTitle?: string; songArtist?: string }
): Promise<{ ok: boolean; message: string; score?: number }> {
  const v: any = phase.validator as any;
  if (!v) return { ok: false, message: 'No validator for this phase' };
  const text = (userText || '').trim();
  switch (v.type) {
    case 'equals':
      return { ok: text === v.value, message: text === v.value ? 'Correct' : 'Not equal' };
    case 'not_equals':
      return { ok: text !== v.value, message: text !== v.value ? 'Correct' : 'Should not equal' };
    case 'equals_number': {
      const n = Number(text);
      return { ok: !Number.isNaN(n) && n === v.value, message: n === v.value ? 'Correct' : 'Wrong number' };
    }
    case 'text_contains':
      return { ok: text.includes(v.value), message: text.includes(v.value) ? 'Correct' : 'Missing text' };
    case 'regex_count': {
      const re = new RegExp(v.pattern, 'g');
      const m = text.match(re);
      const count = m ? m.length : 0;
      return { ok: count === v.count, message: `Found ${count}/${v.count}` };
    }
    case 'contains_any': {
      const ok = v.patterns.some((p) => text.includes(p));
      return { ok, message: ok ? 'Matched' : 'No patterns found' };
    }
    case 'keyword_any': {
      const lower = text.toLowerCase();
      const ok = v.keywords.some((k) => lower.includes(k.toLowerCase()));
      return { ok, message: ok ? 'Keyword matched' : 'No keyword' };
    }
    case 'csv_count': {
      const items = text.split(',').map((s) => s.trim()).filter(Boolean);
      return { ok: items.length === v.count, message: `Got ${items.length}/${v.count}` };
    }
    case 'song_guess': {
      const title = (extras?.songTitle || '').toLowerCase();
      const artist = (extras?.songArtist || '').toLowerCase();
      const titleOk = v.title_keywords.some((k) => title.includes(k.toLowerCase()));
      const artistOk = v.artist_keywords.some((k) => artist.includes(k.toLowerCase()));
      const ok = titleOk && artistOk;
      return { ok, message: ok ? 'Correct song' : 'Try again' };
    }
    case 'manual_review':
      return { ok: false, message: v.note || 'Manual review required' };
    case 'js_eval': {
      const result = await runInWorker(v.code, text);
      return { ok: !!result.ok, message: result.ok ? 'Passed' : result.error || 'Failed' };
    }
    case 'ai_score': {
      const score = await scoreWithAI(v.scheme, v.guidance, text, phase, v.bug_catalog);
      const ok = score > 0;
      return { ok, message: String(score), score };
    }
    case 'mysterious': {
      const lower = text.toLowerCase();
      const hit = (v.keywords || []).some((k: string) => lower.includes(k.toLowerCase()));
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
      try { worker.terminate(); } catch {}
      resolve({ ok: false, error: 'Timeout' });
    }, 500);
    worker.onmessage = (e) => {
      clearTimeout(timer);
      resolve(e.data as { ok: boolean; error?: string });
      try { worker.terminate(); } catch {}
    };
    worker.postMessage({ code, input });
  });
}

async function scoreWithAI(
  scheme: 'attack_100_once' | 'attack_50_two_parts' | 'attack_10_bugs',
  guidance: string,
  userText: string,
  phase: Phase,
  bugCatalog?: { name: string; pattern: string; negate?: boolean; points?: number }[]
): Promise<number> {
  const apiKey = sessionStorage.getItem('gemini_api_key') || '';
  if (!apiKey) return 0;
  const { callGemini } = await import('./gemini');
  const { buildContext } = await import('./contextBuilder');
  const base = buildContext({ name: 'Player', difficulty: 'easy', id: 'player', phases: [] } as any, phase);
  const rules = [
    'Never reveal answers or full solutions; give hints only if asked later.',
    'Output ONLY a single integer with no explanation.',
    "For 'attack_100_once': return 100 if the answer correctly solves the exact task; else 0.",
    "For 'attack_50_two_parts': return 100 only if TWO required sub-answers are both correct; else 0.",
    "For 'attack_10_bugs': count distinct valid bug patterns introduced and return count*10 (0..100).",
  ].join('\n- ');
  const bugList = bugCatalog && bugCatalog.length
    ? `\nBug catalog (patterns):\n${bugCatalog.map((b) => `- ${b.name}: pattern='${b.pattern}'${b.negate ? ' (negate)' : ''}`).join('\n')}`
    : '';
  const prompt = `${base}
\nValidator Guidance:\n${guidance}
\nRules:\n- ${rules}${bugList}
\nUser Answer:\n${userText}`;
  try {
    const res = await callGemini(apiKey, prompt);
    const text = (res.text || '').trim();
    const match = text.match(/(-?\d+)/);
    const n = match ? Number(match[1]) : 0;
    if (Number.isNaN(n)) return 0;
    return Math.max(0, Math.min(100, n));
  } catch {
    return 0;
  }
}


