import fs from 'fs'
import path from 'path'

const file = process.argv[2]
if (!file) {
  console.error('Usage: node inspect-docx.mjs <path>')
  process.exit(1)
}

const tmp = path.join('temp-inspect')
fs.mkdirSync(tmp, { recursive: true })
fs.copyFileSync(file, path.join(tmp, 'doc.zip'))
import { execSync } from 'child_process'
execSync(`powershell -Command "Expand-Archive -Path '${path.join(tmp, 'doc.zip')}' -DestinationPath '${tmp}' -Force"`, {
  stdio: 'inherit',
})

const xml = fs.readFileSync(path.join(tmp, 'word/document.xml'), 'utf8')
const paras = [...xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].map((p) => {
  const ts = [...p[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join('')
  return ts.trim()
}).filter(Boolean)

console.log('File:', file)
console.log('Paragraphs:', paras.length)
paras.slice(0, 80).forEach((p, i) => console.log(`${i + 1}. ${p.slice(0, 150)}`))
