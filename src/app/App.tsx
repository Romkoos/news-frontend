import { useState } from 'react';
import { Button, Drawer, Flex, Spin } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import LoginPage from '../pages/login/ui/LoginPage';
import { useAuth } from '../shared/auth/useAuth';
import NewsTodayPage from '../pages/news-today/ui/NewsTodayPage';

export default function App() {
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

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

  const userName = user.name ?? user.email;

  return (
    <>
      {/* Fixed Header */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 1000,
        }}
      >
        <Button
          type="text"
          aria-label="Открыть меню"
          icon={<MenuOutlined />}
          onClick={() => setMenuOpen(true)}
        />
        <div style={{ fontWeight: 500 }}>Hi, {userName}</div>
      </div>

      {/* Sidebar Drawer */}
      <Drawer
        placement="left"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Menu"
      >
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', gap: 12 }}>
          <a
            href={typeof window !== 'undefined' ? window.location.pathname : '#'}
            onClick={() => setMenuOpen(false)}
          >
            Last news
          </a>
          <Button
            onClick={() => {
              void logout();
              setMenuOpen(false);
            }}
          >
            Выйти
          </Button>
        </div>
      </Drawer>

      {/* Main content with top padding to avoid being under header */}
      <div style={{ paddingTop: 64 }}>
        <NewsTodayPage />
      </div>
    </>
  );
}
