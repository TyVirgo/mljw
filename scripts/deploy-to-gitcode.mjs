/**
 * 将 build:deploy 产物复制到 gitcode 日期目录，供 SourceTree 提交后云端静态访问。
 * 用法: node scripts/deploy-to-gitcode.mjs [目标目录]
 * 默认: D:/gitcode/Academic System/20260624
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const defaultTarget = 'D:/gitcode/Academic System/20260624'
const targetDir = path.resolve(process.argv[2] || defaultTarget)

const files = ['index.html', 'favicon.svg']
const dirs = ['assets']

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function copyFile(name) {
  const from = path.join(root, name)
  const to = path.join(targetDir, name)
  if (!fs.existsSync(from)) {
    console.warn(`Skip missing: ${name}`)
    return
  }
  fs.copyFileSync(from, to)
  console.log('Copied file:', name)
}

function copyDir(name) {
  const from = path.join(root, name)
  const to = path.join(targetDir, name)
  if (!fs.existsSync(from)) {
    throw new Error(`Missing directory: ${from} — run npm run build:deploy first`)
  }
  fs.rmSync(to, { recursive: true, force: true })
  fs.cpSync(from, to, { recursive: true })
  console.log('Copied dir:', name)
}

ensureDir(targetDir)
for (const f of files) copyFile(f)
for (const d of dirs) copyDir(d)

console.log('\nDeploy complete:', targetDir)
console.log('Cloud URL (示例): /high/Academic System/20260624/')
