import type { Phase, Role } from '../types/content';
import type { Language } from './translations';

export function buildContext(role: Role, phase: Phase, language: Language = 'en'): string {
  const lines: string[] = [];
  lines.push(`Role: ${role.name} (difficulty: ${role.difficulty})`);
  lines.push(`Phase ${phase.phase} — task: ${phase.task_type}`);
  lines.push('\nACTUAL User Question (respond to this specific question, not the phase scenario):');
  lines.push(phase.question || '');
  if (phase.prompt) {
    lines.push('\nPhase Background Context (this is the expected scenario, but the user may ask about different code):');
    lines.push(phase.prompt);
  }
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
  
  // Add language instruction for Gemini
  if (language === 'zh-hk') {
    lines.push('\n---');
    lines.push('IMPORTANT: Please respond in Traditional Chinese (Cantonese style). The user may ask questions in Chinese or English, but always respond in Traditional Chinese using Cantonese expressions and vocabulary.');
  }
  
  // Assistant safety policy for this chat (no direct code or secrets)
  lines.push('\n---');
  lines.push('Assistant Policy:');
  lines.push('- ANALYZE THE USER\'S ACTUAL QUESTION/CODE FIRST - do not assume it matches the phase context.');
  lines.push('- Keep responses SHORT (1-2 sentences max).');
  lines.push('- Give HINTS only, never exact solutions or full code.');
  lines.push('- No code blocks, code fences, or complete implementations.');
  lines.push('- If user asks for more details, then provide a brief example or explanation.');
  lines.push('- Focus on pointing user in the right direction, not solving for them.');
  lines.push('- The phase context above is background - respond to what the user actually asks, not the phase scenario.');
  
  return lines.join('\n');
}


