import { Flex, Switch, Space, Tag, Card, Button } from 'antd';
import { EditOutlined, DeleteOutlined, FileTextOutlined } from '@ant-design/icons';
import { useI18n } from '../../../shared/i18n/I18nProvider';
import type { Filter, FilterAction } from '../../../entities/filters/model/types';
import RegexViewer from '../../../shared/regex/RegexViewer';

function actionColor(a: FilterAction): string {
  switch (a) {
    case 'publish': return 'green';
    case 'reject': return 'red';
    case 'moderation': return 'gold';
    default: return 'blue';
  }
}

export interface FiltersListProps {
  items: Filter[];
  onToggleActive: (id: string, active: boolean) => void | Promise<void>;
  onEdit: (item: Filter) => void;
  onDelete: (item: Filter) => void;
}

export function FiltersList({ items, onToggleActive, onEdit, onDelete }: FiltersListProps) {
  const { t, lang } = useI18n();

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
    <Flex vertical gap={8}>
      {items.map((r) => (
        <Card key={r.id} size="small">
          <Flex vertical gap={8}>
            {/* Row 1: switch left, action buttons right */}
            <Flex align="center" justify="space-between">
              <Switch
                checked={r.active ?? true}
                onChange={(checked) => onToggleActive(r.id, checked)}
              />
              <Space>
                <Button
                  aria-label={t('filters.edit')}
                  title={t('filters.edit')}
                  icon={<EditOutlined />}
                  onClick={() => onEdit(r)}
                />
                <Button danger aria-label={t('filters.delete')} title={t('filters.delete')} icon={<DeleteOutlined />} onClick={() => onDelete(r)} />
              </Space>
            </Flex>

            {/* Content row: keyword for substring; chips only for regex */}
            {r.matchType === 'regex' ? (
              <div>
                <RegexViewer input={r.keyword} compact maxVisible={6} showModeSwitch={false} showCopy={false} />
              </div>
            ) : (
              <div style={{ fontWeight: 600, fontSize: 18, lineHeight: 1.4, wordBreak: 'break-word' }}>{r.keyword}</div>
            )}

            {/* Notes (optional) */}
            {typeof r.notes === 'string' && r.notes.trim() !== '' && (
              <div style={{ color: '#8c8c8c', fontSize: 12, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <FileTextOutlined style={{ color: '#8c8c8c', marginTop: 2 }} />
                <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{r.notes}</span>
              </div>
            )}

            {/* Row 3: tags with indent */}
            <div>
              <Space size={8} wrap>
                <Tag color={actionColor(r.action)}>{t(`filters.action.${r.action}`)}</Tag>
                <Tag color="blue">{formatDate(r.updatedAt)}</Tag>
              </Space>
            </div>
          </Flex>
        </Card>
      ))}
    </Flex>
  );
}
