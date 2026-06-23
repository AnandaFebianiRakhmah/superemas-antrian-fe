import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://classical-ricky-superemas-23d4a4a4.koyeb.app',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'https://classical-ricky-superemas-23d4a4a4.koyeb.app',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
