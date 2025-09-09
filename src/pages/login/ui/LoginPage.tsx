import { useState } from 'react';
import { Alert, Button, Card, Flex, Form, Input, Typography } from 'antd';
import { useAuth } from '../../../shared/auth/useAuth';

export default function LoginPage() {
  const { login, error } = useAuth();
  const [loading, setLoading] = useState(false);

  type Values = { email: string; password: string };

  async function onFinish(values: Values) {
    setLoading(true);
    try {
      await login(values);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Flex align="center" justify="center" style={{ minHeight: '100vh', padding: 16 }}>
      <Card style={{ width: 360 }}>
        <Typography.Title level={3} style={{ textAlign: 'center' }}>
          Вход
        </Typography.Title>
        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Введите корректный email' }]}>
            <Input placeholder="you@example.com" autoFocus />
          </Form.Item>
          <Form.Item name="password" label="Пароль" rules={[{ required: true, message: 'Введите пароль' }]}>
            <Input.Password placeholder="••••••••" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Войти
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Flex>
  );
}
