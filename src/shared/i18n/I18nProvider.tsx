/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { lsGet, lsSet } from '../storage/persist';

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
  'menu.filters': 'Фильтры',
  'menu.moderation': 'Модерация',
  'menu.settings': 'Настройки',

  'news.title': 'Последние новости',

    // Moderation
    'moderation.title': 'Модерация',
    'moderation.search': 'Поиск по тексту',
    'moderation.refresh': 'Обновить',
    'moderation.auto': 'Автообновление',
    'moderation.empty': 'Нет новостей на модерации',
    'moderation.approve': 'Опубликовать',
    'moderation.reject': 'Отклонить',
    'moderation.confirm.approve': 'Опубликовать?',
    'moderation.confirm.reject': 'Отклонить и удалить?',
    'moderation.toast.approved': 'Опубликовано',
    'moderation.toast.rejected': 'Отклонено',
    'moderation.details.openFilter': 'Открыть фильтр',
    'moderation.found': 'Найдено {count}',

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
  'edit.item.edit': 'Редактировать',
  'edit.item.save': 'Сохранить',
  'edit.item.cancel': 'Отмена',
  'common.back': 'Назад',

  // Filters
  'filters.title': 'Фильтры',
  'filters.add': 'Добавить',
  'filters.search': 'Поиск по ключевому слову',
  'filters.action': 'Действие',
  'filters.action.publish': 'публиковать',
  'filters.action.reject': 'отклонить',
  'filters.action.moderation': 'на модерацию',
  'filters.action.all': 'Все',
  'filters.activeOnly': 'Только активные',
  'filters.columns.keyword': 'Ключевое слово',
  'filters.columns.action': 'Действие',
  'filters.columns.priority': 'Приоритет',
  'filters.columns.match': 'Совпадение',
  'filters.columns.active': 'Активен',
  'filters.columns.updated': 'Обновлено',
  'filters.columns.actions': 'Действия',
  'filters.match.substring': 'подстрока',
  'filters.match.regex': 'регулярное выражение',
  'filters.edit': 'Редактировать',
  'filters.delete': 'Удалить',
  'filters.bulk.activate': 'Активировать',
  'filters.bulk.deactivate': 'Деактивировать',
  'filters.bulk.delete': 'Удалить',
  'filters.confirmDelete': 'Удалить фильтр?',
  'filters.saved': 'Сохранено',
  'filters.validation.keyword': 'Ключевое слово обязательно (мин. 2 символа)',
  'filters.validation.priority': 'Приоритет 1…1000',
  'filters.validation.duplicate': 'Дубликат активного фильтра (keyword, matchType)',
  'filters.validation.regex': 'Некорректное регулярное выражение',

  // Modal
  'modal.title.add': 'Добавить фильтр',
  'modal.title.edit': 'Редактировать фильтр',
  'modal.keyword': 'Ключевое слово',
  'modal.action': 'Действие',
  'modal.priority': 'Приоритет',
  'modal.matchType': 'Тип совпадения',
  'modal.active': 'Активен',
  'modal.notes': 'Заметки',
  'modal.save': 'Сохранить',
  'modal.cancel': 'Отмена',
  'modal.tester.title': 'Проверка',
  'modal.tester.text': 'Текст новости',
  'modal.tester.check': 'Проверить совпадение',
  'modal.tester.match': 'совпадает',
  'modal.tester.noMatch': 'не совпадает',

    // Regex UI
    'regex.pattern': 'Паттерн',
    'regex.matches': 'Совпадений: {count}',

  // Settings
  'settings.title': 'Настройки',
  'settings.defaultAction': 'Действие по умолчанию',
  'settings.save': 'Сохранить',

  'common.ok': 'ОК',
  'common.cancel': 'Отмена',
  'common.unknown': 'неизвестно',
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
  'menu.filters': 'Filters',
  'menu.moderation': 'Moderation',
  'menu.settings': 'Settings',

  'news.title': 'Last News',

    // Moderation
    'moderation.title': 'Moderation',
    'moderation.search': 'Search in text',
    'moderation.refresh': 'Refresh',
    'moderation.auto': 'Auto-refresh',
    'moderation.empty': 'No items for moderation',
    'moderation.approve': 'Approve',
    'moderation.reject': 'Reject',
    'moderation.confirm.approve': 'Publish?',
    'moderation.confirm.reject': 'Reject and delete?',
    'moderation.toast.approved': 'Approved',
    'moderation.toast.rejected': 'Rejected',
    'moderation.details.openFilter': 'Open filter',
    'moderation.found': 'Found {count}',

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
  'edit.item.edit': 'Edit',
  'edit.item.save': 'Save',
  'edit.item.cancel': 'Cancel',
  'common.back': 'Back',

  // Filters
  'filters.title': 'Filters',
  'filters.add': 'Add',
  'filters.search': 'Search by keyword',
  'filters.action': 'Action',
  'filters.action.publish': 'publish',
  'filters.action.reject': 'reject',
  'filters.action.moderation': 'moderation',
  'filters.action.all': 'All',
  'filters.activeOnly': 'Only active',
  'filters.columns.keyword': 'Keyword',
  'filters.columns.action': 'Action',
  'filters.columns.priority': 'Priority',
  'filters.columns.match': 'Match',
  'filters.columns.active': 'Active',
  'filters.columns.updated': 'Updated',
  'filters.columns.actions': 'Actions',
  'filters.match.substring': 'substring',
  'filters.match.regex': 'regex',
  'filters.edit': 'Edit',
  'filters.delete': 'Delete',
  'filters.bulk.activate': 'Activate',
  'filters.bulk.deactivate': 'Deactivate',
  'filters.bulk.delete': 'Delete',
  'filters.confirmDelete': 'Delete filter?',
  'filters.saved': 'Saved',
  'filters.validation.keyword': 'Keyword is required (min 2 chars)',
  'filters.validation.priority': 'Priority 1…1000',
  'filters.validation.duplicate': 'Duplicate active filter (keyword, matchType)',
  'filters.validation.regex': 'Invalid regular expression',

  // Modal
  'modal.title.add': 'Add filter',
  'modal.title.edit': 'Edit filter',
  'modal.keyword': 'Keyword',
  'modal.action': 'Action',
  'modal.priority': 'Priority',
  'modal.matchType': 'Match type',
  'modal.active': 'Active',
  'modal.notes': 'Notes',
  'modal.save': 'Save',
  'modal.cancel': 'Cancel',
  'modal.tester.title': 'Tester',
  'modal.tester.text': 'News text',
  'modal.tester.check': 'Check match',
  'modal.tester.match': 'match',
  'modal.tester.noMatch': 'no match',

    // Regex UI
    'regex.pattern': 'Pattern',
    'regex.matches': 'Matches: {count}',

  // Settings
  'settings.title': 'Settings',
  'settings.defaultAction': 'Default action',
  'settings.save': 'Save',

  'common.ok': 'OK',
  'common.cancel': 'Cancel',
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
    const saved = lsGet(LS_KEY);
    return (saved === 'en' || saved === 'ru') ? (saved as Lang) : 'ru';
  });

  useEffect(() => {
    lsSet(LS_KEY, lang);
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
