import { useMemo, useState } from 'react';
import { Button, Flex, Popover, Segmented, Tag, Typography } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { parseRegexInput } from './parse';
import { toSemanticHebrew } from './semantic';

export type RegexMode = 'readable' | 'original';

export interface RegexViewerProps {
  input: string; // original keyword, may be \/...\/flags or plain
  mode?: RegexMode;
  onModeChange?: (m: RegexMode) => void;
  compact?: boolean;         // render compact with +N overflow
  maxVisible?: number;       // number of visible chips in compact mode
  showModeSwitch?: boolean;  // show Segmented toggle
  showCopy?: boolean;        // show copy button in original mode
}

const { Text } = Typography;


export default function RegexViewer(props: RegexViewerProps) {
  const { input, compact, maxVisible = 6, showModeSwitch = true, showCopy = true } = props;
  const [internalMode, setInternalMode] = useState<RegexMode>(props.mode ?? 'readable');
  const mode = props.mode ?? internalMode;

  const parsed = useMemo(() => parseRegexInput(input), [input]);

  const handleCopy = async () => {
    const text = parsed.fromDelimited ? parsed.original : `/${parsed.pattern}/${parsed.flags}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  // Build semantic chips only
  const semantic = useMemo(() => toSemanticHebrew(parsed.pattern), [parsed.pattern]);

  function renderSemanticChips() {
    return semantic.chips.map((c, idx) => (
      <Tag key={c.key ?? `sem-${idx}`} color={c.color ?? 'default'} style={{ marginInlineEnd: 4, marginBottom: 4 }}>
        <span dir={c.dir}>{c.content}</span>
      </Tag>
    ));
  }

  const readableChips = renderSemanticChips().reverse();

  const contentReadable = (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {compact && readableChips.length > maxVisible ? (
          <>
            {readableChips.slice(0, maxVisible)}
            <Popover
              content={<div style={{ maxWidth: 360, display: 'flex', flexWrap: 'wrap' }}>{readableChips.slice(maxVisible)}</div>}
            >
              <Tag color="blue">+{readableChips.length - maxVisible}</Tag>
            </Popover>
          </>
        ) : readableChips}
      </div>
    </div>
  );

  const contentOriginal = (
    <Flex align="center" gap={8} wrap>
      <Text code style={{ userSelect: 'text' }}>
        {parsed.fromDelimited ? parsed.original : `/${parsed.pattern}/${parsed.flags}`}
      </Text>
      {showCopy && (
        <Button size="small" icon={<CopyOutlined />} onClick={handleCopy} />
      )}
    </Flex>
  );

  return (
    <Flex vertical gap={6}>
      {showModeSwitch && (
        <Segmented
          size="small"
          value={mode}
          onChange={(v) => {
            const m = v as RegexMode;
            setInternalMode(m);
            if (props.onModeChange) props.onModeChange(m);
          }}
          options={[
            { label: 'Readable', value: 'readable' },
            { label: 'Original', value: 'original' },
          ]}
        />
      )}
      {mode === 'readable' ? (semantic.ok ? contentReadable : contentOriginal) : contentOriginal}
    </Flex>
  );
}
