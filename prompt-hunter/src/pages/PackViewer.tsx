import { useContent } from '../store/content';
import { useProgress } from '../store/progress';
import { Link } from 'react-router-dom';
import { ROUTES } from '../lib/routes';

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

function getGameTypes(phases: any[]) {
  const types = new Set();
  phases.forEach(phase => {
    switch (phase.task_type) {
      case 'bugfix':
        types.add('🐛 Debug Code');
        break;
      case 'optimization':
        types.add('⚡ Optimize Performance');
        break;
      case 'creative':
        types.add('🎨 Creative Tasks');
        break;
      case 'logic':
        types.add('🧠 Logic Puzzles');
        break;
      case 'security':
        types.add('🔒 Security Challenges');
        break;
      case 'data':
        types.add('📊 Data Processing');
        break;
      default:
        types.add('⚔️ Combat Challenge');
    }
  });
  return Array.from(types);
}

function pickSprite(id: string): string {
  if (id.toLowerCase().includes('bard')) return '/sprites/bard.svg';
  if (id.toLowerCase().includes('necro')) return '/sprites/necromancer.svg';
  if (id.toLowerCase().includes('alch')) return '/sprites/alchemist.svg';
  if (id.toLowerCase().includes('hack')) return '/sprites/hacker.svg';
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
  
  if (!pack) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <p className="text-slate-400 text-lg">Loading character data...</p>
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
            📖 Character Codex
          </h1>
          <p className="text-slate-400 text-sm mb-4">
            Study your opponents and choose your battles wisely
          </p>
          <Link 
            to={ROUTES.ROOT} 
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
          >
            ← Back to Menu
          </Link>
        </div>

        {/* Pack Info */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">📦 {pack.meta.name.replace(/_/g, ' ').toUpperCase()}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <div className="text-2xl font-bold text-white">{pack.roles.length}</div>
              <div className="text-sm text-blue-300">Characters Available</div>
            </div>
            <div className="p-4 bg-purple-500/20 rounded-lg border border-purple-500/30">
              <div className="text-2xl font-bold text-white">{pack.meta.phases_per_run}</div>
              <div className="text-sm text-purple-300">Phases per Battle</div>
            </div>
            <div className="p-4 bg-green-500/20 rounded-lg border border-green-500/30">
              <div className="text-2xl font-bold text-white">{completedRoles.length}</div>
              <div className="text-sm text-green-300">Completed Characters</div>
            </div>
          </div>
        </div>

        {/* Characters Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pack.roles.map((role) => {
            const stats = getCharacterStats(role.id);
            const gameTypes = getGameTypes(role.phases);
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
                      Specialty: <span className="text-slate-300 font-medium">{stats.specialty}</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 bg-green-500/20 rounded-lg border border-green-500/30">
                    <div className="text-lg font-bold text-white">{stats.health}</div>
                    <div className="text-xs text-green-300">Health Points</div>
                  </div>
                  <div className="text-center p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
                    <div className="text-lg font-bold text-white">{stats.attack}</div>
                    <div className="text-xs text-blue-300">Attack Power</div>
                  </div>
                </div>

                {/* Challenge Types */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-white mb-3">🎯 Challenge Types</h4>
                  <div className="flex flex-wrap gap-2">
                    {gameTypes.map((type, index) => (
                      <span 
                        key={index} 
                        className="px-2 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-md text-xs font-medium"
                      >
                        {String(type)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex gap-3">
                  <Link
                    to={ROUTES.PLAY(role.id)}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-center transition-colors ${
                      isCompleted
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isCompleted ? '🏆 Challenge Again' : '⚔️ Enter Battle'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Victory Banner */}
        {pack.roles.every((r) => completedRoles.includes(r.id)) && (
          <div className="mt-8 text-center p-8 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-500/30">
            <div className="text-6xl mb-4">👑</div>
            <div className="text-3xl font-bold text-white mb-2">Master of All Characters!</div>
            <div className="text-yellow-300 text-lg">You've conquered every challenge in this realm.</div>
          </div>
        )}
      </div>
    </div>
  );
}


