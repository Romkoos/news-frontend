import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import AuthProvider from './shared/auth/AuthProvider'
import { I18nProvider } from './shared/i18n/I18nProvider'
import { ConfigProvider } from 'antd'

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  <ConfigProvider theme={{ token: { fontSize: 16 } }}>
    <I18nProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </I18nProvider>
  </ConfigProvider>
  // </StrictMode>,
)
