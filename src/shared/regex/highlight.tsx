import React from 'react';
import { Typography } from 'antd';
import { parseRegexInput, addDefaultU, ensureUniqueFlags } from './parse';

const { Text } = Typography;

export interface HighlightResult {
  nodes: React.ReactNode;
  count: number;
}

export function highlightMatches(input: string, regexInput: string): HighlightResult {
  if (!regexInput) return { nodes: input, count: 0 };
  try {
    const parsed = parseRegexInput(regexInput);
    // ensure global flag to find all matches; keep other flags
    const flags = ensureUniqueFlags(addDefaultU(parsed.flags + 'g'));
    const re = new RegExp(parsed.pattern, flags);
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let m: RegExpExecArray | null;
    let count = 0;
    while ((m = re.exec(input)) !== null) {
      const start = m.index;
      const end = start + (m[0]?.length ?? 0);
      if (end === start) {
        // zero-length match safeguard: advance by 1 to avoid infinite loop
        re.lastIndex = start + 1;
        continue;
      }
      if (start > lastIndex) {
        parts.push(input.slice(lastIndex, start));
      }
      parts.push(<Text key={`m-${start}-${end}`} mark>{input.slice(start, end)}</Text>);
      lastIndex = end;
      count++;
    }
    if (lastIndex < input.length) parts.push(input.slice(lastIndex));
    return { nodes: <>{parts}</>, count };
  } catch {
    return { nodes: input, count: 0 };
  }
}
