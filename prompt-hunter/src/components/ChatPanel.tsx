import React from 'react';
import { callGemini, GEMINI_MODEL, GeminiError } from '../lib/gemini';
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
  const [usage, setUsage] = React.useState({ prompt: 0, cand: 0, total: 0 });
  const [loading, setLoading] = React.useState(false);
  const toast = useToast();

  const onCopyContext = () => {
    const ctx = buildContext(role, phase);
    navigator.clipboard.writeText(ctx);
  };

  const onSend = async () => {
    if (!apiKey) return;
    setLoading(true);
    try {
      const ctx = buildContext(role, phase) + '\n\n' + prompt;
      const res = await callGemini(apiKey, ctx);
      setResp(res.text);
      if (res.usage) {
        setUsage((u) => ({
          prompt: u.prompt + (res.usage?.promptTokenCount || 0),
          cand: u.cand + (res.usage?.candidatesTokenCount || 0),
          total: u.total + (res.usage?.totalTokenCount || 0),
        }));
      }
    } catch (err) {
      if (err instanceof GeminiError) {
        if (err.status === 429) {
          const retry = err.retryAfterSeconds ? ` Try again in ~${err.retryAfterSeconds}s.` : '';
          toast.push('error', `Rate limited by Gemini (HTTP 429).${retry}`);
        } else if (err.status === 401 || err.status === 403) {
          toast.push('error', 'API key rejected (401/403). Check restrictions in Google AI Studio.');
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
      <div className="flex items-center justify-between">
        <div className="font-semibold">Gemini Chat</div>
        <div className="text-[10px] opacity-70">Model: {GEMINI_MODEL}</div>
      </div>
      <div className="text-xs opacity-80">Restrict this key to HTTP referrers in Google AI Studio.</div>
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
        <pre className="bg-black/40 border border-white/10 p-2 rounded overflow-x-auto text-xs max-h-40 whitespace-pre-wrap">
{resp}
        </pre>
      )}
      <div className="text-[10px] opacity-70">Tokens — prompt: {usage.prompt}, cand: {usage.cand}, total: {usage.total}</div>
    </div>
  );
}


