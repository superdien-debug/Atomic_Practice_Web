/**
 * i18n/useT.ts
 * Simple hook to get the translation function for the active language.
 *
 * Usage in any component:
 *   const t = useT();
 *   <Text>{t('signIn')}</Text>
 */

import { useLanguageStore } from '../store/languageStore';
import translations, { TranslationKey } from './translations';

export function useT() {
    const lang = useLanguageStore((s) => s.lang);
    return (key: TranslationKey): string => translations[lang][key] ?? translations['en'][key] ?? key;
}
