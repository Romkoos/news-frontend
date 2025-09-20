import { useEffect, useMemo, useState } from 'react';
import {
    Button,
    Card,
    Flex,
    Input,
    Modal,
    Popconfirm,
    Radio,
    Segmented,
    Select,
    Space,
    Switch,
    Tag,
    Typography,
    InputNumber,
    message
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useI18n } from '../../../shared/i18n/I18nProvider';
import type { Filter, FilterAction, MatchType } from '../../../entities/filters/model/types';
import { createFilter, deleteFilter, getFilters, testMatch, updateFilter } from '../../../entities/filters/api/storage';

const { Title, Text } = Typography;

function actionColor(a: FilterAction): string {
  switch (a) {
    case 'publish': return 'green';
    case 'reject': return 'red';
    case 'moderation': return 'gold';
    default: return 'blue';
  }
}

interface FilterModalProps {
  open: boolean;
  initial?: Partial<Filter>;
  onCancel: () => void;
  onSaved: (item: Filter) => void;
}

function FilterModal({ open, initial, onCancel, onSaved }: FilterModalProps) {
  const { t } = useI18n();
  const [keyword, setKeyword] = useState(initial?.keyword ?? '');
  const [action, setAction] = useState<FilterAction>(initial?.action ?? 'moderation');
  const [priority, setPriority] = useState<number>(initial?.priority ?? 1);
  const [matchType, setMatchType] = useState<MatchType>(initial?.matchType ?? 'substring');
  const [active, setActive] = useState<boolean>(initial?.active ?? true);
  const [notes, setNotes] = useState<string>(initial?.notes ?? '');
  const [testingText, setTestingText] = useState<string>('');
  const [checkResult, setCheckResult] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setKeyword(initial?.keyword ?? '');
    setAction(initial?.action ?? 'moderation');
    setPriority(initial?.priority ?? 1);
    setMatchType(initial?.matchType ?? 'substring');
    setActive(initial?.active ?? true);
    setNotes(initial?.notes ?? '');
  }, [initial, open]);


  function mapErr(e: unknown): string {
    const s = String(e);
    if (s.includes('keyword:required')) return t('filters.validation.keyword');
    if (s.includes('priority:range')) return t('filters.validation.priority');
    if (s.includes('duplicate:active')) return t('filters.validation.duplicate');
    if (s.includes('regex:invalid')) return t('filters.validation.regex');
    return String(e);
  }

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
      message.error(mapErr(e));
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
              <Button size="small" onClick={() => setCheckResult(testMatch(testingText, keyword, matchType))}>
                {t('modal.tester.check')}
              </Button>
              {checkResult !== null && (
                <Tag color={checkResult ? 'green' : 'red'}>
                  {checkResult ? t('modal.tester.match') : t('modal.tester.noMatch')}
                </Tag>
              )}
            </Space>
          </Flex>
        </Card>
      </Flex>
    </Modal>
  );
}

export default function FiltersPage() {
  const { t, lang } = useI18n();
  const [items, setItems] = useState<Filter[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<'all' | FilterAction>('all');
  const [onlyActive, setOnlyActive] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Filter | undefined>(undefined);
  // Responsive: detect small screens (phones)
  const [isSmall, setIsSmall] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth <= 576 : false
  );
  useEffect(() => {
    const onResize = () => setIsSmall(window.innerWidth <= 576);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  function mapErr(e: unknown): string {
    const s = String(e);
    if (s.includes('keyword:required')) return t('filters.validation.keyword');
    if (s.includes('priority:range')) return t('filters.validation.priority');
    if (s.includes('duplicate:active')) return t('filters.validation.duplicate');
    if (s.includes('regex:invalid')) return t('filters.validation.regex');
    return String(e);
  }

  async function load() {
    const list = await getFilters();
    setItems(list);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter(it => {
      if (onlyActive && !(it.active ?? true)) return false;
      if (actionFilter !== 'all' && it.action !== actionFilter) return false;
      if (search && !it.keyword.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [items, search, actionFilter, onlyActive]);

  function formatDate(iso: string): string {
    const d = new Date(iso);
    const locale = lang === 'ru' ? 'ru-RU' : 'en-US';
    try {
      return d.toLocaleString(locale, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).replace(',', '');
    } catch {
      return iso;
    }
  }

  return (
    <Flex vertical gap={12} style={{ padding: 16 }}>
      <Space align="center" style={{ justifyContent: 'space-between' }}>
        <Title level={4} style={{ margin: 0 }}>{t('filters.title')}</Title>
        <Button
          type="primary"
          aria-label={t('filters.add')}
          title={t('filters.add')}
          icon={<PlusOutlined />}
          onClick={() => { setEditing(undefined); setModalOpen(true); }}
        />
      </Space>

      <Card>
        <Flex gap={8} wrap>
          <Input style={{ width: isSmall ? '100%' : 260 }} placeholder={t('filters.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select<'all' | FilterAction>
            value={actionFilter}
            onChange={(v) => setActionFilter(v)}
            style={{ width: isSmall ? '100%' : 200 }}
            options={[
              { value: 'all', label: t('filters.action.all') },
              { value: 'publish', label: t('filters.action.publish') },
              { value: 'reject', label: t('filters.action.reject') },
              { value: 'moderation', label: t('filters.action.moderation') },
            ]}
          />
          <Space>
            <Text>{t('filters.activeOnly')}</Text>
            <Switch checked={onlyActive} onChange={setOnlyActive} />
          </Space>
        </Flex>
      </Card>

      <Flex vertical gap={8}>
        {filtered.map((r) => (
          <Card key={r.id} size="small">
            <Flex vertical gap={8}>
              {/* Row 1: switch left, action buttons right */}
              <Flex align="center" justify="space-between">
                <Switch
                  checked={r.active ?? true}
                  onChange={async (checked) => {
                    try {
                      await updateFilter(r.id, { active: checked });
                      void load();
                    } catch (err) {
                      message.error(mapErr(err));
                    }
                  }}
                />
                <Space>
                  <Button
                    aria-label={t('filters.edit')}
                    title={t('filters.edit')}
                    icon={<EditOutlined />}
                    onClick={() => { setEditing(r); setModalOpen(true); }}
                  />
                  <Popconfirm title={t('filters.confirmDelete')} onConfirm={async () => { await deleteFilter(r.id); void load(); }}>
                    <Button danger aria-label={t('filters.delete')} title={t('filters.delete')} icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              </Flex>

              {/* Row 2: main keyword, larger */}
              <div style={{ fontWeight: 600, fontSize: 18, lineHeight: 1.4, wordBreak: 'break-word' }}>{r.keyword}</div>

              {/* Row 3: tags with indent */}
              <div>
                <Space size={8} wrap>
                  <Tag color={actionColor(r.action)}>{t(`filters.action.${r.action}`)}</Tag>
                  <Tag>{r.matchType === 'regex' ? t('filters.match.regex') : t('filters.match.substring')}</Tag>
                  <Tag color="blue">{formatDate(r.updatedAt)}</Tag>
                </Space>
              </div>
            </Flex>
          </Card>
        ))}
      </Flex>

      {modalOpen && (
        <FilterModal
          open={modalOpen}
          initial={editing}
          onCancel={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); void load(); }}
        />
      )}
    </Flex>
  );
}
