import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../store/auth';
import { firebaseEnabled } from '../lib/firebase';

export default function ApiKeyGate({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);
  const signIn = useAuth((s) => s.signIn);

  const [hasKey, setHasKey] = React.useState<boolean>(() => !!sessionStorage.getItem('gemini_api_key'));
  const [showKeyInput, setShowKeyInput] = React.useState(false);
  const [keyValue, setKeyValue] = React.useState('');
  const [signingIn, setSigningIn] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const checkKey = () => setHasKey(!!sessionStorage.getItem('gemini_api_key'));
    window.addEventListener('storage', checkKey);
    const interval = setInterval(checkKey, 1000);
    return () => {
      window.removeEventListener('storage', checkKey);
      clearInterval(interval);
    };
  }, []);

  // Access granted if signed in (shared key) OR a personal key is stored.
  if (user || hasKey) return <>{children}</>;

  // Wait for Firebase to report initial auth state to avoid flashing the gate.
  if (firebaseEnabled && !ready) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin text-5xl">⏳</div>
      </div>
    );
  }

  const onSaveKey = () => {
    const v = keyValue.trim();
    if (!v) return;
    sessionStorage.setItem('gemini_api_key', v);
    setHasKey(true);
  };

  const onSignIn = async () => {
    setError('');
    setSigningIn(true);
    try {
      await signIn();
    } catch {
      setError(t('signInFailed'));
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-4 text-slate-100">
      <div className="w-full max-w-sm p-5 rounded-xl bg-white/5 border border-white/10 space-y-4">
        <div className="text-center">
          <h1 className="text-xl font-bold">{t('appTitle')}</h1>
          <p className="text-xs opacity-80 mt-1">{t('chooseHowToPlay')}</p>
        </div>

        {firebaseEnabled && (
          <>
            <div className="space-y-2">
              <button
                onClick={onSignIn}
                disabled={signingIn}
                className="w-full px-3 py-2.5 rounded-lg bg-white text-slate-800 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
                  <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
                </svg>
                {signingIn ? t('signingIn') : t('signInWithGoogle')}
              </button>
              <p className="text-[11px] opacity-70 text-center">{t('sharedKeyDesc')}</p>
            </div>

            <div className="flex items-center gap-2 text-[11px] opacity-60">
              <span className="flex-1 h-px bg-white/15" />
              {t('or')}
              <span className="flex-1 h-px bg-white/15" />
            </div>
          </>
        )}

        {!showKeyInput ? (
          <button
            onClick={() => setShowKeyInput(true)}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-sm hover:bg-white/10 transition-colors"
          >
            {t('useOwnKey')}
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs opacity-80">{t('apiKeyRequired')}</p>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 underline text-xs"
            >{t('getApiKey')}</a>
            <p className="text-yellow-400 text-xs">{t('vpnWarning')}</p>
            <input
              type="password"
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              placeholder={t('pasteApiKey2')}
              className="w-full px-2 py-2 bg-black/40 rounded border border-white/10"
            />
            <button onClick={onSaveKey} className="w-full px-3 py-2 rounded bg-purple-600">{t('continue')}</button>
          </div>
        )}

        {error && <p className="text-red-400 text-xs text-center">{error}</p>}
      </div>
    </div>
  );
}
