import React from 'react';
import { callGemini, GeminiError } from '../lib/gemini';
import { buildContext } from '../lib/contextBuilder';
import type { Phase, Role } from '../types/content';
import { useToast } from './Toast';

type Props = {
  role: Role;
  phase: Phase;
};

export default function ChatPanel({ role, phase }: Props) {
  const [apiKey] = React.useState<string>(() => sessionStorage.getItem('gemini_api_key') || '');
  const [prompt, setPrompt] = React.useState('');
  const [resp, setResp] = React.useState('');
  // removed usage tracking UI
  const [loading, setLoading] = React.useState(false);
  const toast = useToast();

  const onCopyContext = () => {
    const ctx = buildContext(role, phase);
    navigator.clipboard.writeText(ctx);
  };

  const onSend = async () => {
    if (!apiKey || loading) return;
    setLoading(true);
    try {
      const ctx = buildContext(role, phase) + '\n\n' + prompt;
      const res = await callGemini(apiKey, ctx);
      // Mask responses for Mysterious
      if (role.id === 'mysterious') {
        setResp('????????????????????');
      } else {
        setResp(res.text);
      }
      // usage tracking removed from UI
    } catch (err) {
      if (err instanceof GeminiError) {
        if (err.status === 429) {
          const errorData = err.raw as any;
          const isQuotaExhausted = errorData?.error?.message?.includes('Quota exceeded');
          const isRateLimit = errorData?.error?.message?.includes('rate limit') || 
                             errorData?.error?.details?.some((d: any) => d.reason === 'RATE_LIMIT_EXCEEDED');
          
          if (isQuotaExhausted) {
            toast.push('error', 'API quota exhausted. Your key has 0 requests/minute limit. Get a new key or enable billing in Google Cloud.');
          } else if (isRateLimit) {
            const retry = err.retryAfterSeconds ? ` Retrying in ~${err.retryAfterSeconds}s.` : ' Retrying with backoff.';
            toast.push('error', `Rate limited by Gemini.${retry}`);
          } else {
            toast.push('error', `Rate limited (HTTP 429): ${err.message}`);
          }
        } else if (err.status === 401 || err.status === 403) {
          toast.push('error', 'API key rejected (401/403). Check key validity and restrictions in Google AI Studio.');
        } else if (err.message?.includes('Invalid API key format')) {
          toast.push('error', 'Invalid API key format. Remove and add a valid key in Settings.');
        } else {
          toast.push('error', err.message || 'Gemini request failed.');
        }
      } else {
        toast.push('error', 'Unexpected error calling Gemini.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 bg-white/5 border border-white/10 rounded text-sm space-y-2">
      <div className="font-semibold">Gemini Chat</div>
      {/* API key managed by gate; no input here */}
      <div className="flex gap-2">
        <button className="px-2 py-1 text-xs bg-slate-700 rounded" onClick={onCopyContext}>Copy Context</button>
        <a
          className="px-2 py-1 text-xs bg-slate-700 rounded"
          href="https://aistudio.google.com/prompts/new_chat"
          target="_blank" rel="noreferrer"
        >Open Gemini</a>
      </div>
      <textarea
        rows={3}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full px-2 py-2 bg-black/40 rounded border border-white/10"
        placeholder="Ask for help"
      />
      <button onClick={onSend} disabled={!apiKey || loading} className="px-3 py-2 rounded bg-purple-600 disabled:opacity-50">
        {loading ? 'Sending…' : 'Send'}
      </button>
      {resp && (
        <pre className="bg-black/40 border border-white/10 p-2 rounded overflow-x-auto text-xs max-h-40 whitespace-pre-wrap">{resp}</pre>
      )}
    </div>
  );
}


