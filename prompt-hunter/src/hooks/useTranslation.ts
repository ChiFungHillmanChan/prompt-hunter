import { useSettings } from '../store/settings';
import { translations, type TranslationKey } from '../lib/translations';

export function useTranslation() {
  const language = useSettings((s) => s.language);
  
  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key];
  };
  
  return { t, language };
}