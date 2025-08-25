import React from 'react';
import { callGemini, GeminiError } from '../lib/gemini';
import { buildContext } from '../lib/contextBuilder';
import type { Phase, Role } from '../types/content';
import { useToast } from './Toast';
import { useTranslation } from '../hooks/useTranslation';

type Props = {
  role: Role;
  phase: Phase;
  onDetectiveDamage?: () => void;
};

type ChatMessage = {
  type: 'user' | 'ai';
  message: string;
  timestamp: number;
};

export default function ChatPanel({ role, phase, onDetectiveDamage }: Props) {
  const { t, language } = useTranslation();
  const [apiKey] = React.useState<string>(() => sessionStorage.getItem('gemini_api_key') || '');
  const [prompt, setPrompt] = React.useState('');
  const [resp, setResp] = React.useState('');
  // removed usage tracking UI
  const [loading, setLoading] = React.useState(false);
  const toast = useToast();
  
  // Chat history for Detective mode
  const [chatHistory, setChatHistory] = React.useState<ChatMessage[]>(() => {
    if (role.id === 'detective') {
      try {
        const saved = localStorage.getItem(`ph-detective-chat-${role.id}`);
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  // Function to clear chat history (for Detective restarts)
  const clearChatHistory = () => {
    setChatHistory([]);
    try {
      localStorage.removeItem(`ph-detective-chat-${role.id}`);
    } catch {
      // Failed to clear chat history
    }
  };

  const onCopyContext = () => {
    const ctx = buildContext(role, phase, language);
    navigator.clipboard.writeText(ctx);
  };

  const onSend = async () => {
    if (role.id === 'mysterious') {
      setResp('????????????????????');
      return;
    }
    if (!apiKey || loading || !prompt.trim()) return;
    setLoading(true);
    
    // Add user message to chat history for Detective
    if (role.id === 'detective') {
      const userMessage: ChatMessage = {
        type: 'user',
        message: prompt.trim(),
        timestamp: Date.now()
      };
      setChatHistory(prev => [...prev, userMessage]);
    }
    
    try {
      let ctx = buildContext(role, phase, language) + '\n\n=== IMPORTANT: USER\'S ACTUAL QUESTION (analyze this specific code/question, ignore phase context if it doesn\'t match) ===\n' + prompt + '\n=== END USER QUESTION ===';
      
      // Special handling for detective character
      if (role.id === 'detective') {
        const responses = language === 'zh-hk' ? '"係" / "唔係" / "無關"' : '"Yes" / "No" / "Not related"';
        ctx += `\n\n=== DETECTIVE RESTRICTION ===\nYou MUST respond ONLY with: ${responses}

IMPORTANT RULES:
- Only answer "Yes" if the question is clearly TRUE about the story context provided above
- Answer "No" if the question is clearly FALSE about the story context
- Answer "Not related" if:
  * The question is gibberish, random text, or meaningless (like single characters: "?", "a", "1", etc.)
  * The question is about something completely unrelated to the story
  * The question cannot be understood or parsed
  * The question is not a proper yes/no question about the story
  * The question is just punctuation marks or symbols
  * The question is incomplete or doesn't make sense

STRICT EXAMPLES of "Not related":
- Single characters: "?", "a", "x", "1", "!", etc.
- Random text: "asdf", "test", "hello", "real"  
- Punctuation only: "???", "!!!", "..."
- Incomplete sentences that don't ask about the story
- Any input that is not a clear question about the detective story context

BE VERY STRICT: If the input doesn't clearly ask about something specific in the detective story, respond with "Not related".`;
      }
      
      const res = await callGemini(apiKey, ctx);
      let text = (res.text || '').trim();
      
      // Detective mode: force only Yes/No/Not related responses
      if (role.id === 'detective') {
        const normalized = text.toLowerCase().replace(/[.,!?]/g, '').trim();
        
        // More strict parsing - look for exact matches first
        if (normalized === 'yes' || normalized === '係' || normalized === '是') {
          text = language === 'zh-hk' ? '係' : 'Yes';
        } else if (normalized === 'no' || normalized === '唔係' || normalized === '不是' || 
                   normalized === '唔是' || normalized === '否') {
          text = language === 'zh-hk' ? '唔係' : 'No';
          // Damage player for "No" response
          if (onDetectiveDamage) {
            setTimeout(() => onDetectiveDamage(), 500);
          }
        } else if (normalized === 'not related' || normalized === 'unrelated' || 
                   normalized === '無關' || normalized === '无关' || normalized === '冇關') {
          text = language === 'zh-hk' ? '無關' : 'Not related';
          // Damage player for "Not related" response
          if (onDetectiveDamage) {
            setTimeout(() => onDetectiveDamage(), 500);
          }
        } else if (normalized.includes('yes') || normalized.includes('係') || normalized.includes('是')) {
          // Fallback: contains yes
          text = language === 'zh-hk' ? '係' : 'Yes';
        } else if (normalized.includes('no') || normalized.includes('唔係') || normalized.includes('不是') || 
                   normalized.includes('唔是') || normalized.includes('否')) {
          // Fallback: contains no
          text = language === 'zh-hk' ? '唔係' : 'No';
          if (onDetectiveDamage) {
            setTimeout(() => onDetectiveDamage(), 500);
          }
        } else {
          // Default to "Not related" if AI doesn't follow format or response is unclear
          text = language === 'zh-hk' ? '無關' : 'Not related';
          if (onDetectiveDamage) {
            setTimeout(() => onDetectiveDamage(), 500);
          }
        }
      } else {
        // Existing logic for other characters
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
      }
      
      setResp(text);
      
      // Add AI response to chat history for Detective and save to localStorage
      if (role.id === 'detective') {
        const aiMessage: ChatMessage = {
          type: 'ai',
          message: text,
          timestamp: Date.now()
        };
        setChatHistory(prev => {
          const newHistory = [...prev, aiMessage];
          try {
            localStorage.setItem(`ph-detective-chat-${role.id}`, JSON.stringify(newHistory));
          } catch {
            // Failed to save chat history
          }
          return newHistory;
        });
        setPrompt(''); // Clear prompt for Detective after sending
      }
      
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

  // Handle healer role - show only assistant message, no input/chat
  if (role.id === 'healer') {
    return (
      <div className="p-3 bg-white/5 border border-white/10 rounded text-sm space-y-2">
        <div className="font-semibold">{t('geminiChat')}</div>
        
        {/* Show initial assistant message */}
        {phase.assistant && (
          <div className="bg-blue-500/20 border border-blue-500/30 p-2 rounded text-xs">
            <div className="text-white">{phase.assistant}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-3 bg-white/5 border border-white/10 rounded text-sm space-y-2">
      <div className="font-semibold">{t('geminiChat')}</div>
      
      {/* Detective mode indicator */}
      {role.id === 'detective' && (
        <div className="bg-yellow-500/20 border border-yellow-500/30 p-2 rounded text-xs">
          <div className="text-yellow-300 font-semibold mb-1">{t('detectiveMode')}</div>
          <div className="text-yellow-100">{t('detectiveModeDesc')}</div>
        </div>
      )}
      
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
        {role.id === 'detective' && chatHistory.length > 0 && (
          <button className="px-2 py-1 text-xs bg-red-600 rounded" onClick={clearChatHistory}>Clear History</button>
        )}
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
      
      {/* Detective Chat History */}
      {role.id === 'detective' && chatHistory.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="text-xs font-semibold text-slate-300 mb-2">{t('questionHistory')}</div>
          <div className="space-y-2 max-h-60 overflow-y-auto bg-black/20 rounded p-2">
            {chatHistory.map((msg, index) => (
              <div key={index} className={`text-xs p-2 rounded ${
                msg.type === 'user' 
                  ? 'bg-slate-700/50 border border-slate-600/30' 
                  : 'bg-blue-500/20 border border-blue-500/30'
              }`}>
                <div className={`font-semibold mb-1 ${
                  msg.type === 'user' ? 'text-slate-300' : 'text-blue-300'
                }`}>
                  {msg.type === 'user' ? t('userQuestion') : t('aiAnswer')}
                </div>
                <div className="text-white">{msg.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


