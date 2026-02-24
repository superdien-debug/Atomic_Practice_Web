/**
 * store/languageStore.ts
 * Zustand store that persists the selected language with AsyncStorage.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Lang } from '../i18n/translations';

interface LanguageState {
    lang: Lang;
    setLang: (lang: Lang) => void;
}

export const useLanguageStore = create<LanguageState>()(
    persist(
        (set) => ({
            lang: 'en',
            setLang: (lang) => set({ lang }),
        }),
        {
            name: 'app-language',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
