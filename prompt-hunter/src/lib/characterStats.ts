import { translations, type Language } from './translations';

export function getCharacterStats(roleId: string) {
  const baseStats = { health: 80, attack: 25 };
  
  switch (roleId) {
    case 'engineer':
      return { health: 300, attack: 100, specialtyKey: 'debuggingLogic' as const };
    case 'bard':
      return { health: 150, attack: 100, specialtyKey: 'creativeMusic' as const };
    case 'necromancer':
      return { health: 500, attack: 50, specialtyKey: 'darkArtsAlgorithms' as const };
    case 'alchemist':
      return { health: 100, attack: 20, specialtyKey: 'dataTransformation' as const };
    case 'hacker':
      return { health: 50, attack: 100, specialtyKey: 'securitySystems' as const };
    case 'mysterious':
      return { health: 100000000, attack: 100000000, specialtyKey: 'unknownPowers' as const };
    default:
      return { ...baseStats, specialtyKey: 'generalCombat' as const };
  }
}

export function getCharacterSpecialty(roleId: string, language: Language): string {
  const stats = getCharacterStats(roleId);
  return translations[language][stats.specialtyKey];
}

export function pickCharacterSprite(id: string): string {
  if (id.toLowerCase().includes('bard')) return '/sprites/bard.svg';
  if (id.toLowerCase().includes('necro')) return '/sprites/necromancer.svg';
  if (id.toLowerCase().includes('alch')) return '/sprites/alchemist.svg';
  if (id.toLowerCase().includes('hack')) return '/sprites/hacker.svg';
  if (id.toLowerCase().includes('myst')) return '/sprites/mysterious.svg';
  return '/sprites/engineer.svg';
}