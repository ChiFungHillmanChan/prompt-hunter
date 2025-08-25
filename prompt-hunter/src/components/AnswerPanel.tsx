import React from 'react';
import type { Phase } from '../types/content';
import { validateAnswer } from '../lib/validator';
import { useTranslation } from '../hooks/useTranslation';

type Props = {
  phase: Phase;
  onScore: (score: number, validationResult?: any) => void;
  roleId?: string;
  onRequestNewSentence?: () => void;
};

export default function AnswerPanel({ phase, onScore, roleId, onRequestNewSentence }: Props) {
  const { t } = useTranslation();
  const [text, setText] = React.useState('');
  const [songTitle, setSongTitle] = React.useState('');
  const [songArtist, setSongArtist] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [targetSentence, setTargetSentence] = React.useState<string | null>(null);
  const [validationResult, setValidationResult] = React.useState<any>(null);

  const taskType = (phase.task_type || '').toLowerCase();
  const isBard = taskType.includes('song') || phase.validator?.type === 'song_guess';
  const isHealer = roleId === 'healer';

  // Auto-get first sentence for healer
  React.useEffect(() => {
    if (isHealer && !targetSentence) {
      // Trigger validation to get the first sentence
      const getFirstSentence = async () => {
        try {
          const res = await validateAnswer(phase, '', { songTitle, songArtist });
          if ((res as any).target_sentence) {
            setTargetSentence((res as any).target_sentence);
            setValidationResult(res);
          }
        } catch (error) {
          console.error('Failed to get first sentence:', error);
        }
      };
      getFirstSentence();
    }
  }, [isHealer, phase, targetSentence, songTitle, songArtist]);

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
      
      // For Healer with perfect score, show next sentence message
      if (roleId === 'healer' && score >= 100) {
        const remaining = (res as any).sentences_remaining;
        if (remaining > 0) {
          displayMessage = `Perfect! Moving to next sentence... (${remaining} remaining)`;
        } else {
          displayMessage = 'Perfect! No more sentences available. Request new ones to continue.';
        }
      }
      
      setMsg(displayMessage);
      setValidationResult(res);
      
      // For Healer, capture the target sentence
      if (roleId === 'healer' && (res as any).target_sentence) {
        setTargetSentence((res as any).target_sentence);
      }
      
      // For Healer with perfect score, automatically get the next sentence
      if (roleId === 'healer' && score >= 100) {
        // Clear the current text and get the next sentence
        setText('');
        // Get the next sentence directly
        setTimeout(async () => {
          try {
            const { getNextHealerSentence } = await import('../lib/validator');
            const nextSentenceData = getNextHealerSentence(phase);
            if (nextSentenceData?.target_sentence) {
              setTargetSentence(nextSentenceData.target_sentence);
              setValidationResult({
                ...res,
                target_sentence: nextSentenceData.target_sentence,
                sentences_remaining: nextSentenceData.sentences_remaining
              });
            }
          } catch (error) {
            console.error('Failed to get next sentence:', error);
          }
        }, 500); // Small delay to show the success message first
      }
      
      // Always call onScore to return the score (number or 0)
      onScore(score, res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 bg-white/5 border border-white/10 rounded text-sm space-y-2">
      <div className="font-semibold">{isHealer ? 'Copy This Sentence Exactly:' : t('yourAnswer')}</div>
      {isHealer && targetSentence && (
        <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
          <div className="text-green-300 font-mono text-base">
            "{targetSentence}"
          </div>
          <div className="text-green-400 text-xs mt-1">
            {validationResult?.sentences_remaining !== undefined && validationResult.sentences_remaining > 0 
              ? `${validationResult.sentences_remaining} sentences remaining`
              : 'AI-generated sentence'
            }
            {validationResult?.isUsingPremade !== undefined && (
              <span className="ml-2 text-blue-400">
                ({validationResult.isUsingPremade ? 'Premade' : 'AI Generated'})
              </span>
            )}
          </div>
        </div>
      )}
      {isHealer && !targetSentence && (
        <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <div className="text-blue-300">
            {validationResult?.sentences_remaining === 0 
              ? 'No more sentences available. Click "Get New Sentence" to generate new ones with AI (-3 HP).'
              : 'Click "Get Sentence" to receive a sentence to copy. Copy it exactly to heal and damage the monster!'
            }
          </div>
        </div>
      )}
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
      ) : isHealer ? (
        <div className="space-y-2">
          <textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-2 py-2 bg-black/40 rounded border border-white/10"
            placeholder="Type the sentence exactly as shown above..."
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                // Trigger getting a new sentence - this should penalize the player
                if (onRequestNewSentence) {
                  onRequestNewSentence();
                }
                setTargetSentence(null); // Clear current sentence to trigger new generation
                setValidationResult(null); // Clear validation result
                setText(''); // Clear the input text
              }}
              disabled={loading}
              className="px-3 py-2 rounded bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-sm"
            >
              {loading ? 'Getting...' : 
                validationResult?.sentences_remaining === 0 
                  ? 'Generate AI Sentences (-3 HP)' 
                  : 'Get New Sentence (-3 HP)'
              }
            </button>
            <button
              onClick={onValidate}
              disabled={loading || !targetSentence}
              className="px-3 py-2 rounded bg-green-600 hover:bg-green-700 disabled:opacity-50 text-sm"
            >
              {loading ? 'Checking...' : 'Submit Copy'}
            </button>
          </div>
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
      {!isHealer && (
        <button
          onClick={onValidate}
          disabled={loading}
          className="px-3 py-2 rounded bg-blue-600 disabled:opacity-50"
        >
          {loading ? t('validating') : t('validate')}
        </button>
      )}
      {msg && <div className="text-xs opacity-80">{msg}</div>}
    </div>
  );
}


