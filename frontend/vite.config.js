import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'

export default defineConfig({
  plugins: [react(), visualizer({ open: true })],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../backend/static/frontend'),
    emptyOutDir: true,
    manifest: true,  // Damit manifest.json erzeugt wird ✅
    rollupOptions: {
      input: 'src/main.jsx',  // 👈 Das ist die entscheidende Zeile!
    },
  },  
})
