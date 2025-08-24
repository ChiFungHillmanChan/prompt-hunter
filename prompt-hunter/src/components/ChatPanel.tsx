import React from 'react';
import { callGemini, GeminiError } from '../lib/gemini';
import { buildContext } from '../lib/contextBuilder';
import type { Phase, Role } from '../types/content';
import { useToast } from './Toast';
import { useTranslation } from '../hooks/useTranslation';

type Props = {
  role: Role;
  phase: Phase;
};

export default function ChatPanel({ role, phase }: Props) {
  const { t, language } = useTranslation();
  const [apiKey] = React.useState<string>(() => sessionStorage.getItem('gemini_api_key') || '');
  const [prompt, setPrompt] = React.useState('');
  const [resp, setResp] = React.useState('');
  // removed usage tracking UI
  const [loading, setLoading] = React.useState(false);
  const toast = useToast();

  const onCopyContext = () => {
    const ctx = buildContext(role, phase, language);
    navigator.clipboard.writeText(ctx);
  };

  const onSend = async () => {
    if (role.id === 'mysterious') {
      setResp('????????????????????');
      return;
    }
    if (!apiKey || loading) return;
    setLoading(true);
    try {
      const ctx = buildContext(role, phase, language) + '\n\n=== IMPORTANT: USER\'S ACTUAL QUESTION (analyze this specific code/question, ignore phase context if it doesn\'t match) ===\n' + prompt + '\n=== END USER QUESTION ===';
      const res = await callGemini(apiKey, ctx);
      // Mask responses for Mysterious
      // Sanitize model response to avoid code blocks or direct solutions
      let text = (res.text || '').trim();
      // Remove fenced code blocks
      text = text.replace(/```[\s\S]*?```/g, '[redacted code]');
      // Basic guard: if it looks like actual code implementation (not just mentions), replace them
      // Look for patterns that indicate actual code rather than explanations
      if (/(\bfunction\s+\w+\s*\(|\w+\s*=\s*\(|\w+\s*=\s*function|\w+\s*=\s*\w+\s*=>)/gi.test(text) || 
          text.includes('```') || 
          /^\s*(function|const|let|var|class)\s+\w+/m.test(text)) {
        text = 'I can\'t provide direct code. Here\'s a hint: ' + text.replace(/\n+/g, ' ').slice(0, 280);
      }
      // Limit response length for hints - keep it short and focused
      if (text.length > 200) {
        // Split by sentences and take first 1-2 sentences
        const sentences = text.split(/[.!?]+/).filter(s => s.trim());
        if (sentences.length > 1) {
          text = sentences.slice(0, 2).join('. ') + '.';
        } else {
          text = text.slice(0, 200) + '...';
        }
      }
      setResp(text);
      // usage tracking removed from UI
    } catch (err) {
      if (err instanceof GeminiError) {
        if (err.status === 429) {
          const errorData = err.raw as Record<string, unknown>;
          const isQuotaExhausted = (errorData?.error as Record<string, unknown>)?.message?.toString().includes('Quota exceeded');
          const isRateLimit = (errorData?.error as Record<string, unknown>)?.message?.toString().includes('rate limit') || 
                             ((errorData?.error as Record<string, unknown>)?.details as Array<Record<string, unknown>>)?.some((d) => d.reason === 'RATE_LIMIT_EXCEEDED');
          
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


  // Handle mysterious role - show the assistant message from the phase with ???
  if (role.id === 'mysterious') {
    return (
      <div className="p-3 bg-white/5 border border-white/10 rounded text-sm space-y-2">
        <div className="font-semibold">{t('geminiChat')}</div>
        
        <div className="bg-purple-500/20 border border-purple-500/30 p-2 rounded text-xs">
          <div className="text-purple-300 font-semibold mb-1">Assistant:</div>
          <div className="text-white">????????????????????</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 bg-white/5 border border-white/10 rounded text-sm space-y-2">
      <div className="font-semibold">{t('geminiChat')}</div>
      
      {/* Show initial assistant message */}
      {phase.assistant && (
        <div className="bg-blue-500/20 border border-blue-500/30 p-2 rounded text-xs">
          <div className="text-blue-300 font-semibold mb-1">Assistant:</div>
          <div className="text-white">{phase.assistant}</div>
        </div>
      )}
      
      {/* API key managed by gate; no input here */}
      <div className="flex gap-2">
        <button className="px-2 py-1 text-xs bg-slate-700 rounded" onClick={onCopyContext}>{t('copyContext')}</button>
        <a
          className="px-2 py-1 text-xs bg-slate-700 rounded"
          href="https://aistudio.google.com/prompts/new_chat"
          target="_blank" rel="noreferrer"
        >{t('openGemini')}</a>
      </div>
      <textarea
        rows={3}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full px-2 py-2 bg-black/40 rounded border border-white/10"
        placeholder={t('askForHelp')}
      />
      <button onClick={onSend} disabled={loading || !apiKey} className="px-3 py-2 rounded bg-purple-600 disabled:opacity-50">
        {loading ? t('sending') : t('send')}
      </button>
      {resp && (
        <pre className="bg-black/40 border border-white/10 p-2 rounded overflow-x-auto text-xs max-h-40 whitespace-pre-wrap">{resp}</pre>
      )}
    </div>
  );
}


