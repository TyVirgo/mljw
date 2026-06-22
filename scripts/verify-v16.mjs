import fs from 'fs'
import JSZip from 'jszip'

const p = 'c:/Users/admin/Desktop/马来教务/模板/厦大马来分校本科教务系统产品需求文档-学籍管理模块-V1.6.docx'
const zip = await JSZip.loadAsync(fs.readFileSync(p))
const xml = await zip.file('word/document.xml').async('string')
const texts = [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join('')

const checks = [
  ['V1.6', texts.includes('V1.6')],
  ['无附录', !texts.includes('附录：OpenSpec')],
  ['菜单1-6编号', texts.includes('1、菜单内容简介') && texts.includes('6、原型参考链接')],
  ['丰富菜单介绍', texts.includes('学生基本信息管理，包含新增')],
  ['保存草稿按钮', texts.includes('保存草稿')],
  ['下钻页面描述', texts.includes('下钻至')],
  ['无下钻页面', texts.includes('无下钻页面')],
  ['按钮交叉引用', texts.includes('本清单第')],
]

for (const [k, v] of checks) console.log(k, v ? 'OK' : 'FAIL')

console.log('1、菜单内容简介 出现次数', (texts.match(/1、菜单内容简介/g) || []).length)
console.log('6、原型参考链接 出现次数', (texts.match(/6、原型参考链接/g) || []).length)
console.log('自动编号 numId=4 残留', xml.includes('numId w:val="4"') ? 'FAIL' : 'OK')

const badPatterns = [
  /Search\/Reset/,
  /Form Modal/,
  /Tab【转专业】/,
  /movementStore/,
  /students 与/,
]
for (const re of badPatterns) {
  if (re.test(texts)) console.log('WARN 英文混写:', re.source)
}
