import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/cras/',
  envDir: '..',
  plugins: [
    react(),
    tailwindcss(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
  server: {
    port: 5175,
    host: '0.0.0.0',
    allowedHosts: ['omnikog.asuscomm.com'],
  },
})
