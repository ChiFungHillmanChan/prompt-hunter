import type { Phase } from '../types/content';
import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useToast } from './Toast';

export default function TaskPanel({ phase, roleId }: { phase: Phase; roleId: string }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [showHint, setShowHint] = React.useState(false);
  const visiblePrompt = React.useMemo(() => phase?.prompt || phase?.bait_question || '', [phase?.prompt, phase?.bait_question]);
  const canCopyCode = roleId === 'engineer' || roleId === 'alchemist';
  const onCopy = async (text: string) => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {}
    if (!ok) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ok = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {}
    }
    if (ok) toast.push('success', t('copied')); else toast.push('error', 'Copy failed');
  };
  
  // Show all hidden content as hints - this is intended behavior
  return (
    <div className="p-3 bg-white/5 border border-white/10 rounded text-sm space-y-2">
      <div className="font-semibold">{t('taskInstruction')}</div>
      <div className="whitespace-pre-wrap text-sm">{visiblePrompt}</div>
      {phase?.bugged_code && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs opacity-80">Bugged Code</div>
            {canCopyCode && (
              <button
                className="px-2 py-1 text-[10px] bg-slate-700 rounded border border-white/10"
                onClick={() => onCopy(phase?.bugged_code || '')}
                aria-label={t('copyBuggedCode')}
                title={t('copyBuggedCode')}
              >📋</button>
            )}
          </div>
          <pre className="bg-black/40 border border-white/10 p-2 rounded overflow-x-auto text-xs"><code>{phase?.bugged_code}</code></pre>
        </div>
      )}
      {phase?.perfect_code && (
        <div>
          <div className="flex items-center justify-between mb-1 mt-2">
            <div className="text-xs opacity-80">Perfect Code</div>
            {canCopyCode && (
              <button
                className="px-2 py-1 text-[10px] bg-slate-700 rounded border border-white/10"
                onClick={() => onCopy(phase?.perfect_code || '')}
                aria-label={t('copyPerfectCode')}
                title={t('copyPerfectCode')}
              >📋</button>
            )}
          </div>
          <pre className="bg-black/40 border border-white/10 p-2 rounded overflow-x-auto text-xs"><code>{phase?.perfect_code}</code></pre>
        </div>
      )}
      {phase?.lyric && <div className="text-xs opacity-80">{t('lyric')}: {phase?.lyric}</div>}
      {phase?.hidden_html && (
        <div className="text-xs opacity-80">
          <span>{t('hiddenHtml')}:</span>
          <div className="mt-1 p-2 bg-black/40 border border-white/10 rounded" dangerouslySetInnerHTML={{ __html: sanitize(phase?.hidden_html || '') }} />
        </div>
      )}
      {phase?.hidden_data && (
        <div className="text-xs opacity-80">
          <span>{t('hiddenData')}:</span>
          <div className="mt-1 p-2 bg-black/40 border border-white/10 rounded font-mono text-xs">{phase?.hidden_data}</div>
        </div>
      )}
      {phase?.hidden_js && (
        <div className="text-xs opacity-80">
          <span>{t('hiddenJs')}:</span>
          <div className="mt-1 p-2 bg-black/40 border border-white/10 rounded font-mono text-xs">{phase?.hidden_js}</div>
        </div>
      )}
      {phase?.hint && (
        <button className="text-xs underline" onClick={() => setShowHint((s) => !s)}>
          {showHint ? t('hideHint') : t('showHint')}
        </button>
      )}
      {showHint && phase?.hint && <div className="text-xs opacity-80">{t('hint')}: {phase?.hint}</div>}
    </div>
  );
}

function sanitize(html: string): string {
  // Very light sanitize: strip script tags
  return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
}



