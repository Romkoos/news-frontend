import { Button, Card, Space } from 'antd';
import type { News } from '../../../entities/news/model/types';

type Props = {
  items: News[];
  isSmall: boolean;
  onRemove: (id: number) => void;
};

export function NewsList({ items, isSmall, onRemove }: Props) {
  return (
    <>
      {items.map((n) => (
        <Card.Grid
          key={n.id}
          style={{
            minWidth: 300,
            width: isSmall ? '100%' : undefined,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 180,
          }}
        >
          <Space direction={'vertical'} style={{ marginBottom: '15px' }}>
            <div style={{ opacity: 0.6, fontSize: 12 }}>
              {new Date(n.ts).toLocaleString()}
            </div>
            <div>{n.text}</div>
          </Space>

          <Button style={{ marginTop: 'auto' }} onClick={() => onRemove(n.id)}>
            Remove
          </Button>
        </Card.Grid>
      ))}
    </>
  );
}
