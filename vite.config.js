import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 部署在 /high/Academic System/20260529/ 子路径下，需配置 base
const base = '/high/Academic%20System/20260529/'

export default defineConfig({
  base,
  plugins: [vue()],
  server: {
    host: true,
    allowedHosts: ['.tunnelmole.net'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
 