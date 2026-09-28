import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3400,
    proxy: {
      '/open-api': {
        target: 'http://localhost:8480',
        changeOrigin: true,
        configure(proxy) {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (!req.url?.startsWith('/open-api/integrations/naver/')) proxyReq.removeHeader('origin')
          })
        },
      },
      '/api': {
        target: 'http://localhost:8480',
        changeOrigin: true,
        configure(proxy) {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (!/^\/api\/workspaces\/\d+\/connections\/naver\/authorizations(?:\/|$)/.test(req.url ?? '')) proxyReq.removeHeader('origin')
          })
        },
      },
    },
  },
})
