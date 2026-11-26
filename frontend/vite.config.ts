import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: '日程管理系统',
        short_name: '日程',
        description: '插件式个人日程管理中心',
        start_url: '/',
        display: 'standalone',
        theme_color: '#f5f6f8',
        background_color: '#ffffff',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // 保留 Workbox 默认忽略规则，排除低频粒子引擎与粒子特效分片（触发时由 runtime CacheFirst 按需缓存）
        globIgnores: [
          '**/node_modules/**/*',
          'sw.js',
          'workbox-*.js',
          'assets/vendor-tsparticles-*.js',
          'assets/FireworkEffect-*.js',
          'assets/LanternFallEffect-*.js',
        ],
        runtimeCaching: [
          {
            urlPattern: /\.(?:js|css|woff2?|png|svg|ico)$/,
            handler: 'CacheFirst',
          },
          {
            urlPattern: /^\/api\/v1\/.*/,
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor-react',
              test: /[\\/]node_modules[\\/](?:react|react-dom|scheduler|react-router|react-router-dom)[\\/]/,
              priority: 60,
            },
            {
              name: 'vendor-state',
              test: /[\\/]node_modules[\\/](?:@tanstack[\\/]react-query|@tanstack[\\/]query-core|zustand)[\\/]/,
              priority: 50,
            },
            {
              name: 'vendor-radix',
              test: /[\\/]node_modules[\\/](?:@radix-ui|clsx|class-variance-authority|tailwind-merge)[\\/]/,
              priority: 40,
            },
            {
              name: 'vendor-motion',
              test: /[\\/]node_modules[\\/](?:framer-motion|motion-dom|motion-utils)[\\/]/,
              priority: 30,
            },
            {
              name: 'vendor-calendar',
              test: /[\\/]node_modules[\\/](?:react-big-calendar|react-dnd|react-dnd-html5-backend|dnd-core)[\\/]/,
              priority: 25,
            },
            {
              name: 'vendor-tsparticles',
              test: /[\\/]node_modules[\\/](?:@tsparticles|tsparticles)[\\/]/,
              priority: 20,
            },
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
