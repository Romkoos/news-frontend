import type { ReactNode } from 'react';

export interface SemanticChip {
  content: ReactNode;
  color?: string; // antd Tag color
  dir?: 'rtl' | 'ltr';
  key?: string;
}

export interface SemanticResult {
  ok: boolean;
  chips: SemanticChip[];
}

// Helpers
function hasHebrew(s: string): boolean {
  return /[\u0590-\u05FF]/u.test(s);
}

function joinWithFullwidthSlash(parts: string[]): string {
  const cleaned = parts.filter(Boolean);
  // Use fullwidth slash to render nicer in RTL
  return cleaned.join('／');
}

function readBalanced(src: string, i: number, open: string, close: string): number {
  let depth = 0;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (c === '\\') { j++; continue; }
    if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return j;
    }
  }
  return -1;
}

// Strip external lookarounds, anchors and word boundaries at edges
function stripOuterTechnical(input: string): string {
  let s = input.trim();
  // remove ^ and $ at edges
  if (s.startsWith('^')) s = s.slice(1);
  if (s.endsWith('$')) s = s.slice(0, -1);
  // remove start lookarounds / boundaries repeatedly
  const startPatterns = [/^\(\?[:!=<][^)]*\)/, /^\\[bB]/];
  let changed = true;
  while (changed) {
    changed = false;
    for (const re of startPatterns) {
      const m = s.match(re as RegExp);
      if (m && m.index === 0) {
        s = s.slice(m[0].length);
        changed = true;
      }
    }
  }
  // remove end lookarounds / boundaries
  const endPatterns = [/\(\?[:!=<][^)]*\)$/ , /\\[bB]$/];
  changed = true;
  while (changed) {
    changed = false;
    for (const re of endPatterns) {
      const m = s.match(re as RegExp);
      if (m) {
        s = s.slice(0, s.length - m[0].length);
        changed = true;
      }
    }
  }
  return s;
}

// Build semantic chips (Hebrew lexemes only). Hide technical syntax and quantifiers.
export function toSemanticHebrew(pattern: string): SemanticResult {
  const src = stripOuterTechnical(pattern);
  if (!src) return { ok: false, chips: [] };

  const chips: SemanticChip[] = [];

  let i = 0;

  // 1) Optional or required prefix ה (consume quantifier silently)
  if (src[i] === 'ה') {
    chips.push({ content: 'ה', dir: 'rtl' });
    i++;
    if (src[i] === '?') i++; // hide quantifier
  }

  // Helper to push a Hebrew literal run as one chip
  function readHebrewRun(): string {
    const start = i;
    while (i < src.length && /[\u0590-\u05FF]/u.test(src[i])) i++;
    return src.slice(start, i);
  }

  // Iterate through remaining pattern, extracting lexemes in order they appear
  while (i < src.length) {
    const ch = src[i];

    // Hebrew literal base sequence
    if (/[\u0590-\u05FF]/u.test(ch)) {
      const run = readHebrewRun();
      if (run) chips.push({ content: run, dir: 'rtl' });
      continue;
    }

    // Character class [ ... ] -> letters joined by fullwidth slash
    if (ch === '[') {
      const end = readBalanced(src, i, '[', ']');
      if (end !== -1) {
        const content = src.slice(i + 1, end);
        // extract only visible literal letters (prefer Hebrew)
        const letters = Array.from(new Set((content.match(/[\u0590-\u05FF]/gu) ?? [])));
        const value = letters.length > 0 ? joinWithFullwidthSlash(letters) : '';
        if (value) chips.push({ content: value, dir: 'rtl' });
        i = end + 1;
        // skip following quantifier quietly
        if (i < src.length && ('?+*'.includes(src[i]) || src[i] === '{')) {
          if (src[i] === '{') {
            while (i < src.length && src[i] !== '}') i++;
            if (src[i] === '}') i++;
          } else {
            i++;
          }
        }
        continue;
      }
      // unmatched -> skip
      i++;
      continue;
    }

    // Group ( ... ) possibly non-capturing (?:...) with alternatives; join with | and hide quantifier
    if (ch === '(') {
      const end = readBalanced(src, i, '(', ')');
      if (end !== -1) {
        let inner = src.slice(i + 1, end);
        // strip leading ?: and any lookaround prefix inside
        inner = inner.replace(/^\?[:!=<]/, '');
        if (inner.includes('|')) {
          const parts = inner.split('|').map(s => s.trim()).filter(Boolean);
          // Keep only visible literal Hebrew in each part
          const displayParts = parts.map(p => {
            // extract only Hebrew letters within the variant
            const letters = p.match(/[\u0590-\u05FF]/gu);
            return letters ? letters.join('') : '';
          }).filter(Boolean);
          if (displayParts.length > 0) {
            chips.push({ content: displayParts.join(' | '), dir: 'rtl' });
          }
        } else {
          // plain group without | — treat as literal Hebrew sequence
          const letters = inner.match(/[\u0590-\u05FF]/gu);
          const val = letters ? letters.join('') : '';
          if (val) chips.push({ content: val, dir: 'rtl' });
        }
        i = end + 1;
        // skip trailing quantifier
        if (i < src.length && ('?+*'.includes(src[i]) || src[i] === '{')) {
          if (src[i] === '{') {
            while (i < src.length && src[i] !== '}') i++;
            if (src[i] === '}') i++;
          } else {
            i++;
          }
        }
        continue;
      }
      // unmatched -> skip one
      i++;
      continue;
    }

    // Skip escapes, dots, and other technical tokens silently
    if (ch === '\\') { i += 2; continue; }
    if ('^$|.+*?{}'.includes(ch)) { i++; continue; }

    // Otherwise advance
    i++;
  }

  // Determine success: at least one Hebrew chip
  const ok = chips.some(c => typeof c.content === 'string' && hasHebrew(String(c.content)));
  return ok ? { ok: true, chips } : { ok: false, chips: [] };
}
