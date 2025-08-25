import { useContent } from '../store/content';
import { useProgress } from '../store/progress';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../lib/routes';
import { useTranslation } from '../hooks/useTranslation';
import { translations } from '../lib/translations';
import { getCharacterStats } from '../lib/characterStats';
import { useSettings } from '../store/settings';
import React from 'react';



function getGameTypes(id: string): string[] {
  if (id.toLowerCase().includes('bard')) {
    return ['typeCreativeTasks', 'typeCombatChallenge'];
  }
  if (id.toLowerCase().includes('necro')) {
    return ['typeLogicPuzzles', 'typeOptimizePerformance', 'typeCombatChallenge'];
  }
  if (id.toLowerCase().includes('alch')) {
    return ['typeSecurityChallenges', 'typeCombatChallenge'];
  }
  if (id.toLowerCase().includes('hack')) {
    return ['typeSecurityChallenges', 'typeDebugCode', 'typeCombatChallenge'];
  }
  if (id.toLowerCase().includes('detective')) {
    return ['typeLogicPuzzles', 'typeCombatChallenge'];
  }
  if (id.toLowerCase().includes('myst')) {
    return ['typeCreativeTasks'];
  }
  // Default fallback (Engineer or others)
  return ['typeDebugCode', 'typeCombatChallenge'];
}

function pickSprite(id: string): string {
  if (id.toLowerCase().includes('bard')) return '/sprites/bard.svg';
  if (id.toLowerCase().includes('necro')) return '/sprites/necromancer.svg';
  if (id.toLowerCase().includes('alch')) return '/sprites/alchemist.svg';
  if (id.toLowerCase().includes('hack')) return '/sprites/hacker.svg';
  if (id.toLowerCase().includes('detective')) return '/sprites/detective.svg';
  if (id.toLowerCase().includes('myst')) return '/sprites/mysterious.svg';
  return '/sprites/engineer.svg';
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty.toLowerCase()) {
    case 'easy': return 'text-green-400 bg-green-500/20 border-green-500/30';
    case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    case 'hard': return 'text-red-400 bg-red-500/20 border-red-500/30';
    default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
  }
}

export default function PackViewer() {
  const { pack } = useContent();
  const { completedRoles } = useProgress();
  const { t } = useTranslation();
  const settings = useSettings();
  const nav = useNavigate();
  const [showRestartConfirmation, setShowRestartConfirmation] = React.useState<{ name: string; id: string } | null>(null);

  // Show loading if pack is not available
  if (!pack) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <p className="text-slate-400 text-lg">Loading characters...</p>
        </div>
      </div>
    );
  }
  
  const hasCharacterProgress = (characterId: string) => {
    // Check if character is completed
    if (completedRoles.includes(characterId)) {
      return true;
    }
    
    // Check if character has stage progress in localStorage
    try {
      const raw = localStorage.getItem(`ph-progress-${characterId}`);
      return raw !== null && raw !== undefined;
    } catch {
      return false;
    }
  };

  const onRestartCharacter = (character: { name: string; id: string }) => {
    setShowRestartConfirmation(character);
  };

  const onConfirmRestart = () => {
    if (showRestartConfirmation) {
      // Clear character progress from localStorage
      try {
        localStorage.removeItem(`ph-progress-${showRestartConfirmation.id}`);
      } catch {
        // Failed to remove character progress
      }
      
      // Reset completed role in progress store
      useProgress.getState().resetRole(showRestartConfirmation.id);
      
      // Close modal
      setShowRestartConfirmation(null);
      
      // Navigate directly to the game
      nav(ROUTES.PLAY(showRestartConfirmation.id));
    }
  };

  const onCancelRestart = () => {
    setShowRestartConfirmation(null);
  };

  // Handle escape key to close modal
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showRestartConfirmation) {
        setShowRestartConfirmation(null);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showRestartConfirmation]);
  
  if (!pack) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <p className="text-slate-400 text-lg">{t('loadingCharacters')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2">
            📖 {t('characterCodex')}
          </h1>
          <p className="text-slate-400 text-sm mb-4">
            {t('studyOpponents')}
          </p>
          <Link 
            to={ROUTES.ROOT} 
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
          >
            ← {t('backToMenu')}
          </Link>
        </div>

        {/* Pack Info */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">📦 {pack?.meta.name?.replace(/_/g, ' ').toUpperCase() || 'CHARACTER PACK'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <div className="text-2xl font-bold text-white">{pack?.roles.length || 0}</div>
              <div className="text-sm text-blue-300">{t('charactersAvailable')}</div>
            </div>
            <div className="p-4 bg-purple-500/20 rounded-lg border border-purple-500/30">
              <div className="text-2xl font-bold text-white">{pack?.meta.phases_per_run || 5}</div>
              <div className="text-sm text-purple-300">{t('phasesPerBattle')}</div>
            </div>
            <div className="p-4 bg-green-500/20 rounded-lg border border-green-500/30">
              <div className="text-2xl font-bold text-white">{completedRoles.length}</div>
              <div className="text-sm text-green-300">{t('completedCharacters')}</div>
            </div>
          </div>
        </div>

        {/* Characters Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pack?.roles.map((role) => {
            const stats = getCharacterStats(role.id);
            const gameTypes = getGameTypes(role.id);
            const sprite = pickSprite(role.id);
            const isCompleted = completedRoles.includes(role.id);
            
            return (
              <div 
                key={role.id} 
                className={`bg-white/5 backdrop-blur-sm rounded-xl p-6 border transition-all duration-200 hover:scale-105 ${
                  isCompleted 
                    ? 'border-green-500/30 bg-green-500/5' 
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                {/* Character Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="relative">
                    <img 
                      src={sprite} 
                      className="w-20 h-20 rounded-xl bg-white/10 p-3" 
                      style={{ imageRendering: 'pixelated' }} 
                    />
                    {isCompleted && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-white">{role.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(role.difficulty)}`}>
                        {role.difficulty.charAt(0).toUpperCase() + role.difficulty.slice(1)}
                      </span>
                    </div>
                    
                    <p className="text-slate-300 text-sm mb-3 leading-relaxed">
                      {role.description}
                    </p>
                    
                    <div className="text-xs text-slate-400">
                      {t('specialty')}: <span className="text-slate-300 font-medium">{t(stats.specialtyKey as keyof typeof translations.en)}</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 bg-green-500/20 rounded-lg border border-green-500/30">
                    <div className="text-lg font-bold text-white">{stats.health}</div>
                    <div className="text-xs text-green-300">{t('healthPoints')}</div>
                  </div>
                  <div className="text-center p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
                    <div className="text-lg font-bold text-white">{stats.attack}</div>
                    <div className="text-xs text-blue-300">{t('attackPower')}</div>
                  </div>
                </div>

                {/* Challenge Types */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-white mb-3">🎯 {t('challengeTypes')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {gameTypes.map((typeKey, index) => (
                      <span 
                        key={index} 
                        className="px-2 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-md text-xs font-medium"
                      >
                        {t(typeKey as keyof typeof translations.en)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Link
                    to={ROUTES.PLAY(role.id)}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-center transition-colors ${
                      isCompleted
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isCompleted ? t('challengeAgain') : t('enterBattle')}
                  </Link>
                  {hasCharacterProgress(role.id) && (
                    <button
                      onClick={() => onRestartCharacter(role)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm font-medium transition-colors"
                    >
                      {t('restartCharacter')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Victory Banner */}
        {pack?.roles.every((r) => completedRoles.includes(r.id)) && (
          <div className="mt-8 text-center p-8 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-500/30">
            <div className="text-6xl mb-4">👑</div>
            <div className="text-3xl font-bold text-white mb-2">{t('masterAllCharactersTitle')}</div>
            <div className="text-yellow-300 text-lg">{t('masterAllCharactersSubtitle')}</div>
          </div>
        )}
      </div>

      {/* Restart Confirmation Modal */}
      {showRestartConfirmation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full border border-red-500/30 shadow-2xl">
            {/* Warning Icon */}
            <div className="text-center mb-6">
              <div className="text-red-400 text-5xl mb-3">⚠️</div>
              <h2 className="text-xl font-bold text-white mb-2">
                {settings.language === 'zh-hk' ? '重新開始角色' : 'Restart Character'}
              </h2>
            </div>

            {/* Confirmation Message */}
            <div className="mb-6">
              <p className="text-slate-300 text-center leading-relaxed">
                {settings.language === 'zh-hk' 
                  ? `確定要重新開始${showRestartConfirmation.name}嘅進度嗎？呢個操作會清除佢嘅所有階段進度並直接開始新遊戲。`
                  : `Are you sure you want to restart ${showRestartConfirmation.name}? This will clear all stage progress for this character and start a new game directly.`
                }
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onCancelRestart}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={onConfirmRestart}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors"
              >
                {settings.language === 'zh-hk' ? '確認重新開始' : 'Confirm Restart'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


