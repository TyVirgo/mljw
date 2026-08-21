/**
 * 将 vite build 完整产物（dist/）复制到 gitcode 日期目录，供 SourceTree 提交后云端静态访问。
 * 从 dist/ 整包复制，不覆盖项目根目录，本地 npm start 不受影响。
 * 用法: node scripts/deploy-to-gitcode.mjs [目标目录]
 * 默认: D:/gitcode/Academic System/20260817
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const distDir = path.join(root, 'dist')

const defaultTarget = 'D:/gitcode/Academic System/20260817'
const targetDir = path.resolve(process.argv[2] || defaultTarget)
const cloudPath = `/high/Academic System/${path.basename(targetDir)}/`

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function syncDistToTarget() {
  const entries = fs.readdirSync(distDir, { withFileTypes: true })
  for (const entry of entries) {
    const from = path.join(distDir, entry.name)
    const to = path.join(targetDir, entry.name)
    if (entry.isDirectory()) {
      fs.rmSync(to, { recursive: true, force: true })
      fs.cpSync(from, to, { recursive: true })
      console.log('Copied dir:', entry.name)
    } else {
      fs.copyFileSync(from, to)
      console.log('Copied file:', entry.name)
    }
  }
}

if (!fs.existsSync(distDir)) {
  throw new Error('Missing dist/ — run vite build first')
}

ensureDir(targetDir)
syncDistToTarget()

const readmePath = path.join(targetDir, 'README.txt')
fs.writeFileSync(
  readmePath,
  [
    'Academic System Prototype — static build',
    `Folder: ${targetDir}`,
    `Cloud path: ${cloudPath}`,
    '',
    'SourceTree: commit and push this folder to gitcode.',
    'Open index.html via cloud server (not file://) for correct asset paths.',
    `Built from: ${root}`,
    `Date: ${new Date().toISOString().slice(0, 10)}`,
    '',
  ].join('\n'),
  'utf8',
)
console.log('Wrote README.txt')

console.log('\nDeploy complete:', targetDir)
console.log('Cloud URL:', cloudPath)
console.log('Entry: index.html (click to open prototype)')

// 确保本地 dev 的 index.html 始终为开发入口（/src/main.js）
const devIndexSource = path.join(root, 'index.source.html')
const devIndexTarget = path.join(root, 'index.html')
if (fs.existsSync(devIndexSource)) {
  fs.copyFileSync(devIndexSource, devIndexTarget)
  console.log('Restored index.html for local dev')
}
