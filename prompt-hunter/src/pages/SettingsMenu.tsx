import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../lib/routes';
import { useSettings } from '../store/settings';
import { useContent } from '../store/content';
import { useProgress } from '../store/progress';
import type { ContentPack } from '../types/content';
import { useToast } from '../components/Toast';

export default function SettingsMenu() {
  const nav = useNavigate();
  const { push } = useToast();
  const settings = useSettings();
  const { pack } = useContent();
  const { completedRoles } = useProgress();

  const onPickFile = async (file: File) => {
    try {
      const text = await file.text();
      const json = JSON.parse(text) as ContentPack;
      if (!json.meta || !json.roles) throw new Error('Invalid pack');
      if (!Array.isArray(json.roles) || json.roles.length === 0) throw new Error('No roles');
      if (json.meta.phases_per_run <= 0) throw new Error('Bad phases_per_run');
      useContent.getState().setPack(json);
      push('success', 'Pack loaded');
    } catch (e) {
      push('error', 'Failed to load pack');
    }
  };

  return (
    <div className="min-h-screen p-4 max-w-screen-md mx-auto text-slate-100">
      <h1 className="text-3xl font-extrabold mb-2">Prompt Hunter</h1>
      <p className="text-xs opacity-70 mb-4">Vite + React + Tailwind v3</p>

      <section className="space-y-2 mb-6">
        <h2 className="font-bold">Session</h2>
        <p className="text-xs opacity-70">Gemini API key saved for this session. Manage in your browser's sessionStorage.</p>
        <div>
          <label className="text-xs flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={(e) => settings.set('reducedMotion', e.target.checked)}
            />
            <span>Reduced motion</span>
          </label>
        </div>
      </section>

      {/* Removed gameplay tunables per requirement */}

      {/* Content loader removed per requirement */}

      <section>
        <h2 className="font-bold mb-2">Characters</h2>
        <div className="mb-2 text-xs opacity-80">Player Stats — HP {settings.playerMaxHP}, ATK {settings.playerAnswerDamage}</div>
        {!pack && <p className="text-sm opacity-70">Loading pack…</p>}
        {pack && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {pack.roles.map((r) => {
              const won = completedRoles.includes(r.id);
              const sprite = pickSprite(r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => nav(ROUTES.PLAY(r.id))}
                  className="relative p-3 bg-white/5 border border-white/10 rounded text-left"
                >
                  <img src={sprite} className="w-12 h-12 mb-2" style={{ imageRendering: 'pixelated' }} />
                  <div className="text-sm font-semibold">{r.name}</div>
                  <div className="text-xs opacity-70">{r.difficulty}</div>
                  {won && (
                    <span className="absolute top-1 right-1 text-[10px] bg-green-600 text-white px-1 rounded">WIN</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {pack && pack.roles.every((r) => completedRoles.includes(r.id)) && (
          <div className="mt-3 p-2 rounded bg-green-700 text-white text-sm">All roles complete — Victory!</div>
        )}
        <div className="mt-4 text-sm">
          <Link to={ROUTES.PACK} className="underline opacity-80">Open Pack Viewer</Link>
        </div>
      </section>
    </div>
  );
}

function pickSprite(id: string): string {
  if (id.toLowerCase().includes('bard')) return '/src/assets/sprites/bard.svg';
  if (id.toLowerCase().includes('necro')) return '/src/assets/sprites/necromancer.svg';
  if (id.toLowerCase().includes('alch')) return '/src/assets/sprites/alchemist.svg';
  if (id.toLowerCase().includes('hack')) return '/src/assets/sprites/hacker.svg';
  if (id.toLowerCase().includes('myst')) return '/src/assets/sprites/mysterious.svg';
  return '/src/assets/sprites/engineer.svg';
}


