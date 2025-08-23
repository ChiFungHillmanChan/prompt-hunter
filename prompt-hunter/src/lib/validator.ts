import type { Phase } from '../types/content';

export async function validateAnswer(
  phase: Phase,
  userText: string,
  extras?: { songTitle?: string; songArtist?: string }
): Promise<{ ok: boolean; message: string }> {
  const v = phase.validator;
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


