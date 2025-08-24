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

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

export async function callGemini(apiKey: string, text: string): Promise<GeminiResponse> {
  if (!apiKey || !apiKey.trim()) {
    throw new GeminiError('API key is required');
  }
  
  // Basic API key format validation
  if (!apiKey.startsWith('AIza') || apiKey.length < 35) {
    throw new GeminiError('Invalid API key format. Should start with "AIza" and be at least 35 characters long.');
  }
  
  if (!text || !text.trim()) {
    throw new GeminiError('Text prompt is required');
  }

  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();

  return await callGeminiWithRetry(apiKey, text, 3);
}

async function callGeminiWithRetry(apiKey: string, text: string, maxRetries: number): Promise<GeminiResponse> {
  let lastError: GeminiError | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const requestBody = {
        contents: [{ 
          parts: [{ text: text }]
        }],
        generationConfig: { 
          temperature: 0.7,
          maxOutputTokens: 1024,
          topP: 0.8,
          topK: 40
        },
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!res.ok) {
        let body: any = null;
        try {
          body = await res.json();
        } catch (jsonError) {
          // Could not parse error response as JSON
        }
        
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
        const message = apiError?.message || `Gemini HTTP ${res.status}: ${res.statusText}`;
        const error = new GeminiError(message, { status: res.status, code: typeof code === 'string' ? code : undefined, retryAfterSeconds, raw: body });
        
        if (res.status === 429 && attempt < maxRetries) {
          lastError = error;
          const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 30000) + Math.random() * 1000;
          const retryDelay = retryAfterSeconds ? retryAfterSeconds * 1000 : backoffDelay;
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        
        throw error;
      }
      
      const data = await res.json();
      
      const cand = data?.candidates?.[0];
      if (!cand) {
        throw new GeminiError('No candidates in response', { raw: data });
      }
      
      const parts = cand?.content?.parts || [];
      if (parts.length === 0) {
        throw new GeminiError('No parts in candidate content', { raw: data });
      }
      
      const fullText = parts.map((p: any) => p?.text || '').join('\n');
      const usage: Usage | undefined = data?.usageMetadata ? {
        promptTokenCount: data.usageMetadata.promptTokenCount || 0,
        candidatesTokenCount: data.usageMetadata.candidatesTokenCount || 0,
        totalTokenCount: data.usageMetadata.totalTokenCount || 0,
      } : undefined;
      
      return { text: fullText, usage };
    } catch (error) {
      if (error instanceof GeminiError && error.status === 429 && attempt < maxRetries) {
        lastError = error;
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 30000) + Math.random() * 1000;
        const retryDelay = error.retryAfterSeconds ? error.retryAfterSeconds * 1000 : backoffDelay;
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
      throw error;
    }
  }
  
  throw lastError || new GeminiError('Max retries exceeded');
}

export function maskKey(key: string): string {
  if (!key) return '';
  const last = key.slice(-4);
  return `••••••••••${last}`;
}


