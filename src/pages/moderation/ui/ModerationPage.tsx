import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Empty, Flex, Input, Popconfirm, Space, Spin, Switch, Tag, Typography, message } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { ModerationItem } from '../../../entities/moderation/model/types';
import { approveModeration, getModeration, rejectModeration } from '../../../entities/moderation/api';
import { getFilters } from '../../../entities/filters/api/storage';
import type { Filter } from '../../../entities/filters/model/types';
import { useI18n } from '../../../shared/i18n/I18nProvider';
import { LS_KEYS, usePersistentState } from '../../../shared/storage/persist';
import { highlightMatches } from '../../../shared/regex/highlight';

const { Title, Paragraph, Text } = Typography;

type FilterInfo = Pick<Filter, 'keyword' | 'action' | 'priority' | 'matchType'>;

// Simple module cache for filters
let FILTERS_CACHE: Map<string, FilterInfo> | null = null;
let FILTERS_CACHE_TIME = 0;
const FILTERS_TTL = 5 * 60 * 1000; // 5 minutes

function isVideo(url: string): boolean {
  return (/\.(mp4|mov|webm|mkv)(\?|#|$)/i).test(url);
}

function useFiltersMap(): [Map<string, FilterInfo> | null, boolean] {
  const [map, setMap] = useState<Map<string, FilterInfo> | null>(FILTERS_CACHE);
  const [loading, setLoading] = useState<boolean>(!FILTERS_CACHE);
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const now = Date.now();
        if (FILTERS_CACHE && (now - FILTERS_CACHE_TIME) < FILTERS_TTL) {
          setMap(FILTERS_CACHE);
          setLoading(false);
          return;
        }
        const list = await getFilters();
        const next = new Map<string, FilterInfo>();
        list.forEach(f => next.set(f.id, { keyword: f.keyword, action: f.action, priority: f.priority, matchType: f.matchType }));
        FILTERS_CACHE = next;
        FILTERS_CACHE_TIME = now;
        if (mounted) {
          setMap(next);
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => { mounted = false; };
  }, []);
  return [map, loading];
}

export interface ModerationPageProps { onOpenFilter?: (filterId: string) => void }

export default function ModerationPage() {
  const { t, lang } = useI18n();
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [auto, setAuto] = usePersistentState<boolean>(LS_KEYS.moderationAuto, false);
  const [filtersMap] = useFiltersMap();
  const timerRef = useRef<number | null>(null);

  // Responsive small screens
  const [isSmall, setIsSmall] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth <= 576 : false);
  useEffect(() => {
    const onResize = () => setIsSmall(window.innerWidth <= 576);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const data = await getModeration(50, 0);
      setItems(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      message.error(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    if (auto) {
      timerRef.current = window.setInterval(() => {
        void load();
      }, 20000);
    }
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [auto]);

  const filtered = useMemo(() => {
    if (!search) return items;
    return items.filter(it => it.textHe?.includes(search));
  }, [items, search]);

  function formatDate(iso: string): string {
    const d = new Date(iso);
    const locale = lang === 'ru' ? 'ru-RU' : 'en-US';
    try {
      return d.toLocaleString(locale, {
        year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
      }).replace(',', '');
    } catch {
      return iso;
    }
  }


  async function handleApprove(id: string) {
    // Optimistic removal
    setItems(prev => {
      const snapshot = prev;
      const next = prev.filter(it => it.id !== id);
      (async () => {
        try {
          await approveModeration(id);
          message.success(t('moderation.toast.approved'));
        } catch (e: unknown) {
          message.error(String(e));
          // revert
          setItems(snapshot);
        }
      })();
      return next;
    });
  }

  async function handleReject(id: string) {
    setItems(prev => {
      const snapshot = prev;
      const next = prev.filter(it => it.id !== id);
      (async () => {
        try {
          await rejectModeration(id);
          message.success(t('moderation.toast.rejected'));
        } catch (e: unknown) {
          message.error(String(e));
          setItems(snapshot);
        }
      })();
      return next;
    });
  }

  function escapeRegExp(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&');
  }

  function highlightByFilter(text: string, filterId: string) {
    const info = filtersMap?.get(filterId);
    if (!info || !info.keyword) return text;
    if ((info.matchType ?? 'substring') === 'regex') {
      return highlightMatches(text, info.keyword).nodes;
    }
    const pattern = `/${escapeRegExp(info.keyword)}/g`;
    return highlightMatches(text, pattern).nodes;
  }


  const foundCount = filtered.length;

  return (
    <Flex vertical gap={12} style={{ padding: 16 }}>
      {/* Toolbar */}
      <div style={{ position: 'sticky', top: 64, zIndex: 10, background: '#fff', paddingTop: 8 }}>
        {isSmall ? (
          <Flex vertical gap={8} style={{ width: '100%' }}>
            <Title level={4} style={{ margin: 0 }}>{t('moderation.title')}</Title>
            <Input
              style={{ width: '100%' }}
              placeholder={t('moderation.search')}
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              suffix={<span style={{ color: '#8c8c8c' }}>{t('moderation.found', { count: foundCount })}</span>}
            />
            <Flex align="center" justify="space-between" wrap>
              <Button size="small" icon={<ReloadOutlined />} onClick={() => void load()}>{t('moderation.refresh')}</Button>
              <Space>
                <Text>{t('moderation.auto')}</Text>
                <Switch checked={auto} onChange={setAuto} />
              </Space>
            </Flex>
          </Flex>
        ) : (
          <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Title level={4} style={{ margin: 0 }}>{t('moderation.title')}</Title>
            <Space>
              <Input
                style={{ width: 320 }}
                placeholder={t('moderation.search')}
                prefix={<SearchOutlined />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                suffix={<span style={{ color: '#8c8c8c' }}>{t('moderation.found', { count: foundCount })}</span>}
              />
              <Button icon={<ReloadOutlined />} onClick={() => void load()}>{t('moderation.refresh')}</Button>
              <Space>
                <Text>{t('moderation.auto')}</Text>
                <Switch checked={auto} onChange={setAuto} />
              </Space>
            </Space>
          </Space>
        )}
      </div>

      <Card>
        {loading ? (
          <Flex align="center" justify="center" style={{ minHeight: 160 }}>
            <Spin />
          </Flex>
        ) : (
          <>
            {error && (
              <p style={{ color: 'crimson' }}>{error}</p>
            )}

            {filtered.length === 0 ? (
              <Flex vertical align="center" justify="center" style={{ minHeight: 200, padding: 16 }}>
                <Empty description={t('moderation.empty')} />
                <Button style={{ marginTop: 12 }} onClick={() => void load()}>{t('moderation.refresh')}</Button>
              </Flex>
            ) : (
              <Flex vertical gap={8}>
                {filtered.map(item => (
                  <Card key={item.id} size="small">
                      <Flex justify={'space-between'} style={{ marginBottom: 8 }}>
                          <Tag color="cyan">{formatDate(item.createdAt)}</Tag>
                      </Flex>
                    <Flex gap={8} align="flex-start" justify="space-around" wrap>
                        {item.media && (
                            isVideo(item.media) ? (
                                <video src={item.media} controls style={{ width: '100%' }} />
                            ) : (
                                <img src={item.media} alt="media" style={{ width: '100%', objectFit: 'contain' }} />
                            )
                        )}
                      <div style={{ flex: 1, minWidth: 220 }}>
                        <Paragraph copyable={{ text: item.textHe }} ellipsis={{ rows: isSmall ? 6 : 8 }} style={{ marginBottom: 4, whiteSpace: 'pre-wrap' }} dir="rtl">
                          {highlightByFilter(item.textHe, item.filterId)}
                        </Paragraph>

                        {isSmall && (
                          <div style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
                            <Space>
                              <Popconfirm title={t('moderation.confirm.approve')} onConfirm={() => void handleApprove(item.id)}>
                                <Button type="primary">{t('moderation.approve')}</Button>
                              </Popconfirm>
                              <Popconfirm title={t('moderation.confirm.reject')} onConfirm={() => void handleReject(item.id)}>
                                <Button danger>{t('moderation.reject')}</Button>
                              </Popconfirm>
                            </Space>
                          </div>
                        )}
                      </div>
                      {!isSmall && (
                        <Space onClick={(e) => e.stopPropagation()}>
                          <Popconfirm title={t('moderation.confirm.approve')} onConfirm={() => void handleApprove(item.id)}>
                            <Button type="primary">{t('moderation.approve')}</Button>
                          </Popconfirm>
                          <Popconfirm title={t('moderation.confirm.reject')} onConfirm={() => void handleReject(item.id)}>
                            <Button danger>{t('moderation.reject')}</Button>
                          </Popconfirm>
                        </Space>
                      )}
                    </Flex>
                  </Card>
                ))}
              </Flex>
            )}
          </>
        )}
      </Card>

    </Flex>
  );
}
