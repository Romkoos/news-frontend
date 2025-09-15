import { useState } from 'react';
import { Button, Card, Flex, Input, Space, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, DeleteOutlined, RollbackOutlined } from '@ant-design/icons';
import { useI18n } from '../../../shared/i18n/I18nProvider';

const { Text } = Typography;
const { TextArea } = Input;

interface EditDigestProps {
  onBack?: () => void;
}

// Parse helper: supports
// - [item1, item2, item3]
// - JSON-like ["item1", "item2"] or ['item1', 'item2']
// - multiline input (one item per line)
function parseInputToArray(raw: string): string[] {
    const s0 = (raw ?? '').trim();
    if (!s0) return [];

    // 1) Снимем типовые экранирования из копипаста (markdown/чат)
    //    \[ ... \]  -> [ ... ]
    //    \~         -> ~
    let s = s0
        .replace(/\\\[/g, '[')
        .replace(/\\\]/g, ']')
        .replace(/\\~/g, '~');

    // 2) Если это массив — сначала пробуем честный JSON.parse
    if (s.startsWith('[') && s.endsWith(']')) {
        try {
            // иногда приходят одиночные кавычки — заменим их на двойные ТОЛЬКО на верхнем уровне
            // простой хак: если нет двойных кавычек внутри, попробуем заменить одинарные
            if (!/"/.test(s) && /'/.test(s)) {
                s = s.replace(/'/g, '"');
            }
            const arr = JSON.parse(s);
            if (Array.isArray(arr)) {
                return arr.map((x) => String(x).trim()).filter(Boolean);
            }
        } catch {
            // 3) Fallback: вытащим все строки в двойных кавычках на верхнем уровне
            //    Допускаем экранированные кавычки внутри ("...\"...").
            const out: string[] = [];
            const re = /"([^"\\]*(\\.[^"\\]*)*)"/g;
            let m: RegExpExecArray | null;
            while ((m = re.exec(s)) !== null) {
                try {
                    // безопасно распакуем как JSON-строку (сохранит \n, \", и т.п.)
                    out.push(JSON.parse(m[0]));
                } catch {
                    // на всякий случай — необработанная строка без JSON-распаковки
                    out.push(m[1].replace(/\\"/g, '"'));
                }
            }
            if (out.length) return out.map((x) => x.trim()).filter(Boolean);
        }
    }

    // 4) Иначе — просто многострочный ввод (одна новость на строку)
    return s
        .split(/\r?\n/)
        .map((x) => x.trim())
        .filter(Boolean);
}


export default function EditDigest({ onBack }: EditDigestProps) {
  const { t } = useI18n();
  const [rawInput, setRawInput] = useState('');
  const [items, setItems] = useState<string[]>([]);
  const [hidden, setHidden] = useState<boolean>(false);

  const isEmpty = items.length === 0;

  const handleProcess = () => {
    setHidden(true)
    const arr = parseInputToArray(rawInput);
    setItems(arr);
  };

  const moveUp = (idx: number) => {
    if (idx <= 0) return;
    setItems((prev) => {
      const next = prev.slice();
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveDown = (idx: number) => {
    setItems((prev) => {
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = prev.slice();
      [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
      return next;
    });
  };

  const removeAt = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <Flex gap="middle" vertical style={{ padding: 16 }}>
      <Space align="center" style={{ justifyContent: 'space-between' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>{t('edit.title')}</Typography.Title>
        <Button onClick={onBack} icon={<RollbackOutlined />}>{t('common.back')}</Button>
      </Space>

        {!hidden && <Card>
        <Flex vertical gap={12}>
          <TextArea
            autoSize={{ minRows: 4 }}
            placeholder={t('edit.placeholder')}
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
          />
          <div>
            <Button type="primary" onClick={handleProcess}>{t('edit.process')}</Button>
          </div>
        </Flex>
      </Card>}

      <Flex vertical gap={8}>
        {isEmpty ? (
          <Text type="secondary">{t('edit.empty')}</Text>
        ) : (
          items.map((text, idx) => (
            <Card key={`${idx}-${text.slice(0, 12)}`} size="small">
              <Flex align="center" justify="space-between" gap={8}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{text}</div>
                <Space>
                  <Button aria-label="move up" disabled={idx === 0} icon={<ArrowUpOutlined />} onClick={() => moveUp(idx)} />
                  <Button aria-label="move down" disabled={idx === items.length - 1} icon={<ArrowDownOutlined />} onClick={() => moveDown(idx)} />
                  <Button danger aria-label="delete" icon={<DeleteOutlined />} onClick={() => removeAt(idx)} />
                </Space>
              </Flex>
            </Card>
          ))
        )}
      </Flex>

      {/* Optional debug/preview of current list */}
      {/* <Card title="Preview">
        <pre>{preview}</pre>
      </Card> */}
    </Flex>
  );
}
