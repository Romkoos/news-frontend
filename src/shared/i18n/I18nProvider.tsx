/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Lang = 'ru' | 'en';

type Dict = Record<string, string>;

const ru: Dict = {
  'header.greeting': 'Привет, {name}',
  'header.openMenuAria': 'Открыть меню',

  'menu.title': 'Меню',
  'menu.lastNews': 'Последние новости',
  'menu.logout': 'Выйти',
  'menu.language': 'Язык',
  'menu.language.ru': 'Русский',
  'menu.language.en': 'English',

  'news.title': 'Последние новости',

  'notif.copiedTitle': 'Скопировано в буфер обмена!',
  'notif.copiedDesc': 'Тексты новостей скопированы в буфер обмена.',

  'error.prefix': 'Ошибка',
  'copy.error': 'Не удалось скопировать текст в буфер обмена',

  'pages.edits': 'Правки',

  // EditDigest
  'edit.title': 'Правки дайджеста',
  'edit.placeholder': 'Вставьте строку вида [строка1, строка2] или по одной записи на строку',
  'edit.process': 'Обработать',
  'edit.empty': 'Список пуст',
  'common.back': 'Назад',
};

const en: Dict = {
  'header.greeting': 'Hi, {name}',
  'header.openMenuAria': 'Open menu',

  'menu.title': 'Menu',
  'menu.lastNews': 'Last news',
  'menu.logout': 'Logout',
  'menu.language': 'Language',
  'menu.language.ru': 'Русский',
  'menu.language.en': 'English',

  'news.title': 'Last News',

  'notif.copiedTitle': 'Copied to clipboard!',
  'notif.copiedDesc': 'The news texts have been copied to your clipboard.',

  'error.prefix': 'Error',
  'copy.error': 'Failed to copy text to clipboard',

  'pages.edits': 'Edits',

  // EditDigest
  'edit.title': 'Digest edits',
  'edit.placeholder': 'Paste a string like [item1, item2] or one per line',
  'edit.process': 'Process',
  'edit.empty': 'List is empty',
  'common.back': 'Back',
};

const DICTS: Record<Lang, Dict> = { ru, en };

const LS_KEY = 'app_lang';

export interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'ru';
    const saved = window.localStorage.getItem(LS_KEY);
    return (saved === 'en' || saved === 'ru') ? (saved as Lang) : 'ru';
    
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LS_KEY, lang);
    }
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    const dict = DICTS[lang] || ru;
    let str = dict[key] ?? key;
    if (params) {
      str = str.replace(/\{(\w+)\}/g, (_, k) =>
        Object.prototype.hasOwnProperty.call(params, k) ? String(params[k]) : `{${k}}`
      );
    }
    return str;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
