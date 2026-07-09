import fs from 'fs'
import JSZip from 'jszip'

const p =
  'c:/Users/admin/Desktop/马来教务/模板/厦大马来分校本科教务系统产品需求文档-学籍管理模块-V2.2.docx'
const buf = fs.readFileSync(p)
const zip = await JSZip.loadAsync(buf)
const xml = await zip.file('word/document.xml').async('string')
const full = [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join('')

for (const k of [
  '学籍异动维护',
  '学籍异动查询',
  '知情同意书',
  '学生基本信息',
  '申请内容在上',
  '管理端查询/维护/审批',
  'keyword',
  'Preview PDF',
  '2.8 V2.2',
  'MovementApprovalLogTable 四列表格',
]) {
  const i = full.indexOf(k)
  if (i >= 0) console.log('---' + k + '---\n' + full.slice(i, i + 220) + '\n')
}
