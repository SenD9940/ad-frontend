import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'DEV_SERVER_')

  return {
    plugins: [react()],
    server: {
      port: 3400,
      strictPort: true,
      allowedHosts: (env.DEV_SERVER_ALLOWED_HOSTS ?? '').split(',').map(host => host.trim()).filter(Boolean),
      proxy: {
        '/admin-api': {
          target: 'http://localhost:8481',
          changeOrigin: true,
          configure(proxy) { proxy.on('proxyReq', proxyReq => proxyReq.removeHeader('origin')) },
        },
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
  }
})
