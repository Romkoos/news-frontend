export interface ParsedRegex {
  pattern: string;
  flags: string; // like 'giu'
  original: string; // original input
  fromDelimited: boolean; // was it /pattern/flags form
}

// Parses input string possibly in /pattern/flags form; otherwise treats whole as pattern
// Ensures 'u' is present in flags for Unicode safety by default.
export function parseRegexInput(input: string): ParsedRegex {
  const trimmed = input.trim();
  const m = /^\/(.*)\/([a-z]*)$/.exec(trimmed);
  if (m) {
    const pattern = m[1];
    const rawFlags = m[2] ?? '';
    const flags = ensureUniqueFlags(addDefaultU(rawFlags));
    return { pattern, flags, original: input, fromDelimited: true };
  }
  // not delimited — treat full as pattern, default 'u'
  return { pattern: input, flags: 'u', original: input, fromDelimited: false };
}

export function addDefaultU(flags: string): string {
  return flags.includes('u') ? flags : flags + 'u';
}

export function ensureUniqueFlags(flags: string): string {
  const set = new Set<string>();
  for (const ch of flags) set.add(ch);
  return Array.from(set).join('');
}
