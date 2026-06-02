import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Server-side Gemini proxy. Lets signed-in users share Hillman's Gemini key
// WITHOUT the key ever reaching the browser. Anyone who wants more than the
// daily allowance can still bring their own key (handled entirely client-side).

const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const DAILY_LIMIT = Number(process.env.PROMPT_HUNTER_DAILY_LIMIT || '30');
const MAX_PROMPT_CHARS = 8000;

function initAdmin() {
  if (getApps().length) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT is not set');
  const sa = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
  initializeApp({ credential: cert(sa) });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    initAdmin();
  } catch {
    res.status(500).json({ error: 'Server not configured', code: 'CONFIG' });
    return;
  }

  // 1. Verify the Firebase ID token.
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!idToken) {
    res.status(401).json({ error: 'Sign in required', code: 'NO_TOKEN' });
    return;
  }

  let decoded;
  try {
    decoded = await getAuth().verifyIdToken(idToken);
  } catch {
    res.status(401).json({ error: 'Invalid session — sign in again', code: 'BAD_TOKEN' });
    return;
  }
  if (decoded.email_verified !== true) {
    res.status(403).json({ error: 'Email not verified', code: 'UNVERIFIED' });
    return;
  }

  // 2. Validate input.
  const text = typeof req.body?.text === 'string' ? req.body.text : '';
  if (!text.trim()) {
    res.status(400).json({ error: 'Text prompt is required', code: 'NO_TEXT' });
    return;
  }
  if (text.length > MAX_PROMPT_CHARS) {
    res.status(400).json({ error: 'Prompt is too long', code: 'TOO_LONG' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server not configured', code: 'CONFIG' });
    return;
  }

  // 3. Per-user daily rate limit (Firestore, survives cold starts).
  const db = getFirestore();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  const usageRef = db.doc(`promptHunterUsage/${decoded.uid}_${today}`);
  try {
    const snap = await usageRef.get();
    const count = snap.exists ? (snap.data()?.count || 0) : 0;
    if (count >= DAILY_LIMIT) {
      res.status(429).json({
        error: `Daily limit reached (${DAILY_LIMIT}/day). Add your own Gemini key in Settings to keep going.`,
        code: 'DAILY_LIMIT',
        limit: DAILY_LIMIT,
      });
      return;
    }
  } catch {
    res.status(500).json({ error: 'Rate-limit check failed', code: 'RL' });
    return;
  }

  // 4. Call Gemini with the server-held key.
  let geminiData: Record<string, unknown>;
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024, topP: 0.8, topK: 40 },
      }),
    });
    geminiData = await r.json();
    if (!r.ok) {
      const message = (geminiData?.error as Record<string, unknown>)?.message;
      res.status(502).json({
        error: typeof message === 'string' ? message : 'Gemini error',
        code: 'GEMINI',
        status: r.status,
      });
      return;
    }
  } catch {
    res.status(502).json({ error: 'Gemini request failed', code: 'GEMINI' });
    return;
  }

  const candidates = geminiData?.candidates as Array<Record<string, unknown>> | undefined;
  const content = candidates?.[0]?.content as Record<string, unknown> | undefined;
  const parts = (content?.parts as Array<Record<string, unknown>>) || [];
  const fullText = parts.map((p) => (p?.text as string) || '').join('\n');

  const meta = geminiData?.usageMetadata as Record<string, number> | undefined;
  const usage = meta
    ? {
        promptTokenCount: meta.promptTokenCount || 0,
        candidatesTokenCount: meta.candidatesTokenCount || 0,
        totalTokenCount: meta.totalTokenCount || 0,
      }
    : undefined;

  // 5. Only count a request that actually produced a response (fairer to users).
  try {
    await usageRef.set(
      { count: FieldValue.increment(1), email: decoded.email, updatedAt: new Date().toISOString() },
      { merge: true },
    );
  } catch {
    // Non-fatal: the user already has their answer; worst case the request is uncounted.
  }

  res.status(200).json({ text: fullText, usage });
}
