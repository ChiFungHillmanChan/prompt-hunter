import { useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useContent } from '../store/content';
import { useSettings } from '../store/settings';
import { useSession } from '../store/session';
import { useProgress } from '../store/progress';
import { ROUTES } from '../lib/routes';
import { useToast } from '../components/Toast';
import CanvasLayer from '../components/CanvasLayer';
import TopHUD from '../components/TopHUD';
import HealthBar from '../components/HealthBar';
import TaskPanel from '../components/TaskPanel';
import AnswerPanel from '../components/AnswerPanel';
import ChatPanel from '../components/ChatPanel';

export default function PlayPage() {
  const { roleId } = useParams();
  const nav = useNavigate();
  const { push } = useToast();
  const { pack } = useContent();
  const settings = useSettings();
  const session = useSession();
  const { markRoleWin } = useProgress();
  const role = useMemo(() => pack?.roles.find((r) => r.id === roleId) || null, [pack, roleId]);
  const phasesPerRun = useContent((s) => s.phasesPerRun);

  useEffect(() => {
    if (!role) return;
    const monsterHP = 30 + 10 * 1; // phase 1 initial
    session.resetForRole(role.id, settings.playerMaxHP, monsterHP);
  }, [role]);

  // Basic countdown effect
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  useEffect(() => {
    if (!role) return;
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
          if (newHp <= 0) {
            push('error', 'Defeated — returning to Settings');
            setTimeout(() => nav(ROUTES.ROOT), 800);
            return { ...s, playerHP: 0, running: false, nextAttackMs: settings.attackIntervalMs };
          }
          return { ...s, playerHP: newHp, nextAttackMs: settings.attackIntervalMs };
        }
        return { ...s, nextAttackMs: next };
      });
      rafRef.current = requestAnimationFrame(loop);
    };
    useSession.setState({ nextAttackMs: settings.attackIntervalMs });
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRef.current = 0;
    };
  }, [role, settings.attackIntervalMs, settings.monsterDamagePerTick]);

  if (!role) return <div className="p-4 text-slate-100">Loading…</div>;

  const phaseNumber = session.phaseIndex + 1;

  return (
    <div className="min-h-screen p-4 text-slate-100 space-y-3">
      <TopHUD roleName={role.name} phaseIndex={session.phaseIndex} phasesPerRun={phasesPerRun} attackInMs={session.nextAttackMs} />

      <CanvasLayer spriteSrc={pickMonsterSprite(phaseNumber)} hitTrigger={session.monsterHP} reducedMotion={settings.reducedMotion} />

      <HealthBar label="Player HP" value={session.playerHP} max={settings.playerMaxHP} />
      <HealthBar label="Monster HP" value={session.monsterHP} max={session.maxMonsterHP} colorClass="bg-red-600" />

      <div className="space-y-3">
        <TaskPanel phase={role.phases[session.phaseIndex]} />
        <AnswerPanel
          phase={role.phases[session.phaseIndex]}
          onSuccess={() => {
            const damage = settings.playerAnswerDamage;
            const newHp = Math.max(0, session.monsterHP - damage);
            if (newHp <= 0) {
              const nextPhase = session.phaseIndex + 1;
              if (nextPhase >= phasesPerRun) {
                markRoleWin(role.id);
                push('success', 'Victory!');
                setTimeout(() => nav(ROUTES.ROOT), 700);
              } else {
                const nextMonsterHP = 30 + 10 * (nextPhase + 1);
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
        <ChatPanel role={role} phase={role.phases[session.phaseIndex]} />
      </div>
    </div>
  );
}

function pickMonsterSprite(phase: number): string {
  if (phase % 3 === 1) return '/src/assets/sprites/monster_slime.svg';
  if (phase % 3 === 2) return '/src/assets/sprites/monster_imp.svg';
  return '/src/assets/sprites/monster_bat.svg';
}


