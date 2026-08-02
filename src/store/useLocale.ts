'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import th from '@/locales/th';
import en from '@/locales/en';

type LocaleKey = 'th' | 'en';

const locales = { th, en };

// Deep key access helper: t('auth.signInGoogle')
function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((acc, key) => acc?.[key], obj) ?? path;
}

interface LocaleStore {
  locale: LocaleKey;
  setLocale: (locale: LocaleKey) => void;
  toggleLocale: () => void;
  t: (key: string) => string;
}

export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set, get) => ({
      locale: 'en',
      setLocale: (locale) => set({ locale }),
      toggleLocale: () =>
        set((state) => ({ locale: state.locale === 'th' ? 'en' : 'th' })),
      t: (key: string) => getNestedValue(locales[get().locale], key),
    }),
    {
      name: 'oc-locale',
    }
  )
);

import { useState, useEffect } from 'react';

export const useLocale = () => {
  const store = useLocaleStore();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Return english store until mounted to prevent hydration errors
  return {
    locale: mounted ? store.locale : 'en',
    setLocale: store.setLocale,
    toggleLocale: store.toggleLocale,
    t: (key: string) => mounted ? store.t(key) : getNestedValue(locales['en'], key)
  };
};
