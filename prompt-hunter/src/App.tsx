import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useContent } from './store/content';
import { useSettings } from './store/settings';
import { ROUTES } from './lib/routes';
import { ToastProvider } from './components/Toast';
import ApiKeyGate from './components/ApiKeyGate';
import SettingsMenu from './pages/SettingsMenu';
import PlayPage from './pages/PlayPage';
import PackViewer from './pages/PackViewer';

export default function App() {
  const { loadDefault, loadLanguage, loading, error, pack } = useContent();
  const language = useSettings((s) => s.language);
  
  useEffect(() => {
    // Load content based on current language setting
    if (language === 'en') {
      loadDefault();
    } else {
      loadLanguage(language);
    }
  }, [loadDefault, loadLanguage, language]);

  // Show loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <p className="text-slate-400 text-lg">Loading content...</p>
        </div>
      </div>
    );
  }

  // Show error screen
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-red-400 text-xl mb-2">Failed to Load Content</h1>
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Don't render until content is loaded
  if (!pack) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-6xl mb-4">⏳</div>
          <p className="text-slate-400 text-lg">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <ApiKeyGate>
        <BrowserRouter>
          <Routes>
            <Route path={ROUTES.ROOT} element={<SettingsMenu />} />
            <Route path={ROUTES.PLAY()} element={<PlayPage />} />
            <Route path={ROUTES.PACK} element={<PackViewer />} />
            <Route path="*" element={<Navigate to={ROUTES.ROOT} replace />} />
          </Routes>
        </BrowserRouter>
      </ApiKeyGate>
    </ToastProvider>
  );
}
