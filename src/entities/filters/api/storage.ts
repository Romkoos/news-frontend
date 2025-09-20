import { http } from '../../../shared/api/http';
import type { Filter, FilterAction, FilterInput, MatchType, Settings, UUID } from '../model/types';

// --- Client-side helpers (validation, matching) ---
function isInt(n: unknown) {
  return typeof n === 'number' && Number.isInteger(n);
}

function validateRegex(pattern: string) {
  try {
    // Unicode flag for Hebrew letters etc.
    // eslint-disable-next-line no-new
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

// --- API-backed CRUD ---
export async function getFilters(): Promise<Filter[]> {
  return http<Filter[]>('/filters', { auth: true });
}

export async function createFilter(input: FilterInput): Promise<Filter> {
  // Validate on client to preserve error UX
  const existing = await getFilters();
  const payload: FilterInput = {
    keyword: input.keyword.trim(),
    action: input.action,
    priority: input.priority,
    matchType: normalize(input).matchType,
    active: normalize(input).active,
    notes: input.notes,
  };
  ensureValid(payload, existing);
  return http<Filter>('/filters', { method: 'POST', body: payload, auth: true });
}

export async function updateFilter(id: UUID, patch: Partial<FilterInput>): Promise<Filter> {
  // Merge with current to validate duplicates and ranges
  const list = await getFilters();
  const prev = list.find(f => f.id === id);
  if (!prev) throw new Error('notfound');
  const merged: Filter = {
    ...prev,
    ...patch,
    matchType: patch.matchType ?? prev.matchType,
    active: patch.active ?? prev.active,
  };
  const inputForValidation: FilterInput = {
    keyword: merged.keyword,
    action: merged.action,
    priority: merged.priority,
    matchType: merged.matchType,
    active: merged.active,
    notes: merged.notes,
  };
  ensureValid(inputForValidation, list, id);
  return http<Filter>(`/filters/${id}`, { method: 'PATCH', body: patch, auth: true });
}

export async function deleteFilter(id: UUID): Promise<void> {
  await http<void>(`/filters/${id}`, { method: 'DELETE', auth: true });
}

export async function getSettings(): Promise<Settings> {
  try {
    return await http<Settings>('/filters/settings', { auth: true });
  } catch {
    return { defaultAction: 'moderation' };
  }
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  return http<Settings>('/filters/settings', { method: 'PATCH', body: patch, auth: true });
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
  // Compute based on server data
  const list = await getFilters();
  const active = list.filter(f => f.active ?? true);
  const matches = active.filter(f => testMatch(text, f.keyword, f.matchType));
  if (matches.length === 0) {
    const settings = await getSettings();
    return settings.defaultAction;
  }
  const top = matches.reduce((acc, curr) => (curr.priority > acc.priority ? curr : acc));
  return top.action;
}
