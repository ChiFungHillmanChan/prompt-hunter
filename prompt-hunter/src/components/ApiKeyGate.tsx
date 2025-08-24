import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

export default function ApiKeyGate({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [hasKey, setHasKey] = React.useState<boolean>(() => !!sessionStorage.getItem('gemini_api_key'));
  const [keyValue, setKeyValue] = React.useState('');

  React.useEffect(() => {
    const checkKey = () => {
      setHasKey(!!sessionStorage.getItem('gemini_api_key'));
    };

    window.addEventListener('storage', checkKey);
    const interval = setInterval(checkKey, 1000); // Check every second

    return () => {
      window.removeEventListener('storage', checkKey);
      clearInterval(interval);
    };
  }, []);

  if (hasKey) return <>{children}</>;

  const onSave = () => {
    const v = keyValue.trim();
    if (!v) return;
    sessionStorage.setItem('gemini_api_key', v);
    setHasKey(true);
  };

  return (
    <div className="min-h-screen grid place-items-center p-4 text-slate-100">
      <div className="w-full max-w-sm p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
        <h1 className="text-lg font-bold">{t('enterApiKey')}</h1>
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
        <button onClick={onSave} className="w-full px-3 py-2 rounded bg-purple-600">{t('continue')}</button>
      </div>
    </div>
  );
}


