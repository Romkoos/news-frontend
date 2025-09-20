// Maps server/client validation error markers to localized messages for Filters domain
// FSD: domain-specific helper under entities/filters/lib
export function mapFilterError(t: (key: string, params?: Record<string, string | number>) => string, e: unknown): string {
  const s = String(e);
  if (s.includes('keyword:required')) return t('filters.validation.keyword');
  if (s.includes('priority:range')) return t('filters.validation.priority');
  if (s.includes('duplicate:active')) return t('filters.validation.duplicate');
  if (s.includes('regex:invalid')) return t('filters.validation.regex');
  // passthrough
  return s;
}
