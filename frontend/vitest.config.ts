import process from 'node:process'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    exclude: ['e2e/**', 'node_modules/**'],
    reporters: process.env.CI ? ['default'] : ['dot'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
