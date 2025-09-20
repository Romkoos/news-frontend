export type RegexTokenType =
  | 'boundary'
  | 'charClass'
  | 'group'
  | 'quantifier'
  | 'alternation'
  | 'escape'
  | 'literal';

export interface RegexToken {
  type: RegexTokenType;
  text: string;            // original snippet for this token
  label?: string;          // short label for chip
  tooltip?: string;        // extended description
}

const BOUNDARY_MAP: Record<string, { label: string; tooltip: string }> = {
  '^': { label: '^', tooltip: 'start of string' },
  '$': { label: '$', tooltip: 'end of string' },
  '\\b': { label: '\\b', tooltip: 'word boundary' },
  '\\B': { label: '\\B', tooltip: 'non-word boundary' },
};

const ESCAPE_MAP: Record<string, { label: string; tooltip: string }> = {
  '\\d': { label: 'digit', tooltip: 'digit [0-9]' },
  '\\D': { label: 'not digit', tooltip: 'not a digit' },
  '\\s': { label: 'space', tooltip: 'whitespace' },
  '\\S': { label: 'not space', tooltip: 'not whitespace' },
  '\\w': { label: 'word', tooltip: 'word character [A-Za-z0-9_]' },
  '\\W': { label: 'not word', tooltip: 'not a word character' },
  '\\t': { label: 'tab', tooltip: 'tab' },
  '\\n': { label: 'newline', tooltip: 'newline' },
  '\\r': { label: 'cr', tooltip: 'carriage return' },
};

function isQuantifierChar(ch: string): boolean {
  return ch === '?' || ch === '+' || ch === '*';
}

function readUntilBalanced(src: string, i: number, open: string, close: string): { end: number } | null {
  let depth = 0;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (c === '\\') { // skip escaped next char
      j++;
      continue;
    }
    if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return { end: j };
    }
  }
  return null;
}

export function tokenizeRegex(pattern: string): RegexToken[] {
  const tokens: RegexToken[] = [];
  let i = 0;
  while (i < pattern.length) {
    const ch = pattern[i];

    // Escaped sequences
    if (ch === '\\') {
      const next = pattern[i + 1] ?? '';
      const esc = `\\${next}`;
      const mapped = ESCAPE_MAP[esc];
      if (mapped) {
        tokens.push({ type: 'escape', text: esc, label: mapped.label, tooltip: mapped.tooltip });
        i += 2;
        continue;
      }
      // Unicode property classes like \p{L}
      if (next === 'p' || next === 'P') {
        // try read \p{...}
        const braceStart = i + 2;
        if (pattern[braceStart] === '{') {
          const end = pattern.indexOf('}', braceStart + 1);
          if (end !== -1) {
            const body = pattern.slice(i, end + 1);
            tokens.push({ type: 'charClass', text: body, label: `\\${next}{…}`, tooltip: next === 'p' ? 'Unicode property class' : 'Negated Unicode property class' });
            i = end + 1;
            continue;
          }
        }
      }
      // generic escape fallback
      tokens.push({ type: 'escape', text: esc, label: esc, tooltip: 'escaped char' });
      i += 2;
      continue;
    }

    // Boundaries ^, $
    if (ch === '^' || ch === '$') {
      const key = ch;
      const mapped = BOUNDARY_MAP[key];
      tokens.push({ type: 'boundary', text: key, label: mapped?.label ?? key, tooltip: mapped?.tooltip ?? 'boundary' });
      i++;
      continue;
    }

    // Alternation
    if (ch === '|') {
      tokens.push({ type: 'alternation', text: '|', label: '|', tooltip: 'alternation' });
      i++;
      continue;
    }

    // Character class [ ... ]
    if (ch === '[') {
      const bal = readUntilBalanced(pattern, i, '[', ']');
      if (bal) {
        const text = pattern.slice(i, bal.end + 1);
        tokens.push({ type: 'charClass', text, label: '[]', tooltip: 'character class' });
        i = bal.end + 1;
        // quantifier after class
        if (i < pattern.length && (isQuantifierChar(pattern[i]) || pattern[i] === '{')) {
          const { consumed, label, text: qtext } = readQuantifier(pattern, i);
          tokens.push({ type: 'quantifier', text: qtext, label, tooltip: 'quantifier' });
          i += consumed;
        }
        continue;
      }
      // unmatched [ -> treat as literal
    }

    // Group ( ... ) including lookarounds
    if (ch === '(') {
      const bal = readUntilBalanced(pattern, i, '(', ')');
      if (bal) {
        const text = pattern.slice(i, bal.end + 1);
        // detect group type
        let label = '()';
        let tooltip = 'group';
        if (text.startsWith('(?=')) { label = 'lookahead'; tooltip = 'positive lookahead'; }
        else if (text.startsWith('(?!')) { label = 'nlookahead'; tooltip = 'negative lookahead'; }
        else if (text.startsWith('(?<=')) { label = 'lookbehind'; tooltip = 'positive lookbehind'; }
        else if (text.startsWith('(?<!')) { label = 'nlookbehind'; tooltip = 'negative lookbehind'; }
        else if (text.startsWith('(?:')) { label = '?:'; tooltip = 'non-capturing group'; }
        tokens.push({ type: 'group', text, label, tooltip });
        i = bal.end + 1;
        // trailing quantifier
        if (i < pattern.length && (isQuantifierChar(pattern[i]) || pattern[i] === '{')) {
          const { consumed, label: ql, text: qtext } = readQuantifier(pattern, i);
          tokens.push({ type: 'quantifier', text: qtext, label: ql, tooltip: 'quantifier' });
          i += consumed;
        }
        continue;
      }
      // unmatched ( -> literal
    }

    // Quantifiers on single char/literal
    if (isQuantifierChar(ch) || ch === '{') {
      const { consumed, label, text: qtext } = readQuantifier(pattern, i);
      tokens.push({ type: 'quantifier', text: qtext, label, tooltip: 'quantifier' });
      i += consumed;
      continue;
    }

    // Literal char sequence until special
    let j = i;
    const specials = new Set(['\\', '^', '$', '|', '[', ']', '(', ')', '?', '+', '*', '{', '}']);
    while (j < pattern.length && !specials.has(pattern[j])) j++;
    const lit = pattern.slice(i, j);
    if (lit.length > 0) {
      tokens.push({ type: 'literal', text: lit, label: lit, tooltip: 'literal text' });
      i = j;
      // possible following quantifier
      if (i < pattern.length && (isQuantifierChar(pattern[i]) || pattern[i] === '{')) {
        const { consumed, label, text: qtext } = readQuantifier(pattern, i);
        tokens.push({ type: 'quantifier', text: qtext, label, tooltip: 'quantifier' });
        i += consumed;
      }
      continue;
    }

    // Fallback: consume one char
    tokens.push({ type: 'literal', text: ch, label: ch, tooltip: 'char' });
    i++;
  }
  return tokens;
}

function readQuantifier(src: string, i: number): { consumed: number; label: string; text: string } {
  const ch = src[i];
  if (ch === '?' || ch === '+' || ch === '*') {
    const map: Record<string, string> = { '?': 'optional', '+': '1+ times', '*': '0+ times' };
    return { consumed: 1, label: map[ch], text: ch };
  }
  if (ch === '{') {
    let j = i + 1;
    while (j < src.length && src[j] !== '}') j++;
    if (src[j] === '}') {
      const content = src.slice(i + 1, j);
      let label = `{${content}}`;
      const parts = content.split(',');
      if (parts.length === 1) label = `exactly ${parts[0]}`;
      else if (parts[0] === '') label = `up to ${parts[1]}`;
      else if (parts[1] === '') label = `at least ${parts[0]}`;
      else label = `from ${parts[0]} to ${parts[1]}`;
      return { consumed: j - i + 1, label, text: `{${content}}` };
    }
  }
  return { consumed: 1, label: 'quantifier', text: src[i] };
}
