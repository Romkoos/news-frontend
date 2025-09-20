import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Flex, Input, Modal, Popconfirm, Radio, Segmented, Select, Space, Switch, Table, Tag, Typography, InputNumber, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useI18n } from '../../../shared/i18n/I18nProvider';
import type { Filter, FilterAction, MatchType, UUID } from '../../../entities/filters/model/types';
import { bulkDelete, bulkUpdateActive, createFilter, deleteFilter, getFilters, testMatch, updateFilter } from '../../../entities/filters/api/storage';

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
          <Text strong>{t('modal.priority')}</Text>
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
          <Text strong>{t('modal.active')}</Text>
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
  const { t } = useI18n();
  const [items, setItems] = useState<Filter[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<'all' | FilterAction>('all');
  const [onlyActive, setOnlyActive] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Filter | undefined>(undefined);

  function mapErr(e: unknown): string {
    const s = String(e);
    if (s.includes('keyword:required')) return t('filters.validation.keyword');
    if (s.includes('priority:range')) return t('filters.validation.priority');
    if (s.includes('duplicate:active')) return t('filters.validation.duplicate');
    if (s.includes('regex:invalid')) return t('filters.validation.regex');
    return String(e);
  }

  async function load() {
    setLoading(true);
    try {
      const list = await getFilters();
      setItems(list);
    } finally {
      setLoading(false);
    }
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

  const columns: ColumnsType<Filter> = [
    { title: t('filters.columns.keyword'), dataIndex: 'keyword', key: 'keyword' },
    {
      title: t('filters.columns.action'), dataIndex: 'action', key: 'action',
      render: (_, r) => <Tag color={actionColor(r.action)}>{t(`filters.action.${r.action}`)}</Tag>
    },
    {
      title: t('filters.columns.priority'), dataIndex: 'priority', key: 'priority',
      render: (_, r) => (
        <InputNumber
          min={1}
          max={1000}
          defaultValue={r.priority}
          onBlur={async (e) => {
            const v = Number((e.target as HTMLInputElement).value);
            if (Number.isNaN(v)) return;
            try {
              await updateFilter(r.id, { priority: v });
              message.success(t('filters.saved'));
              void load();
            } catch (err) {
              message.error(mapErr(err));
            }
          }}
        />
      )
    },
    {
      title: t('filters.columns.match'), dataIndex: 'matchType', key: 'matchType',
      render: (_, r) => r.matchType === 'regex' ? t('filters.match.regex') : t('filters.match.substring')
    },
    {
      title: t('filters.columns.active'), dataIndex: 'active', key: 'active',
      render: (_, r) => (
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
      )
    },
    { title: t('filters.columns.updated'), dataIndex: 'updatedAt', key: 'updatedAt' },
    {
      title: t('filters.columns.actions'), key: 'actions',
      render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => { setEditing(r); setModalOpen(true); }}>{t('filters.edit')}</Button>
          <Popconfirm title={t('filters.confirmDelete')} onConfirm={async () => { await deleteFilter(r.id); void load(); }}>
            <Button size="small" danger>{t('filters.delete')}</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  async function bulkActivate(active: boolean) {
    try {
      await bulkUpdateActive(selectedRowKeys as UUID[], active);
      setSelectedRowKeys([]);
      void load();
    } catch (e) {
      message.error(mapErr(e));
    }
  }

  async function bulkDel() {
    try {
      await bulkDelete(selectedRowKeys as UUID[]);
      setSelectedRowKeys([]);
      void load();
    } catch (e) {
      message.error(mapErr(e));
    }
  }

  return (
    <Flex vertical gap={12} style={{ padding: 16 }}>
      <Space align="center" style={{ justifyContent: 'space-between' }}>
        <Title level={4} style={{ margin: 0 }}>{t('filters.title')}</Title>
        <Button type="primary" onClick={() => { setEditing(undefined); setModalOpen(true); }}>{t('filters.add')}</Button>
      </Space>

      <Card>
        <Flex gap={8} wrap>
          <Input style={{ width: 260 }} placeholder={t('filters.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select
            value={actionFilter}
            onChange={(v) => setActionFilter(v as any)}
            style={{ width: 200 }}
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

      <Card>
        <Space style={{ marginBottom: 12 }}>
          <Button onClick={() => bulkActivate(true)} disabled={selectedRowKeys.length === 0}>{t('filters.bulk.activate')}</Button>
          <Button onClick={() => bulkActivate(false)} disabled={selectedRowKeys.length === 0}>{t('filters.bulk.deactivate')}</Button>
          <Button danger onClick={bulkDel} disabled={selectedRowKeys.length === 0}>{t('filters.bulk.delete')}</Button>
        </Space>
        <Table
          rowKey={(r) => r.id}
          loading={loading}
          dataSource={filtered}
          columns={columns}
          rowSelection={rowSelection}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>

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
