import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// gitcode 云端子路径（仅 build 使用）；本地 dev / tunnelmole 用根路径 /
const deployBase = '/high/Academic%20System/20260803/'

export default defineConfig(({ command }) => ({
  base:
    process.env.VITE_BASE ??
    (command === 'serve' || process.env.VERCEL ? '/' : deployBase),
  plugins: [vue()],
  server: {
    host: true,
    allowedHosts: ['.tunnelmole.net'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
}))
 