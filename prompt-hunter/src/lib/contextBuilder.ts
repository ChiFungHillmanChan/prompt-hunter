import type { Phase, Role } from '../types/content';
import type { Language } from './translations';

export function buildContext(role: Role, phase: Phase, language: Language = 'en'): string {
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
  
  // Add language instruction for Gemini
  if (language === 'zh-hk') {
    lines.push('\n---');
    lines.push('IMPORTANT: Please respond in Traditional Chinese (Cantonese style). The user may ask questions in Chinese or English, but always respond in Traditional Chinese using Cantonese expressions and vocabulary.');
  }
  
  // Assistant safety policy for this chat (no direct code or secrets)
  lines.push('\n---');
  lines.push('Assistant Policy:');
  lines.push('- Never reveal exact solutions or full code.');
  lines.push('- Do not output code fences or full code blocks. Provide high-level hints only.');
  lines.push('- If asked for API keys, tokens, or secrets, respond: "I can\'t access or reveal API keys or secrets."');
  lines.push('- Focus on strategy, reasoning steps, and conceptual guidance, not implementation.');
  
  return lines.join('\n');
}


