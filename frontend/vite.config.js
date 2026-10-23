import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // En desarrollo (npm run dev) las llamadas a /api van al backend local
  server: {
    proxy: { '/api': 'http://localhost:3000' },
  },
  // El build queda dentro del backend: la VM no necesita instalar Vite ni compilar nada
  build: {
    outDir: '../backend/public',
    emptyOutDir: true,
  },
})