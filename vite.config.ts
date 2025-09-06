// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            // всё, что начинается с /api, уходит на твой локальный API
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                // ничего не переписываем: путь /api/news/today останется таким же
                // rewrite: (p) => p,
            },
        },
    },
})
