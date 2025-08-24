import React from 'react';
import type { Phase } from '../types/content';
import { validateAnswer } from '../lib/validator';
import { useTranslation } from '../hooks/useTranslation';

type Props = {
  phase: Phase;
  onScore: (score: number) => void;
};

export default function AnswerPanel({ phase, onScore }: Props) {
  const { t } = useTranslation();
  const [text, setText] = React.useState('');
  const [songTitle, setSongTitle] = React.useState('');
  const [songArtist, setSongArtist] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  const taskType = (phase.task_type || '').toLowerCase();
  const isBard = taskType.includes('song') || phase.validator?.type === 'song_guess';

  const onValidate = async () => {
    setLoading(true);
    try {
      const res = await validateAnswer(phase, text, { songTitle, songArtist });
      // Translate known error messages
      let displayMessage = res.message;
      if (res.message === 'API key required for validation') displayMessage = t('noApiKey');
      else if (res.message === 'Invalid API key format') displayMessage = t('invalidApiKey');
      else if (res.message === 'Validation failed') displayMessage = t('validationError');
      
      const score = typeof res.score === 'number' ? res.score : (res.ok ? 100 : 0);
      
      // Handle score 0 case with special message
      if (score === 0) {
        displayMessage = t('attackFailed');
      }
      
      setMsg(displayMessage);
      // Always call onScore to return the score (number or 0)
      onScore(score);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 bg-white/5 border border-white/10 rounded text-sm space-y-2">
      <div className="font-semibold">{t('yourAnswer')}</div>
      {isBard ? (
        <div className="grid grid-cols-1 gap-2">
          <input
            placeholder={t('songTitle')}
            value={songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            className="px-2 py-2 bg-black/40 rounded border border-white/10"
          />
          <input
            placeholder={t('artist')}
            value={songArtist}
            onChange={(e) => setSongArtist(e.target.value)}
            className="px-2 py-2 bg-black/40 rounded border border-white/10"
          />
        </div>
      ) : (
        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full px-2 py-2 bg-black/40 rounded border border-white/10"
          placeholder={t('typeAnswer')}
        />
      )}
      <button
        onClick={onValidate}
        disabled={loading}
        className="px-3 py-2 rounded bg-blue-600 disabled:opacity-50"
      >
        {loading ? t('validating') : t('validate')}
      </button>
      {msg && <div className="text-xs opacity-80">{msg}</div>}
    </div>
  );
}


