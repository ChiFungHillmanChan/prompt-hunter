type Props = {
  name: string;
  difficulty: string;
  won?: boolean;
  onClick?: () => void;
};

export default function CharacterCard({ name, difficulty, won, onClick }: Props) {
  return (
    <button onClick={onClick} className="relative p-3 bg-white/5 border border-white/10 rounded text-left w-full">
      <div className="w-12 h-12 bg-slate-800 rounded mb-2" style={{ imageRendering: 'pixelated' }} />
      <div className="text-sm font-semibold">{name}</div>
      <div className="text-xs opacity-70">{difficulty}</div>
      {won && (
        <span className="absolute top-1 right-1 text-[10px] bg-green-600 text-white px-1 rounded">WIN</span>
      )}
    </button>
  );
}


