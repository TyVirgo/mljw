import { execSync } from 'child_process'
import fs from 'fs'

const file = process.argv[2]
const tmp = 'temp-v12-check'
fs.mkdirSync(tmp, { recursive: true })
fs.copyFileSync(file, `${tmp}/doc.zip`)
execSync(`powershell -Command "Expand-Archive -Path '${tmp}/doc.zip' -DestinationPath '${tmp}' -Force"`, {
  stdio: 'ignore',
})
const xml = fs.readFileSync(`${tmp}/word/document.xml`, 'utf8')
const paras = [...xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)]
  .map((p) => [...p[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join('').trim())
  .filter(Boolean)

const keys = ['V1.2', '新增—字段信息表', '菜单功能清单', '下钻页面说明', '数据前后流转', '功能按钮/开关', '附录：变更包']
for (const k of keys) {
  const count = paras.filter((p) => p.includes(k)).length
  console.log(k, count)
}
console.log('total paragraphs', paras.length)
console.log('tables', (xml.match(/<w:tbl/g) || []).length)
