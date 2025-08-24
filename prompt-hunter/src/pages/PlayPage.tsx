import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useContent } from '../store/content';
import { useSettings } from '../store/settings';
import { useSession } from '../store/session';
import { useProgress } from '../store/progress';
import { ROUTES } from '../lib/routes';
import { useToast } from '../components/Toast';
import TaskPanel from '../components/TaskPanel';
import AnswerPanel from '../components/AnswerPanel';
import ChatPanel from '../components/ChatPanel';

function getCharacterStats(roleId: string) {
  const baseStats = { health: 80, attack: 25 };
  
  switch (roleId) {
    case 'engineer':
      return { health: 300, attack: 100, specialty: 'Debugging & Logic' };
    case 'bard':
      return { health: 150, attack: 100, specialty: 'Creative Writing & Music' };
    case 'necromancer':
      return { health: 70, attack: 50, specialty: 'Dark Arts & Algorithms' };
    case 'alchemist':
      return { health: 100, attack: 10, specialty: 'Data Transformation' };
    case 'hacker':
      return { health: 50, attack: 100, specialty: 'Security & Systems' };
    case 'mysterious':
      return { health: 100000000, attack: 100000000, specialty: 'Unknown Powers' };
    default:
      return { ...baseStats, specialty: 'General Combat' };
  }
}

function pickCharacterSprite(id: string): string {
  if (id.toLowerCase().includes('bard')) return '/src/assets/sprites/bard.svg';
  if (id.toLowerCase().includes('necro')) return '/src/assets/sprites/necromancer.svg';
  if (id.toLowerCase().includes('alch')) return '/src/assets/sprites/alchemist.svg';
  if (id.toLowerCase().includes('hack')) return '/src/assets/sprites/hacker.svg';
  if (id.toLowerCase().includes('myst')) return '/src/assets/sprites/mysterious.svg';
  return '/src/assets/sprites/engineer.svg';
}

export default function PlayPage() {
  const { roleId } = useParams();
  const nav = useNavigate();
  const { push } = useToast();
  const { pack } = useContent();
  const settings = useSettings();
  const session = useSession();
  const { markRoleWin } = useProgress();
  const role = useMemo(() => pack?.roles.find((r) => r.id === roleId) || null, [pack, roleId]);
  const phasesPerRun = role?.phases.length || useContent((s) => s.phasesPerRun);
  const characterStats = useMemo(() => (role ? getCharacterStats(role.id) : null), [role?.id]);
  
  const [playerShaking, setPlayerShaking] = useState(false);
  const [monsterShaking, setMonsterShaking] = useState(false);
  const [showPlayerDamage, setShowPlayerDamage] = useState(false);
  const [showMonsterDamage, setShowMonsterDamage] = useState(false);

  useEffect(() => {
    if (!role || !characterStats) return;
    const monsterHP = 100; // fixed per stage (Mysterious heal logic handled on damage)
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
            setTimeout(() => nav(ROUTES.ROOT), 800);
            return { ...s, playerHP: 0, running: false, nextAttackMs: settings.attackIntervalMs };
          }
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
          <p className="text-slate-400 text-lg">Loading battle...</p>
        </div>
      </div>
    );
  }

  const phaseNumber = session.phaseIndex + 1;
  const timeLeft = Math.max(0, Math.ceil(session.nextAttackMs / 1000));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {role.name} vs Phase {phaseNumber}
          </h1>
          <div className="flex justify-center items-center gap-4 text-sm">
            <span className="text-slate-400">Phase {session.phaseIndex + 1} of {phasesPerRun}</span>
            <div className={`px-3 py-1 rounded-full ${timeLeft <= 2 ? 'bg-red-500/20 text-red-300' : 'bg-orange-500/20 text-orange-300'}`}>
              Next attack: {timeLeft}s
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
                  <span>Health</span>
                  <span>{session.playerHP}/{characterStats.health}</span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
                    style={{ width: `${(session.playerHP / characterStats.health) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="text-xs text-slate-400">ATK: {characterStats.attack}</div>
            </div>

            {/* VS Indicator (Center) */}
            <div className="text-center lg:block hidden">
              <div className="text-4xl font-bold text-slate-500 mb-2">⚔️</div>
              <div className="text-slate-400 text-sm">BATTLE</div>
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
              
              <h3 className="text-lg font-bold text-white mb-2">Monster {phaseNumber}</h3>
              
              {/* Monster HP Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-xs text-red-300 mb-1">
                  <span>Health</span>
                  <span>{session.monsterHP}/{session.maxMonsterHP}</span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-300"
                    style={{ width: `${(session.monsterHP / session.maxMonsterHP) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="text-xs text-slate-400">DMG: {settings.monsterDamagePerTick}/tick</div>
            </div>
          </div>
        </div>

        {/* Game Panels */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Task Panel */}
          <div className="xl:col-span-2">
            <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10 mb-6">
              <TaskPanel phase={role.phases[session.phaseIndex]} />
            </div>
            
            <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
              <AnswerPanel
                phase={role.phases[session.phaseIndex]}
                onScore={(score) => {
                  let damage = Math.max(0, score);
                  // Special-case: Mysterious mega-hit if keywords matched
                  if (role.id === 'mysterious' && damage >= 100000000) {
                    damage = 100000000;
                  } else if (role.id !== 'mysterious') {
                    damage = Math.min(100, damage);
                  }
                  let newHp = Math.max(0, session.monsterHP - damage);
                  // Mysterious heal: if damaged but not mega-kill, revert to full
                  if (role.id === 'mysterious' && damage > 0 && damage < 100000000) {
                    newHp = 100;
                  }
                  if (newHp <= 0) {
                    const nextPhase = session.phaseIndex + 1;
                    if (nextPhase >= phasesPerRun) {
                      markRoleWin(role.id);
                      push('success', 'Victory!');
                      setTimeout(() => nav(ROUTES.ROOT), 700);
                    } else {
                      const nextMonsterHP = 100;
                      useSession.setState({
                        phaseIndex: nextPhase,
                        monsterHP: nextMonsterHP,
                        maxMonsterHP: nextMonsterHP,
                      });
                      push('success', 'Phase cleared!');
                    }
                  } else {
                    useSession.setState({ monsterHP: newHp });
                  }
                }}
              />
            </div>
          </div>

          {/* Chat Panel */}
          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10 h-fit">
            <ChatPanel role={role} phase={role.phases[session.phaseIndex]} />
          </div>
        </div>
      </div>
    </div>
  );
}

function pickMonsterSprite(phase: number): string {
  if (phase % 3 === 1) return '/src/assets/sprites/monster_slime.svg';
  if (phase % 3 === 2) return '/src/assets/sprites/monster_imp.svg';
  return '/src/assets/sprites/monster_bat.svg';
}


