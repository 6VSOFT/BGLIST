import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const base = process.env.VITE_BASE_PATH || '/'
export default defineConfig({
  base,
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['icon.svg'],
    manifest: {
      name: 'Meeple POS 桌游库存', short_name: 'Meeple POS',
      description: '桌游店餐饮与桌游库存管理', theme_color: '#0f766e', background_color: '#f8fafc',
      display: 'standalone', start_url: base, lang: 'zh-CN',
      icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
    },
    workbox: { navigateFallback: '/index.html', globPatterns: ['**/*.{js,css,html,svg,png,ico,webp}'] }
  })]
})
