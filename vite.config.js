import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// gitcode 云端子路径（仅 build 使用）；本地 dev / tunnelmole 用根路径 /
// 与云端目录一致，勿改写/编码空格：/high/Academic System/20261103/
const deployBase = '/high/Academic System/20261103/'

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
 