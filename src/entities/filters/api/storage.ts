import type { Filter, FilterInput, MatchType, Settings, UUID, FilterAction } from '../model/types';

function uuidv4(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Fallback RFC4122 v4-like
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const LS_FILTERS = 'filters_list_v1';
const LS_SETTINGS = 'filters_settings_v1';

function readFilters(): Filter[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LS_FILTERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Filter[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeFilters(filters: Filter[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LS_FILTERS, JSON.stringify(filters));
}

function readSettings(): Settings {
  if (typeof window === 'undefined') return { defaultAction: 'moderation' };
  try {
    const raw = window.localStorage.getItem(LS_SETTINGS);
    if (!raw) return { defaultAction: 'moderation' };
    const parsed = JSON.parse(raw) as Settings;
    if (!parsed || !parsed.defaultAction) return { defaultAction: 'moderation' };
    return parsed;
  } catch {
    return { defaultAction: 'moderation' };
  }
}

function writeSettings(settings: Settings) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
}

function isInt(n: unknown) {
  return typeof n === 'number' && Number.isInteger(n);
}

function validateRegex(pattern: string) {
  try {
    new RegExp(pattern, 'u');
    return true;
  } catch {
    return false;
  }
}

function normalize(input: Partial<FilterInput>): Required<Pick<Filter, 'matchType' | 'active'>> {
  return {
    matchType: input.matchType ?? 'substring',
    active: input.active ?? true,
  };
}

function ensureValid(input: FilterInput, existing: Filter[], selfId?: UUID) {
  const { keyword, priority, matchType = 'substring', active = true } = input;
  if (!keyword || keyword.trim().length < 2) {
    throw new Error('keyword:required');
  }
  if (!isInt(priority) || priority < 1 || priority > 1000) {
    throw new Error('priority:range');
  }
  if (matchType === 'regex' && !validateRegex(keyword)) {
    throw new Error('regex:invalid');
  }
  if (active) {
    const dup = existing.find(
      f => (f.active ?? true) && f.keyword === keyword && (f.matchType ?? 'substring') === matchType && f.id !== selfId
    );
    if (dup) {
      throw new Error('duplicate:active');
    }
  }
}

export async function getFilters(): Promise<Filter[]> {
  return readFilters();
}

export async function createFilter(input: FilterInput): Promise<Filter> {
  const list = readFilters();
  ensureValid(input, list);
  const { matchType, active } = normalize(input);
  const now = new Date().toISOString();
  const item: Filter = {
    id: uuidv4(),
    keyword: input.keyword.trim(),
    action: input.action,
    priority: input.priority,
    matchType,
    active,
    notes: input.notes,
    updatedAt: now,
  };
  const next = [...list, item];
  writeFilters(next);
  return item;
}

export async function updateFilter(id: UUID, patch: Partial<FilterInput>): Promise<Filter> {
  const list = readFilters();
  const idx = list.findIndex(f => f.id === id);
  if (idx === -1) throw new Error('notfound');
  const prev = list[idx];
  const nextCandidate: Filter = {
    ...prev,
    ...patch,
    matchType: patch.matchType ?? prev.matchType,
    active: patch.active ?? prev.active,
  };
  const input: FilterInput = {
    keyword: nextCandidate.keyword,
    action: nextCandidate.action,
    priority: nextCandidate.priority,
    matchType: nextCandidate.matchType,
    active: nextCandidate.active,
    notes: nextCandidate.notes,
  };
  ensureValid(input, list, id);
  const updated: Filter = { ...nextCandidate, updatedAt: new Date().toISOString() };
  const next = [...list];
  next[idx] = updated;
  writeFilters(next);
  return updated;
}

export async function deleteFilter(id: UUID): Promise<void> {
  const list = readFilters();
  writeFilters(list.filter(f => f.id !== id));
}

export async function bulkUpdateActive(ids: UUID[], active: boolean): Promise<void> {
  const list = readFilters();
  const next = list.map(f => {
    if (!ids.includes(f.id)) return f;
    const candidate: Filter = { ...f, active };
    // Only check duplicate if activating
    if (active) {
      ensureValid({
        keyword: candidate.keyword,
        action: candidate.action,
        priority: candidate.priority,
        matchType: candidate.matchType,
        active: candidate.active,
        notes: candidate.notes,
      }, list, candidate.id);
    }
    return { ...candidate, updatedAt: new Date().toISOString() };
  });
  writeFilters(next);
}

export async function bulkDelete(ids: UUID[]): Promise<void> {
  const list = readFilters();
  writeFilters(list.filter(f => !ids.includes(f.id)));
}

export async function getSettings(): Promise<Settings> {
  return readSettings();
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  const curr = readSettings();
  const next = { ...curr, ...patch };
  writeSettings(next);
  return next;
}

export function testMatch(text: string, keyword: string, matchType: MatchType | undefined): boolean {
  const mt = matchType ?? 'substring';
  if (mt === 'regex') {
    try {
      const re = new RegExp(keyword, 'u');
      return re.test(text);
    } catch {
      return false;
    }
  }
  return text.includes(keyword);
}

export async function resolveAction(text: string): Promise<FilterAction> {
  const list = readFilters();
  const active = list.filter(f => f.active ?? true);
  const matches = active.filter(f => testMatch(text, f.keyword, f.matchType));
  if (matches.length === 0) {
    const settings = readSettings();
    return settings.defaultAction;
  }
  const top = matches.reduce((acc, curr) => (curr.priority > acc.priority ? curr : acc));
  return top.action;
}
