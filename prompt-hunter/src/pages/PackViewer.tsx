import { useContent } from '../store/content';

export default function PackViewer() {
  const { pack } = useContent();
  if (!pack) return <div className="p-4 text-slate-100">Loading…</div>;
  return (
    <div className="p-4 text-slate-100 max-w-screen-md mx-auto">
      <h1 className="text-xl font-bold mb-3">Pack Viewer</h1>
      {pack.roles.map((r) => (
        <div key={r.id} className="mb-4 p-3 bg-white/5 border border-white/10 rounded">
          <div className="font-semibold">{r.name}</div>
          <div className="text-xs opacity-70">{r.difficulty}</div>
          <ul className="mt-2 text-sm list-disc pl-4 space-y-1">
            {r.phases.map((p) => (
              <li key={p.phase}>
                <span className="opacity-70">Phase {p.phase}:</span> {p.prompt.split('\n')[0].slice(0, 80)}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}


