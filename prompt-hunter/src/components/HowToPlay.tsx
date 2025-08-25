import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

type HowToPlayProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function HowToPlay({ isOpen, onClose }: HowToPlayProps) {
  const { t } = useTranslation();

  // Handle escape key to close modal
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl p-6 max-w-2xl w-full border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-slate-700/50 hover:bg-slate-600/70 rounded-full text-slate-300 hover:text-white transition-all duration-200 backdrop-blur-sm border border-white/10 hover:border-white/20 z-10"
          aria-label="Close how to play"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m18 6-12 12" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">{t('howToPlayTitle')}</h2>
          <div className="w-16 h-1 bg-purple-500 mx-auto rounded-full"></div>
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {/* Step 1 */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-2">{t('howToPlayStep1Title')}</h3>
            <p className="text-slate-300 text-sm leading-relaxed">{t('howToPlayStep1Desc')}</p>
            <div className="mt-3 text-xs text-blue-400">
              💡 <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline transition-colors"
                  >
                    {t('getApiKey')}
                  </a>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-2">{t('howToPlayStep2Title')}</h3>
            <p className="text-slate-300 text-sm leading-relaxed">{t('howToPlayStep2Desc')}</p>
            <div className="mt-3 flex gap-2">
              <img src="/sprites/hacker.svg" className="w-8 h-8 rounded border border-white/20" style={{ imageRendering: 'pixelated' }} />
              <img src="/sprites/bard.svg" className="w-8 h-8 rounded border border-white/20" style={{ imageRendering: 'pixelated' }} />
              <img src="/sprites/necromancer.svg" className="w-8 h-8 rounded border border-white/20" style={{ imageRendering: 'pixelated' }} />
              <img src="/sprites/alchemist.svg" className="w-8 h-8 rounded border border-white/20" style={{ imageRendering: 'pixelated' }} />
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-2">{t('howToPlayStep3Title')}</h3>
            <p className="text-slate-300 text-sm leading-relaxed">{t('howToPlayStep3Desc')}</p>
            <div className="mt-3 text-xs text-green-400">
              🤖 {t('aiAssistant')} - {t('askForHelp')}
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-2">{t('howToPlayStep4Title')}</h3>
            <p className="text-slate-300 text-sm leading-relaxed">{t('howToPlayStep4Desc')}</p>
            <div className="mt-3 text-xs text-yellow-400">
              ⚠️ {t('attackFailed')}
            </div>
          </div>

          {/* Step 5 */}
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-500/30">
            <h3 className="text-lg font-semibold text-white mb-2">{t('howToPlayStep5Title')}</h3>
            <p className="text-slate-300 text-sm leading-relaxed">{t('howToPlayStep5Desc')}</p>
            <div className="mt-3 text-xs text-purple-400">
              🏆 {t('masteredAll')}
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}