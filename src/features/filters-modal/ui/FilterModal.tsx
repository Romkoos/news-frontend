import { useEffect, useState } from 'react';
import { Button, Card, Flex, Input, Modal, Radio, Segmented, Space, Switch, Tag, Typography, InputNumber, message } from 'antd';
import { useI18n } from '../../../shared/i18n/I18nProvider';
import type { Filter, FilterAction, MatchType } from '../../../entities/filters/model/types';
import { createFilter, testMatch, updateFilter } from '../../../entities/filters/api/storage';
import { mapFilterError } from '../../../entities/filters/lib/mapFilterError';
import RegexViewer from '../../../shared/regex/RegexViewer';
import { highlightMatches } from '../../../shared/regex/highlight';
import type { ReactNode } from 'react';

const { Text } = Typography;

export interface FilterModalProps {
  open: boolean;
  initial?: Partial<Filter>;
  onCancel: () => void;
  onSaved: (item: Filter) => void;
}

export default function FilterModal({ open, initial, onCancel, onSaved }: FilterModalProps) {
  const { t } = useI18n();
  const [keyword, setKeyword] = useState(initial?.keyword ?? '');
  const [action, setAction] = useState<FilterAction>(initial?.action ?? 'moderation');
  const [priority, setPriority] = useState<number>(initial?.priority ?? 1);
  const [matchType, setMatchType] = useState<MatchType>(initial?.matchType ?? 'substring');
  const [active, setActive] = useState<boolean>(initial?.active ?? true);
  const [notes, setNotes] = useState<string>(initial?.notes ?? '');
  const [testingText, setTestingText] = useState<string>('');
  const [checkResult, setCheckResult] = useState<boolean | null>(null);
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [highlighted, setHighlighted] = useState<ReactNode | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setKeyword(initial?.keyword ?? '');
    setAction(initial?.action ?? 'moderation');
    setPriority(initial?.priority ?? 1);
    setMatchType(initial?.matchType ?? 'substring');
    setActive(initial?.active ?? true);
    setNotes(initial?.notes ?? '');
  }, [initial, open]);


  async function handleSave() {
    setSaving(true);
    try {
      const payload = { keyword: keyword.trim(), action, priority, matchType, active, notes };
      if (initial?.id) {
        const updated = await updateFilter(initial.id, payload);
        onSaved(updated);
      } else {
        const created = await createFilter(payload);
        onSaved(created);
      }
    } catch (e) {
      message.error(mapFilterError(t, e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={initial?.id ? t('modal.title.edit') : t('modal.title.add')}
      open={open}
      onCancel={onCancel}
      onOk={handleSave}
      okText={t('modal.save')}
      cancelText={t('modal.cancel')}
      confirmLoading={saving}
    >
      <Flex vertical gap={8}>
        <div>
          <Text strong>{t('modal.keyword')}</Text>
          <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        </div>
        <div>
          <Text strong>{t('modal.action')}</Text>
          <Radio.Group
            value={action}
            onChange={(e) => setAction(e.target.value)}
            options={[
              { label: t('filters.action.publish'), value: 'publish' },
              { label: t('filters.action.reject'), value: 'reject' },
              { label: t('filters.action.moderation'), value: 'moderation' },
            ]}
            optionType="button"
          />
        </div>
        <div>
          <Text strong style={{marginRight: '10px'}}>{t('modal.priority')}</Text>
          <InputNumber min={1} max={1000} value={priority} onChange={(v) => setPriority(Number(v ?? 1))} />
        </div>
        <div>
          <Text strong>{t('modal.matchType')}</Text>
          <Segmented
            value={matchType}
            onChange={(v) => setMatchType(v as MatchType)}
            options={[
              { label: t('filters.match.substring'), value: 'substring' },
              { label: t('filters.match.regex'), value: 'regex' },
            ]}
          />
        </div>

        {matchType === 'regex' && keyword.trim() !== '' && (
          <div>
            <Text strong>{t('regex.pattern')}</Text>
            <div style={{ marginTop: 6 }}>
              <RegexViewer input={keyword} showModeSwitch showCopy />
            </div>
          </div>
        )}
        <div>
          <Text strong style={{marginRight: '10px'}}>{t('modal.active')}</Text>
          <Switch checked={active} onChange={setActive} />
        </div>
        <div>
          <Text strong>{t('modal.notes')}</Text>
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <Card size="small">
          <Flex vertical gap={8}>
            <Text strong>{t('modal.tester.title')}</Text>
            <Input.TextArea
              placeholder={t('modal.tester.text')}
              autoSize={{ minRows: 2, maxRows: 6 }}
              value={testingText}
              onChange={(e) => setTestingText(e.target.value)}
            />
            <Space align="center">
              <Button
                size="small"
                onClick={() => {
                  if (matchType === 'regex') {
                    const res = highlightMatches(testingText, keyword);
                    setMatchCount(res.count);
                    setHighlighted(res.nodes);
                    setCheckResult(res.count > 0);
                  } else {
                    const ok = testMatch(testingText, keyword, matchType);
                    setCheckResult(ok);
                    setMatchCount(null);
                    setHighlighted(null);
                  }
                }}
              >
                {t('modal.tester.check')}
              </Button>
              {checkResult !== null && (
                <Tag color={checkResult ? 'green' : 'red'}>
                  {checkResult ? t('modal.tester.match') : t('modal.tester.noMatch')}
                </Tag>
              )}
              {matchType === 'regex' && matchCount !== null && (
                <Tag color="blue">{t('regex.matches', { count: matchCount })}</Tag>
              )}
            </Space>
            {matchType === 'regex' && highlighted && (
              <div style={{ whiteSpace: 'pre-wrap' }}>{highlighted}</div>
            )}
          </Flex>
        </Card>
      </Flex>
    </Modal>
  );
}
