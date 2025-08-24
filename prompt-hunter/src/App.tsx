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
  const { loadDefault, loadLanguage } = useContent();
  const language = useSettings((s) => s.language);
  
  useEffect(() => {
    // Load content based on current language setting
    if (language === 'en') {
      loadDefault();
    } else {
      loadLanguage(language);
    }
  }, [loadDefault, loadLanguage, language]);
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
