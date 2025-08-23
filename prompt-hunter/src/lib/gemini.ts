type Usage = {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
};

export type GeminiResponse = { text: string; usage?: Usage };

export const GEMINI_MODEL = 'gemini-1.5-flash';

export class GeminiError extends Error {
  status?: number;
  code?: string;
  retryAfterSeconds?: number;
  raw?: unknown;
  constructor(message: string, opts?: { status?: number; code?: string; retryAfterSeconds?: number; raw?: unknown }) {
    super(message);
    this.name = 'GeminiError';
    this.status = opts?.status;
    this.code = opts?.code;
    this.retryAfterSeconds = opts?.retryAfterSeconds;
    this.raw = opts?.raw;
  }
}

export async function callGemini(apiKey: string, text: string): Promise<GeminiResponse> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text }]}],
      generationConfig: { temperature: 0.7 },
    }),
  });
  if (!res.ok) {
    let body: any = null;
    try {
      body = await res.json();
    } catch {}
    const retryAfterHeader = res.headers.get('retry-after');
    let retryAfterSeconds: number | undefined;
    if (retryAfterHeader) {
      const asNumber = Number(retryAfterHeader);
      if (!Number.isNaN(asNumber)) {
        retryAfterSeconds = asNumber;
      } else {
        const date = new Date(retryAfterHeader);
        const diffMs = date.getTime() - Date.now();
        if (!Number.isNaN(diffMs) && diffMs > 0) retryAfterSeconds = Math.ceil(diffMs / 1000);
      }
    }
    const apiError = body?.error;
    const code = apiError?.status || apiError?.code;
    const message = apiError?.message || `Gemini HTTP ${res.status}`;
    throw new GeminiError(message, { status: res.status, code: typeof code === 'string' ? code : undefined, retryAfterSeconds, raw: body });
  }
  const data = await res.json();
  const cand = data?.candidates?.[0];
  const parts = cand?.content?.parts || [];
  const fullText = parts.map((p: any) => p?.text || '').join('\n');
  const usage: Usage | undefined = data?.usageMetadata ? {
    promptTokenCount: data.usageMetadata.promptTokenCount || 0,
    candidatesTokenCount: data.usageMetadata.candidatesTokenCount || 0,
    totalTokenCount: data.usageMetadata.totalTokenCount || 0,
  } : undefined;
  return { text: fullText, usage };
}

export function maskKey(key: string): string {
  if (!key) return '';
  const last = key.slice(-4);
  return `••••••••••${last}`;
}


