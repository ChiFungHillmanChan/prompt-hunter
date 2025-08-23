import type { Phase, Role } from '../types/content';

export function buildContext(role: Role, phase: Phase): string {
  const lines: string[] = [];
  lines.push(`Role: ${role.name} (difficulty: ${role.difficulty})`);
  lines.push(`Phase ${phase.phase} — task: ${phase.task_type}`);
  lines.push('Prompt:');
  lines.push(phase.prompt);
  if (phase.bugged_code) {
    lines.push('\nBugged code:\n');
    lines.push(phase.bugged_code);
  }
  if (phase.perfect_code) {
    lines.push('\nTarget code outline:\n');
    lines.push(phase.perfect_code);
  }
  if (phase.lyric) {
    lines.push('\nLyric snippet:\n');
    lines.push(phase.lyric);
  }
  if (phase.hidden_data) {
    lines.push('\nHidden data available');
  }
  return lines.join('\n');
}


