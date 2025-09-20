import { useEffect, useState } from 'react';
import { Button, Card, Flex, Select, Space, Typography, message } from 'antd';
import { useI18n } from '../../../shared/i18n/I18nProvider';
import type { FilterAction } from '../../../entities/filters/model/types';
import { getSettings, updateSettings } from '../../../entities/filters/api/storage';

const { Title, Text } = Typography;

export default function SettingsPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [defaultAction, setDefaultAction] = useState<FilterAction>('moderation');

  async function load() {
    setLoading(true);
    try {
      const s = await getSettings();
      setDefaultAction(s.defaultAction);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    setSaving(true);
    try {
      await updateSettings({ defaultAction });
      message.success(t('filters.saved'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Flex vertical gap={12} style={{ padding: 16 }}>
      <Title level={4} style={{ margin: 0 }}>{t('settings.title')}</Title>
      <Card loading={loading}>
        <Text strong>{t('settings.defaultAction')}</Text>
        <Space align="center" size={12}>
          <Select
            value={defaultAction}
            onChange={(v) => setDefaultAction(v as FilterAction)}
            style={{ width: 240 }}
            options={[
              { value: 'publish', label: t('filters.action.publish') },
              { value: 'reject', label: t('filters.action.reject') },
              { value: 'moderation', label: t('filters.action.moderation') },
            ]}
          />
          <Button type="primary" onClick={save} loading={saving}>{t('settings.save')}</Button>
        </Space>
      </Card>
    </Flex>
  );
}
