import { useState } from 'react';
import { Button, Drawer, Flex, Select, Spin } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import LoginPage from '../pages/login/ui/LoginPage';
import { useAuth } from '../shared/auth/useAuth';
import NewsTodayPage from '../pages/news-today/ui/NewsTodayPage';
import EditDigest from '../pages/edit-digest/ui/EditDigest';
import { useI18n } from '../shared/i18n/I18nProvider';
import FiltersPage from '../pages/filters/ui/FiltersPage';
import SettingsPage from '../pages/settings/ui/SettingsPage';

export default function App() {
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const { t, lang, setLang } = useI18n();
  const [page, setPage] = useState<'news' | 'edit' | 'filters' | 'settings'>('news');

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
          aria-label={t('header.openMenuAria')}
          icon={<MenuOutlined />}
          onClick={() => setMenuOpen(true)}
        />
        <div style={{ fontWeight: 500 }}>{t('header.greeting', { name: String(userName) })}</div>
      </div>

      {/* Sidebar Drawer */}
      <Drawer
        placement="left"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={t('menu.title')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', gap: 12 }}>
          <a
            href={'#'}
            onClick={(e) => {
              e.preventDefault();
              setPage('news');
              setMenuOpen(false);
            }}
          >
            {t('menu.lastNews')}
          </a>

            <a
                href={'#'}
                onClick={(e) => {
                    e.preventDefault();
                    setPage('edit');
                    setMenuOpen(false);
                }}
            >
                {t('edit.title')}
            </a>

            <a
              href={'#'}
              onClick={(e) => {
                e.preventDefault();
                setPage('filters');
                setMenuOpen(false);
              }}
            >
              {t('menu.filters')}
            </a>

            <a
              href={'#'}
              onClick={(e) => {
                e.preventDefault();
                setPage('settings');
                setMenuOpen(false);
              }}
            >
              {t('menu.settings')}
            </a>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ color: '#888' }}>{t('menu.language')}</div>
            <Select
              value={lang}
              onChange={(value) => setLang(value as 'ru' | 'en')}
              options={[
                { value: 'ru', label: t('menu.language.ru') },
                { value: 'en', label: t('menu.language.en') },
              ]}
              style={{ width: 200 }}
            />
            <Button
              onClick={() => {
                void logout();
                setMenuOpen(false);
              }}
            >
              {t('menu.logout')}
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Main content with top padding to avoid being under header */}
      <div style={{ paddingTop: 64 }}>
        {page === 'news' && (
          <NewsTodayPage onOpenEdit={() => setPage('edit')} />
        )}
        {page === 'edit' && (
          <EditDigest onBack={() => setPage('news')} />
        )}
        {page === 'filters' && (
          <FiltersPage />
        )}
        {page === 'settings' && (
          <SettingsPage />
        )}
      </div>
    </>
  );
}
