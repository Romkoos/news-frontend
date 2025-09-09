import { useEffect, useState } from 'react';
import { Card, Flex, FloatButton, notification } from 'antd';
import { CopyOutlined, SmileOutlined } from '@ant-design/icons';

import { fetchToday } from '../../../entities/news/api/fetchToday';
import type { News } from '../../../entities/news/model/types';
import { isErrorWithMessage } from '../../../shared/lib/isErrorWithMessage';
import { NewsList } from '../../../widgets/news-list/ui/NewsList';

export default function NewsTodayPage() {
  const [items, setItems] = useState<News[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [api, contextHolder] = notification.useNotification();

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
        message: 'Copied to clipboard!',
        description: 'The news texts have been copied to your clipboard.',
        icon: <SmileOutlined style={{ color: '#108ee9' }} />,
      });
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert('Не удалось скопировать текст в буфер обмена');
    }
  }

  return (
    <Flex gap="middle" vertical>
      {contextHolder}
      <h2 style={{ marginLeft: '24px' }}>News Today</h2>
      <FloatButton
        onClick={handleCopy}
        style={{ color: '#108ee9' }}
        badge={{ count: items.length, color: 'blue' }}
        icon={<CopyOutlined />}
      />

      <Card>
        {err && <p style={{ color: 'crimson' }}>Ошибка: {err}</p>}
        <NewsList items={items} isSmall={isSmall} onRemove={removePostById} />
      </Card>
    </Flex>
  );
}
