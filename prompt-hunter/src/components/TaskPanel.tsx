import type { Phase } from '../types/content';
import React from 'react';

export default function TaskPanel({ phase }: { phase: Phase }) {
  const [showHint, setShowHint] = React.useState(false);
  return (
    <div className="p-3 bg-white/5 border border-white/10 rounded text-sm space-y-2">
      <div className="font-semibold">Task</div>
      <div className="whitespace-pre-wrap text-sm">{phase.prompt}</div>
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


