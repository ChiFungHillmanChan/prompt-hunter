import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../lib/routes';
import { useSettings } from '../store/settings';
import { useContent } from '../store/content';
import { useProgress } from '../store/progress';
import { maskKey } from '../lib/gemini';
import { useTranslation } from '../hooks/useTranslation';
import React from 'react';

function getCharacterStats(roleId: string) {
  const baseStats = { health: 80, attack: 25 };
  
  switch (roleId) {
    case 'engineer':
      return { health: 300, attack: 100, specialty: 'Debugging & Logic' };
    case 'bard':
      return { health: 150, attack: 100, specialty: 'Creative Writing & Music' };
    case 'necromancer':
      return { health: 100, attack: 50, specialty: 'Dark Arts & Algorithms' };
    case 'alchemist':
      return { health: 100, attack: 20, specialty: 'Data Transformation' };
    case 'hacker':
      return { health: 50, attack: 100, specialty: 'Security & Systems' };
    case 'mysterious':
      return { health: 100000000, attack: 100000000, specialty: 'Unknown Powers' };
    default:
      return { ...baseStats, specialty: 'General Combat' };
  }
}

export default function SettingsMenu() {
  const nav = useNavigate();
  const settings = useSettings();
  const { pack } = useContent();
  const { completedRoles } = useProgress();
  const { t } = useTranslation();
  const [apiKey, setApiKey] = React.useState<string>(() => sessionStorage.getItem('gemini_api_key') || '');
  const [newApiKey, setNewApiKey] = React.useState('');
  const [showKeyInput, setShowKeyInput] = React.useState(false);
  const [selectedCharacter, setSelectedCharacter] = React.useState<any>(null);

  const onRemoveKey = () => {
    sessionStorage.removeItem('gemini_api_key');
    setApiKey('');
    setShowKeyInput(true);
  };

  const onSaveKey = () => {
    const key = newApiKey.trim();
    if (key) {
      sessionStorage.setItem('gemini_api_key', key);
      setApiKey(key);
      setNewApiKey('');
      setShowKeyInput(false);
    }
  };

  const onCancelKey = () => {
    setNewApiKey('');
    setShowKeyInput(false);
  };

  const onCharacterClick = (role: any) => {
    setSelectedCharacter(role);
  };

  const onStartGame = () => {
    if (selectedCharacter) {
      nav(ROUTES.PLAY(selectedCharacter.id));
    }
  };

  const onCancelSelection = () => {
    setSelectedCharacter(null);
  };

  // Handle escape key to close modal
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedCharacter) {
        setSelectedCharacter(null);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedCharacter]);


  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2">
            {t('appTitle')}
          </h1>
          <p className="text-slate-400 text-sm">
            {t('tagline')}
          </p>
        </div>

        {/* Settings Grid */}
        <div className="grid gap-6 md:gap-8">
          
          {/* Game Settings Card */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              {t('gameSettings')}
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-300">{t('language')}</label>
                <select
                  value={settings.language}
                  onChange={(e) => {
                    const newLanguage = e.target.value as 'en' | 'zh-hk';
                    settings.set('language', newLanguage);
                    useContent.getState().loadLanguage(newLanguage);
                  }}
                  className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="en">English</option>
                  <option value="zh-hk">繁體中文 (廣東話)</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center p-3 bg-red-500/20 rounded-lg border border-red-500/30">
                  <div className="text-sm text-red-300 mb-1">{t('monsterHealth')}</div>
                  <div className="text-xl font-bold text-white">{settings.playerMaxHP}</div>
                </div>
                <div className="text-center p-3 bg-orange-500/20 rounded-lg border border-orange-500/30">
                  <div className="text-sm text-orange-300 mb-1">{t('attackPerSecond')}</div>
                  <div className="text-xl font-bold text-white">{settings.monsterDamagePerTick}</div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Assistant Card */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              {t('aiAssistant')}
            </h2>
            
            {apiKey && !showKeyInput ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-500/20 rounded-lg border border-green-500/30">
                  <div>
                    <div className="text-sm text-green-300 mb-1">{t('apiKeyConnected')}</div>
                    <div className="text-white font-mono text-sm">{maskKey(apiKey)}</div>
                  </div>
                  <div className="text-green-400 text-2xl">✓</div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setShowKeyInput(true)}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
                  >
                    {t('changeKey')}
                  </button>
                  <button
                    onClick={onRemoveKey}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    {t('removeKey')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                  <div className="text-sm text-yellow-300 mb-1">
                    {!apiKey ? t('noAiConnected') : t('enterNewKey')}
                  </div>
                  <div className="text-slate-300 text-xs">
                    {t('connectHint')}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <input
                    type="password"
                    value={newApiKey}
                    onChange={(e) => setNewApiKey(e.target.value)}
                    placeholder={t('pasteApiKey')}
                    className="w-full px-4 py-3 bg-slate-800/50 rounded-lg border border-slate-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-white placeholder-slate-400 text-sm"
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={onSaveKey}
                      disabled={!newApiKey.trim()}
                      className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                    >
                      {t('connectAi')}
                    </button>
                    {apiKey && (
                      <button
                        onClick={onCancelKey}
                        className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
                      >
                        {t('cancel')}
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 text-center">
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline transition-colors"
                    >
                      {t('getApiKey')}
                    </a>
                    <span className="mx-2">•</span>
                    <span>{t('securityNote')}</span>
                  </div>
                  <div className="text-xs text-yellow-400 text-center mt-2">
                    {t('vpnWarning')}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Characters Card */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              {t('availableCharacters')}
            </h2>
            
            {!pack ? (
              <div className="text-center py-8">
                <div className="animate-spin text-3xl mb-2">⏳</div>
                <p className="text-slate-400">{t('loadingCharacters')}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {pack.roles.map((r) => {
                    const won = completedRoles.includes(r.id);
                    const sprite = pickSprite(r.id);
                    let stageLabel: string | null = null;
                    try {
                      const raw = localStorage.getItem(`ph-progress-${r.id}`);
                      if (raw) {
                        const saved = JSON.parse(raw || '{}');
                        const idx = typeof saved?.phaseIndex === 'number' ? saved.phaseIndex : 0;
                        stageLabel = settings.language === 'zh-hk' ? `${t('stageLabel')}${idx + 1}${t('stageWithNumber')}` : `${t('stageLabel')} ${idx + 1}`;
                      }
                    } catch {}
                    return (
                      <button
                        key={r.id}
                        onClick={() => onCharacterClick(r)}
                        className="group relative p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-left transition-all duration-200 hover:scale-105"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <img 
                            src={sprite} 
                            className="w-16 h-16 rounded-lg bg-white/10 p-2" 
                            style={{ imageRendering: 'pixelated' }} 
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-base font-semibold text-white truncate">{r.name}</div>
                            <div className="text-xs text-slate-400 capitalize">{r.difficulty}</div>
                          </div>
                        </div>
                        
                        <div className="text-xs text-slate-300 line-clamp-2 mb-3">
                          {r.description}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-slate-400">
                            {pack.meta.phases_per_run} {t('challenges')}
                          </div>
                          <div className="flex items-center gap-2">
                            {stageLabel && !won && (
                              <span className="px-2 py-1 text-xs bg-blue-600 text-white rounded-full font-medium">
                                {stageLabel}
                              </span>
                            )}
                            {won && (
                              <span className="px-2 py-1 text-xs bg-green-600 text-white rounded-full font-medium">
                                {t('complete')}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {won && (
                          <div className="absolute inset-0 bg-green-500/10 rounded-xl border-2 border-green-500/30"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {pack.roles.every((r) => completedRoles.includes(r.id)) && (
                  <div className="text-center p-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-500/30">
                    <div className="text-3xl mb-2">🏆</div>
                    <div className="text-xl font-bold text-white mb-1">{t('congratulations')}</div>
                    <div className="text-yellow-300 text-sm">{t('masteredAll')}</div>
                  </div>
                )}
                
                <div className="mt-6 text-center">
                  <Link 
                    to={ROUTES.PACK} 
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
                  >
                    {t('viewCharacterDetails')}
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Character Selection Modal */}
      {selectedCharacter && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-white/20 shadow-2xl">
            {/* Character Header */}
            <div className="text-center mb-6">
              <img 
                src={pickSprite(selectedCharacter.id)} 
                className="w-24 h-24 mx-auto rounded-xl bg-white/10 p-3 mb-4" 
                style={{ imageRendering: 'pixelated' }} 
              />
              <h2 className="text-2xl font-bold text-white mb-2">{selectedCharacter.name}</h2>
              <p className="text-slate-400 text-sm mb-1 capitalize">{t(selectedCharacter.difficulty as any)} {t('difficulty')}</p>
              <p className="text-slate-300 text-sm leading-relaxed">{selectedCharacter.description}</p>
            </div>

            {/* Combat Stats */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4 text-center">{t('combatOverview')}</h3>
              
              {(() => {
                const characterStats = getCharacterStats(selectedCharacter.id);
                return (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-500/20 rounded-lg border border-green-500/30">
                      <div className="text-sm text-green-300 mb-1">{selectedCharacter.name} {t('health')}</div>
                      <div className="text-xl font-bold text-white">{characterStats.health} HP</div>
                    </div>
                    <div className="text-center p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
                      <div className="text-sm text-blue-300 mb-1">{selectedCharacter.name} {t('atk')}</div>
                      <div className="text-xl font-bold text-white">{characterStats.attack} DMG</div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Challenge Info */}
            <div className="mb-6">
              <div className="bg-purple-500/20 rounded-lg p-4 border border-purple-500/30">
                <div className="text-center">
                  <div className="text-purple-300 text-sm mb-1">{t('challengePhases')}</div>
                  <div className="text-white text-lg font-bold">{pack?.meta.phases_per_run || 5} {t('rounds')}</div>
                  <div className="text-purple-300 text-xs mt-1">
                    {t('completeAllPhases')} {selectedCharacter.name}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onCancelSelection}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={onStartGame}
                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors"
              >
                {t('startBattle')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function pickSprite(id: string): string {
  if (id.toLowerCase().includes('bard')) return '/sprites/bard.svg';
  if (id.toLowerCase().includes('necro')) return '/sprites/necromancer.svg';
  if (id.toLowerCase().includes('alch')) return '/sprites/alchemist.svg';
  if (id.toLowerCase().includes('hack')) return '/sprites/hacker.svg';
  if (id.toLowerCase().includes('myst')) return '/sprites/mysterious.svg';
  return '/sprites/engineer.svg';
}


