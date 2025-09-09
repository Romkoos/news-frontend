import { Button, Flex, Spin } from 'antd';
import LoginPage from '../pages/login/ui/LoginPage';
import { useAuth } from '../shared/auth/useAuth';
import NewsTodayPage from '../pages/news-today/ui/NewsTodayPage';

export default function App() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: '100vh' }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <>
      <Flex align="center" justify="end" style={{ padding: 16 }}>
        <Button onClick={() => void logout()}>Выйти</Button>
      </Flex>
      <NewsTodayPage />
    </>
  );
}
