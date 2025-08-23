import React from 'react';
import type { Phase } from '../types/content';
import { validateAnswer } from '../lib/validator';

type Props = {
  phase: Phase;
  onSuccess: () => void;
};

export default function AnswerPanel({ phase, onSuccess }: Props) {
  const [text, setText] = React.useState('');
  const [songTitle, setSongTitle] = React.useState('');
  const [songArtist, setSongArtist] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  const isBard = phase.task_type.toLowerCase().includes('song') || phase.validator?.type === 'song_guess';

  const onValidate = async () => {
    setLoading(true);
    try {
      const res = await validateAnswer(phase, text, { songTitle, songArtist });
      setMsg(res.message);
      if (res.ok) onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 bg-white/5 border border-white/10 rounded text-sm space-y-2">
      <div className="font-semibold">Your Answer</div>
      {isBard ? (
        <div className="grid grid-cols-1 gap-2">
          <input
            placeholder="Song Title"
            value={songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            className="px-2 py-2 bg-black/40 rounded border border-white/10"
          />
          <input
            placeholder="Artist"
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
          placeholder="Type your answer here"
        />
      )}
      <button
        onClick={onValidate}
        disabled={loading}
        className="px-3 py-2 rounded bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Validating…' : 'Validate'}
      </button>
      {msg && <div className="text-xs opacity-80">{msg}</div>}
    </div>
  );
}


