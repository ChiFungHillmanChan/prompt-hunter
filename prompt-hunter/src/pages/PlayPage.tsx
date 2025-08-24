import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useContent } from '../store/content';
import { useSettings } from '../store/settings';
import { useSession } from '../store/session';
import { useProgress } from '../store/progress';
import { ROUTES } from '../lib/routes';
import { useToast } from '../components/Toast';
import { useTranslation } from '../hooks/useTranslation';
import TaskPanel from '../components/TaskPanel';
import AnswerPanel from '../components/AnswerPanel';
import ChatPanel from '../components/ChatPanel';
import { getCharacterStats } from '../lib/characterStats';

function pickCharacterSprite(id: string): string {
  if (id.toLowerCase().includes('bard')) return '/sprites/bard.svg';
  if (id.toLowerCase().includes('necro')) return '/sprites/necromancer.svg';
  if (id.toLowerCase().includes('alch')) return '/sprites/alchemist.svg';
  if (id.toLowerCase().includes('hack')) return '/sprites/hacker.svg';
  if (id.toLowerCase().includes('myst')) return '/sprites/mysterious.svg';
  return '/sprites/engineer.svg';
}

export default function PlayPage() {
  const { roleId } = useParams();
  const nav = useNavigate();
  const { push } = useToast();
  const { pack } = useContent();
  const defaultPhasesPerRun = useContent((s) => s.phasesPerRun);
  const settings = useSettings();
  const session = useSession();
  const { markRoleWin } = useProgress();
  const { t, language } = useTranslation();
  const role = useMemo(() => pack?.roles.find((r) => r.id === roleId) || null, [pack, roleId]);
  const phasesPerRun = role?.phases.length ?? defaultPhasesPerRun;
  const characterStats = useMemo(() => (role ? getCharacterStats(role.id) : null), [role?.id]);
  
  const [playerShaking, setPlayerShaking] = useState(false);
  const [monsterShaking, setMonsterShaking] = useState(false);
  const [showPlayerDamage, setShowPlayerDamage] = useState(false);
  const [showMonsterDamage, setShowMonsterDamage] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [showPhaseClearModal, setShowPhaseClearModal] = useState(false);

  useEffect(() => {
    if (!role || !characterStats) return;
    // Load saved progress if present; otherwise start fresh
    try {
      const key = `ph-progress-${role.id}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const saved = JSON.parse(raw || '{}');
        const savedPhase = Math.max(0, Math.min(Number(saved.phaseIndex) || 0, (role.phases.length || 1) - 1));
        const savedMonsterHP = Math.max(0, Number(saved.monsterHP) || 100);
        const savedMaxMonsterHP = Math.max(savedMonsterHP, Number(saved.maxMonsterHP) || savedMonsterHP);
        const savedPlayerHP = Math.max(0, Math.min(characterStats.health, Number(saved.playerHP) || characterStats.health));
        session.resetForRole(role.id, characterStats.health, savedMonsterHP);
        useSession.setState({ phaseIndex: savedPhase, playerHP: savedPlayerHP, maxMonsterHP: savedMaxMonsterHP });
        return;
      }
    } catch {}
    const monsterHP = 100; // default per stage
    session.resetForRole(role.id, characterStats.health, monsterHP);
  }, [role?.id]);

  // Attack countdown and damage effects
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  const lastPlayerHP = useRef<number>(characterStats?.health || 100);
  const lastMonsterHP = useRef<number>(50);

  useEffect(() => {
    if (!role || !characterStats) return;
    const loop = (t: number) => {
      if (document.visibilityState === 'hidden') {
        rafRef.current = requestAnimationFrame(loop);
        lastRef.current = t;
        return;
      }
      if (!lastRef.current) lastRef.current = t;
      const dt = t - lastRef.current;
      lastRef.current = t;
      
      useSession.setState((s) => {
        let next = s.nextAttackMs - dt;
        if (next <= 0) {
          const newHp = Math.max(0, s.playerHP - settings.monsterDamagePerTick);
          
          // Trigger player damage animation
          if (newHp < lastPlayerHP.current) {
            setPlayerShaking(true);
            setShowPlayerDamage(true);
            setTimeout(() => setPlayerShaking(false), 300);
            setTimeout(() => setShowPlayerDamage(false), 800);
            lastPlayerHP.current = newHp;
          }
          
          if (newHp <= 0) {
            push('error', 'Defeated — returning to Settings');
            try { if (role) localStorage.removeItem(`ph-progress-${role.id}`); } catch {}
            setTimeout(() => nav(ROUTES.ROOT), 800);
            return { ...s, playerHP: 0, running: false, nextAttackMs: settings.attackIntervalMs };
          }
          // Persist updated player HP mid-combat (monster attack tick)
          try {
            if (role) {
              localStorage.setItem(
                `ph-progress-${role.id}`,
                JSON.stringify({
                  phaseIndex: s.phaseIndex,
                  monsterHP: s.monsterHP,
                  maxMonsterHP: s.maxMonsterHP,
                  playerHP: newHp,
                })
              );
            }
          } catch {}
          return { ...s, playerHP: newHp, nextAttackMs: settings.attackIntervalMs };
        }
        return { ...s, nextAttackMs: next };
      });
      
      // Check for monster damage
      if (session.monsterHP < lastMonsterHP.current) {
        setMonsterShaking(true);
        setShowMonsterDamage(true);
        setTimeout(() => setMonsterShaking(false), 300);
        setTimeout(() => setShowMonsterDamage(false), 800);
        lastMonsterHP.current = session.monsterHP;
      }
      
      rafRef.current = requestAnimationFrame(loop);
    };
    useSession.setState({ nextAttackMs: settings.attackIntervalMs });
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRef.current = 0;
    };
  }, [role?.id, characterStats?.health, settings.attackIntervalMs, settings.monsterDamagePerTick]);

  if (!role || !characterStats) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <p className="text-slate-400 text-lg">{t('loadingBattle')}</p>
        </div>
      </div>
    );
  }

  const phaseNumber = session.phaseIndex + 1;
  const currentPhase = role.phases[session.phaseIndex];
  const timeLeft = Math.max(0, Math.ceil(session.nextAttackMs / 1000));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => nav(ROUTES.ROOT)}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm text-white"
            >{t('backToMenu')}</button>
            <h1 className="text-2xl md:text-3xl font-bold text-white text-center flex-1">
              {role.name} - {language === 'zh-hk' ? `${t('stageLabel')}${phaseNumber}${t('stageWithNumber')}` : `${t('stageLabel')} ${phaseNumber}`}
            </h1>
            <div className="w-[110px]" />
          </div>
          <div className="flex justify-center items-center gap-4 text-sm mt-2">
            <span className="text-slate-400">{session.phaseIndex + 1}/{phasesPerRun}</span>
            <div className={`px-3 py-1 rounded-full ${timeLeft <= 2 ? 'bg-red-500/20 text-red-300' : 'bg-orange-500/20 text-orange-300'}`}>
              {t('nextAttack')}: {timeLeft}s
            </div>
          </div>
        </div>

        {/* 2D Battle Arena */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 mb-6 border border-white/10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            
            {/* Player Character (Left) */}
            <div className="text-center">
              <div className="relative mb-4">
                <img 
                  src={pickCharacterSprite(role.id)}
                  className={`w-24 h-24 md:w-32 md:h-32 mx-auto transition-transform duration-200 ${playerShaking ? 'animate-pulse scale-110' : ''}`}
                  style={{ imageRendering: 'pixelated' }}
                />
                {showPlayerDamage && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-red-400 font-bold animate-bounce">
                    -{settings.monsterDamagePerTick}
                  </div>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-white mb-2">{role.name}</h3>
              
              {/* Player HP Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-xs text-green-300 mb-1">
                  <span>{t('health')}</span>
                  <span>{session.playerHP}/{characterStats.health}</span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
                    style={{ width: `${(session.playerHP / characterStats.health) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="text-xs text-slate-400">{t('atk')}: {characterStats.attack}</div>
            </div>

            {/* VS Indicator (Center) */}
            <div className="text-center lg:block hidden">
              <div className="text-4xl font-bold text-slate-500 mb-2">⚔️</div>
              <div className="text-slate-400 text-sm">{t('battle')}</div>
            </div>

            {/* Monster (Right) */}
            <div className="text-center">
              <div className="relative mb-4">
                <img 
                  src={pickMonsterSprite(phaseNumber)}
                  className={`w-24 h-24 md:w-32 md:h-32 mx-auto transition-transform duration-200 ${monsterShaking ? 'animate-pulse scale-110' : ''}`}
                  style={{ imageRendering: 'pixelated' }}
                />
                {showMonsterDamage && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-yellow-400 font-bold animate-bounce">
                    -{characterStats.attack}
                  </div>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-white mb-2">{t('monster')} {phaseNumber}</h3>
              
              {/* Monster HP Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-xs text-red-300 mb-1">
                  <span>{t('health')}</span>
                  <span>{session.monsterHP}/{session.maxMonsterHP}</span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-300"
                    style={{ width: `${(session.monsterHP / session.maxMonsterHP) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="text-xs text-slate-400">{t('dmg')}: {settings.monsterDamagePerTick}{t('tick')}</div>
            </div>
          </div>
        </div>

        {/* Game Panels */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Task Panel */}
          <div className="xl:col-span-2">
            <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10 mb-6">
              <TaskPanel phase={currentPhase} roleId={role.id} />
            </div>
            
            <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
              {role.id === 'necromancer' && (
                <div className="mb-3 text-xs text-yellow-300">
                  Format: Answer clearly with "A) ..." and "B) ..."
                </div>
              )}
              {currentPhase && (
                <AnswerPanel
                  key={`${role.id}-${session.phaseIndex}`}
                  phase={currentPhase}
                  onScore={(score) => {
                    // Mysterious custom logic
                    if (role.id === 'mysterious') {
                      if (score >= 100000000) {
                        // Mega-hit victory path
                        const nextPhase = session.phaseIndex + 1;
                        if (nextPhase >= phasesPerRun) {
                          markRoleWin(role.id);
                          push('success', 'Victory!');
                          if (rafRef.current) {
                            cancelAnimationFrame(rafRef.current);
                            rafRef.current = null;
                          }
                          useSession.setState({ running: false });
                          setShowVictoryModal(true);
                        } else {
                          const nextMonsterHP = 100;
                          useSession.setState({
                            phaseIndex: nextPhase,
                            monsterHP: nextMonsterHP,
                            maxMonsterHP: nextMonsterHP,
                          });
                          push('success', 'Phase cleared!');
                          setShowPhaseClearModal(true);
                          try {
                            localStorage.setItem(
                              `ph-progress-${role.id}`,
                              JSON.stringify({
                                phaseIndex: nextPhase,
                                monsterHP: nextMonsterHP,
                                maxMonsterHP: nextMonsterHP,
                                playerHP: session.playerHP,
                              })
                            );
                          } catch {}
                        }
                      } else {
                        // Wrong or partial: -1 HP, reset to full if reaches 0
                        const decreased = Math.max(0, session.monsterHP - 1);
                        if (decreased <= 0) {
                          const resetHp = session.maxMonsterHP || 100;
                          useSession.setState({ monsterHP: resetHp, maxMonsterHP: resetHp });
                          try {
                            localStorage.setItem(
                              `ph-progress-${role.id}`,
                              JSON.stringify({
                                phaseIndex: session.phaseIndex,
                                monsterHP: resetHp,
                                maxMonsterHP: resetHp,
                                playerHP: session.playerHP,
                              })
                            );
                          } catch {}
                        } else {
                          useSession.setState({ monsterHP: decreased });
                          try {
                            localStorage.setItem(
                              `ph-progress-${role.id}`,
                              JSON.stringify({
                                phaseIndex: session.phaseIndex,
                                monsterHP: decreased,
                                maxMonsterHP: session.maxMonsterHP,
                                playerHP: session.playerHP,
                              })
                            );
                          } catch {}
                        }
                      }
                      return;
                    }

                    // Default logic for non-mysterious
                    let damage = Math.max(0, score);
                    damage = Math.min(100, damage);
                    const newHp = Math.max(0, session.monsterHP - damage);
                    if (newHp <= 0) {
                      const nextPhase = session.phaseIndex + 1;
                      if (nextPhase >= phasesPerRun) {
                        markRoleWin(role.id);
                        push('success', 'Victory!');
                        if (rafRef.current) {
                          cancelAnimationFrame(rafRef.current);
                          rafRef.current = null;
                        }
                        useSession.setState({ running: false });
                        setShowVictoryModal(true);
                      } else {
                        const nextMonsterHP = 100;
                        useSession.setState({
                          phaseIndex: nextPhase,
                          monsterHP: nextMonsterHP,
                          maxMonsterHP: nextMonsterHP,
                        });
                        push('success', 'Phase cleared!');
                        setShowPhaseClearModal(true);
                        try {
                          localStorage.setItem(
                            `ph-progress-${role.id}`,
                            JSON.stringify({
                              phaseIndex: nextPhase,
                              monsterHP: nextMonsterHP,
                              maxMonsterHP: nextMonsterHP,
                              playerHP: session.playerHP,
                            })
                          );
                        } catch {}
                      }
                    } else {
                      useSession.setState({ monsterHP: newHp });
                      try {
                        localStorage.setItem(
                          `ph-progress-${role.id}`,
                          JSON.stringify({
                            phaseIndex: session.phaseIndex,
                            monsterHP: newHp,
                            maxMonsterHP: session.maxMonsterHP,
                            playerHP: session.playerHP,
                          })
                        );
                      } catch {}
                    }
                  }}
                />
              )}
            </div>
          </div>

          {/* Chat Panel */}
          {currentPhase && (
            <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10 h-fit">
              <ChatPanel role={role} phase={currentPhase} />
            </div>
          )}
        </div>
      </div>

      {showPhaseClearModal && !showVictoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-40">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-white/20 shadow-xl text-center">
            <div className="text-3xl mb-2">✨</div>
            <div className="text-xl font-bold text-white mb-2">Phase Cleared!</div>
            <div className="text-slate-300 mb-6">Prepare for the next challenge.</div>
            <button
              onClick={() => setShowPhaseClearModal(false)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
            >Continue</button>
          </div>
        </div>
      )}

      {showVictoryModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-white/20 shadow-2xl text-center">
            <div className="text-4xl mb-2">🏆</div>
            <div className="text-2xl font-bold text-white mb-2">Victory!</div>
            <div className="text-slate-300 mb-6">You cleared all stages.</div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => nav(ROUTES.ROOT)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors"
              >Continue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function pickMonsterSprite(phase: number): string {
  if (phase % 3 === 1) return '/sprites/monster_slime.svg';
  if (phase % 3 === 2) return '/sprites/monster_imp.svg';
  return '/sprites/monster_bat.svg';
}


