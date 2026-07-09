import fs from 'fs'
import JSZip from 'jszip'

const TARGET =
  'c:/Users/admin/Desktop/马来教务/模板/厦大马来分校本科教务系统产品需求文档-学籍管理模块-V2.2.docx'

const buf = fs.readFileSync(TARGET)
const zip = await JSZip.loadAsync(buf)
const xml = await zip.file('word/document.xml').async('string')

const shouldHave = [
  '文档版本：V2.2',
  'MovementApprovalLogTable',
  '默认转专业',
  'Preview PDF',
  'Student Pass Expiry',
  '2.8 V2.2',
  'Section II : STUDENT APPLICATION',
  'keyword',
]

const shouldReduce = [
  'ApprovalTimeline',
  '默认休学',
  '文档版本：V2.0',
  '详情抽屉含时间线',
  '生效学期',
  'V2.0 行内仅',
  '顶部时间线',
  '顶部竖向时间线',
]

console.log('=== 应包含 ===')
for (const s of shouldHave) {
  console.log(s, xml.includes(s) ? 'OK' : 'MISSING')
}

console.log('\n=== 应减少/消除 ===')
for (const s of shouldReduce) {
  const n = xml.split(s).length - 1
  console.log(s, 'count=', n)
}

// extract version block
const full = [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join('')
const vi = full.indexOf('文档版本')
console.log('\n版本块:', full.slice(vi, vi + 400))
