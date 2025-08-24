import type { Phase } from '../types/content';
import React from 'react';

export default function TaskPanel({ phase }: { phase: Phase }) {
  const [showHint, setShowHint] = React.useState(false);
  const visiblePrompt = React.useMemo(() => extractUserGoal(phase.prompt), [phase.prompt]);
  return (
    <div className="p-3 bg-white/5 border border-white/10 rounded text-sm space-y-2">
      <div className="font-semibold">Task — Read, fix, then submit your answer below.</div>
      <div className="whitespace-pre-wrap text-sm">{visiblePrompt}</div>
      {phase.bugged_code && (
        <pre className="bg-black/40 border border-white/10 p-2 rounded overflow-x-auto text-xs"><code>{phase.bugged_code}</code></pre>
      )}
      {phase.perfect_code && (
        <pre className="bg-black/40 border border-white/10 p-2 rounded overflow-x-auto text-xs"><code>{phase.perfect_code}</code></pre>
      )}
      {phase.lyric && <div className="text-xs opacity-80">Lyric: {phase.lyric}</div>}
      {phase.hidden_html && (
        <div className="text-xs opacity-80">
          <span>Hidden HTML:</span>
          <div className="mt-1 p-2 bg-black/40 border border-white/10 rounded" dangerouslySetInnerHTML={{ __html: sanitize(phase.hidden_html) }} />
        </div>
      )}
      {phase.hint && (
        <button className="text-xs underline" onClick={() => setShowHint((s) => !s)}>
          {showHint ? 'Hide hint' : 'Show hint'}
        </button>
      )}
      {showHint && phase.hint && <div className="text-xs opacity-80">Hint: {phase.hint}</div>}
    </div>
  );
}

function sanitize(html: string): string {
  // Very light sanitize: strip script tags
  return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
}

function extractUserGoal(prompt: string): string {
  if (!prompt) return '';
  const lines = prompt.split(/\r?\n/);
  const startIdx = lines.findIndex((l) => /^\s*your goal\s*:/i.test(l));
  if (startIdx === -1) return prompt; // fallback to full prompt if no section marker
  const collected: string[] = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*(constraints|format)\s*:/i.test(line)) break;
    collected.push(line);
  }
  const text = collected.join('\n').trim();
  return text || prompt;
}


