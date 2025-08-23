type Props = {
  roleName: string;
  phaseIndex: number;
  phasesPerRun: number;
  attackInMs: number;
};

export default function TopHUD({ roleName, phaseIndex, phasesPerRun, attackInMs }: Props) {
  const secs = Math.ceil(attackInMs / 1000);
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm opacity-80">{roleName}</div>
        <div className="text-xs opacity-60">Phase {phaseIndex + 1}/{phasesPerRun}</div>
      </div>
      <div className="text-xs opacity-80">Attack in T-{secs}</div>
    </div>
  );
}


