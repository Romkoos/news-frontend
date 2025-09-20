import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Flex, Input, Modal, Select, Space, Switch, Typography, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useI18n } from '../../../shared/i18n/I18nProvider';
import type { Filter, FilterAction } from '../../../entities/filters/model/types';
import { deleteFilter, getFilters, updateFilter } from '../../../entities/filters/api/storage';
import { mapFilterError } from '../../../entities/filters/lib/mapFilterError';
import FilterModal from '../../../features/filters-modal/ui/FilterModal';
import { FiltersList } from '../../../widgets/filters-list/ui/FiltersList';

const { Title, Text } = Typography;

export default function FiltersPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<Filter[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<'all' | FilterAction>('all');
  const [onlyActive, setOnlyActive] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Filter | undefined>(undefined);
  const [modal, contextHolder] = Modal.useModal();
  // Responsive: detect small screens (phones)
  const [isSmall, setIsSmall] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth <= 576 : false
  );
  useEffect(() => {
    const onResize = () => setIsSmall(window.innerWidth <= 576);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);


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


  return (
    <Flex vertical gap={12} style={{ padding: 16 }}>
      {contextHolder}
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

      <FiltersList
        items={filtered}
        onToggleActive={(id, active) => {
          // Optimistic UI update
          setItems((prev) => {
            const snapshot = prev;
            const next = prev.map(f => f.id === id ? { ...f, active, updatedAt: new Date().toISOString() } : f);
            // Fire-and-forget server update, rollback on error
            void updateFilter(id, { active })
              .then(() => { void load(); })
              .catch((err) => {
                message.error(mapFilterError(t, err));
                setItems(snapshot);
              });
            return next;
          });
        }}
        onEdit={(item) => {
          setEditing(item);
          setModalOpen(true);
        }}
        onDelete={(item) => {
          modal.confirm({
            title: t('filters.confirmDelete'),
            okText: t('common.ok'),
            cancelText: t('common.cancel'),
            zIndex: 1100,
            onOk: async () => {
              await deleteFilter(item.id);
              void load();
            },
          });
        }}
      />

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
