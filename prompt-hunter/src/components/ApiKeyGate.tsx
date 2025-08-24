import React from 'react';

export default function ApiKeyGate({ children }: { children: React.ReactNode }) {
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
        <h1 className="text-lg font-bold">Enter Gemini API Key</h1>
        <p className="text-xs opacity-80">This is required once per session. Restrict the key to HTTP referrers in Google AI Studio for safer frontend use.</p>
        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noreferrer"
          className="text-blue-400 underline text-xs"
        >Get a Gemini API Key</a>
        <input
          type="password"
          value={keyValue}
          onChange={(e) => setKeyValue(e.target.value)}
          placeholder="Paste your API key"
          className="w-full px-2 py-2 bg-black/40 rounded border border-white/10"
        />
        <button onClick={onSave} className="w-full px-3 py-2 rounded bg-purple-600">Continue</button>
      </div>
    </div>
  );
}


