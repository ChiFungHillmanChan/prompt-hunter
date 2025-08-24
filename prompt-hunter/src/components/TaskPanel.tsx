import type { Phase } from '../types/content';
import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

export default function TaskPanel({ phase }: { phase: Phase }) {
  const { t } = useTranslation();
  const [showHint, setShowHint] = React.useState(false);
  const visiblePrompt = React.useMemo(() => phase.prompt, [phase.prompt]);
  
  // Show all hidden content as hints - this is intended behavior
  return (
    <div className="p-3 bg-white/5 border border-white/10 rounded text-sm space-y-2">
      <div className="font-semibold">{t('taskInstruction')}</div>
      <div className="whitespace-pre-wrap text-sm">{visiblePrompt}</div>
      {phase.bugged_code && (
        <pre className="bg-black/40 border border-white/10 p-2 rounded overflow-x-auto text-xs"><code>{phase.bugged_code}</code></pre>
      )}
      {phase.perfect_code && (
        <pre className="bg-black/40 border border-white/10 p-2 rounded overflow-x-auto text-xs"><code>{phase.perfect_code}</code></pre>
      )}
      {phase.lyric && <div className="text-xs opacity-80">{t('lyric')}: {phase.lyric}</div>}
      {phase.hidden_html && (
        <div className="text-xs opacity-80">
          <span>{t('hiddenHtml')}:</span>
          <div className="mt-1 p-2 bg-black/40 border border-white/10 rounded" dangerouslySetInnerHTML={{ __html: sanitize(phase.hidden_html) }} />
        </div>
      )}
      {phase.hidden_data && (
        <div className="text-xs opacity-80">
          <span>{t('hiddenData')}:</span>
          <div className="mt-1 p-2 bg-black/40 border border-white/10 rounded font-mono text-xs">{phase.hidden_data}</div>
        </div>
      )}
      {phase.hidden_js && (
        <div className="text-xs opacity-80">
          <span>{t('hiddenJs')}:</span>
          <div className="mt-1 p-2 bg-black/40 border border-white/10 rounded font-mono text-xs">{phase.hidden_js}</div>
        </div>
      )}
      {phase.hint && (
        <button className="text-xs underline" onClick={() => setShowHint((s) => !s)}>
          {showHint ? t('hideHint') : t('showHint')}
        </button>
      )}
      {showHint && phase.hint && <div className="text-xs opacity-80">{t('hint')}: {phase.hint}</div>}
    </div>
  );
}

function sanitize(html: string): string {
  // Very light sanitize: strip script tags
  return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
}



