import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const basePath = process.env.VITE_BASE_PATH || '/'

// Extracts base backend URL (e.g., http://localhost:3000 from http://localhost:3000/api/v1)
const getBackendBase = () => {
  const apiBaseUrl = process.env.VITE_API_BASE_URL || process.env.VITE_API_URL || 'http://localhost:3000/api/v1'
  return apiBaseUrl.replace(/\/api\/v1$/, '')
}

const backendBase = getBackendBase()

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: basePath,
  // Vite proxy only runs in dev server mode (npm run dev)
  // In production (static build), nginx/azure handles routing
  server: {
    proxy: {
      // Proxy uploads to backend API
      '/uploads': {
        target: backendBase,
        changeOrigin: true,
        secure: false,
        // Rewrite /uploads/... to /api/v1/uploads/...
        rewrite: (path) => path.replace(/^\/uploads/, '/api/v1/uploads'),
        // Forward host header for better backend request handling
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('X-Forwarded-Host', proxyReq.getHeader('host'))
          })
        }
      }
    }
  }
})
