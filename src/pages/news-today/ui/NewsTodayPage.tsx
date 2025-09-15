import { useEffect, useState } from 'react';
import { Card, Flex, FloatButton, notification } from 'antd';
import { CopyOutlined, SmileOutlined, CheckCircleOutlined, PlusCircleOutlined, CloudOutlined} from '@ant-design/icons';

import { fetchToday } from '../../../entities/news/api/fetchToday';
// import { postLastUsed } from '../../../entities/news/api/postLastUsed';
import type { News } from '../../../entities/news/model/types';
import { isErrorWithMessage } from '../../../shared/lib/isErrorWithMessage';
import { NewsList } from '../../../widgets/news-list/ui/NewsList';
import { useI18n } from '../../../shared/i18n/I18nProvider';
// import {isProd} from "../../../shared/api/config.ts";

interface NewsTodayPageProps { onOpenEdit?: () => void }

export default function NewsTodayPage({ onOpenEdit }: NewsTodayPageProps) {
  const { t } = useI18n();
  const [items, setItems] = useState<News[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [api, contextHolder] = notification.useNotification();
  const [showButtons, setShowButtons] = useState(false);
  // const prod = isProd()

  // Responsive: detect small screens to make cards full width
  const [isSmall, setIsSmall] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth <= 576 : false
  );
  useEffect(() => {
    const onResize = () => setIsSmall(window.innerWidth <= 576);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  async function loadToday() {
    setErr(null);
    try {
      const data = await fetchToday();
      setItems(data);
      // eslint-disable-next-line no-console
      console.log(data);
    } catch (e: unknown) {
      if (isErrorWithMessage(e)) {
        setErr(e.message);
      } else {
        setErr(String(e));
      }
    }
  }

  useEffect(() => {
    loadToday();
  }, []);

  function removePostById(id: number) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleCopy() {
    try {
      const { copyNewsTexts } = await import(
        '../../../features/copy-news/lib/copyNews'
      );
      await copyNewsTexts(items);

      api.open({
        message: t('notif.copiedTitle'),
        description: t('notif.copiedDesc'),
        icon: <SmileOutlined style={{ color: '#108ee9' }} />,
      });
    } catch {
      // eslint-disable-next-line no-alert
      alert(t('copy.error'));
    }
  }

  return (
    <Flex gap="middle" vertical>
      {contextHolder}
      <h4 style={{ margin: '12px 0 0 24px' }}>{t('news.title')}</h4>
        <FloatButton.Group
            open={showButtons}
            badge={{ count: items.length, color: 'blue' }}
            shape="circle"
            trigger="click"
            style={{  color: '#108ee9' }}
            onClick={() => setShowButtons(!showButtons)}
            icon={<CopyOutlined />}
        >

            <FloatButton icon={<CloudOutlined />} />
            <FloatButton
                         shape="circle"
                         style={{ color: '#108ee9' }}
                         onClick={() => handleCopy()}
                         icon={<CopyOutlined />} />

            <FloatButton
                shape="circle"
                style={{ insetInlineEnd: 88, color: '#108ee9' }}
                onClick={() => { if (onOpenEdit) onOpenEdit(); }}
                icon={<PlusCircleOutlined /> }


        >
            <FloatButton
                         shape="circle"
                         style={{ insetInlineEnd: 88, color: '#108ee9' }}
                         onClick={() => console.log('clicked CheckCircleOutlined')}
                         icon={<CheckCircleOutlined />}/>

            </FloatButton>
        </FloatButton.Group>

      <Card>
        {err && (
          <p style={{ color: 'crimson' }}>
            {t('error.prefix')}: {err}
          </p>
        )}
        <NewsList items={items} isSmall={isSmall} onRemove={removePostById} />
      </Card>
    </Flex>
  );
}
