import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const dist = path.join(root, 'dist')

const copyTargets = ['index.html', 'favicon.svg']

function copyFile(name) {
  const from = path.join(dist, name)
  const to = path.join(root, name)
  if (!fs.existsSync(from)) {
    throw new Error(`Missing build output: ${from}`)
  }
  fs.copyFileSync(from, to)
}

function copyDir(name) {
  const from = path.join(dist, name)
  const to = path.join(root, name)
  if (!fs.existsSync(from)) {
    throw new Error(`Missing build output: ${from}`)
  }
  fs.rmSync(to, { recursive: true, force: true })
  fs.cpSync(from, to, { recursive: true })
}

copyFile('index.html')
if (fs.existsSync(path.join(dist, 'favicon.svg'))) {
  copyFile('favicon.svg')
}
copyDir('assets')

console.log('Static files copied to project root for web server deployment.')
