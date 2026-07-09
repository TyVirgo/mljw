import fs from 'fs'
import JSZip from 'jszip'

const p =
  'c:/Users/admin/Desktop/马来教务/模板/厦大马来分校本科教务系统产品需求文档-学籍管理模块-V2.3.docx'
const buf = fs.readFileSync(p)
const zip = await JSZip.loadAsync(buf)
const xml = await zip.file('word/document.xml').async('string')
const full = [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join('')

const shouldHave = [
  '文档版本：V2.3',
  '2.9 V2.3',
  'ApprovalTimeline',
  '审批流程图在上',
  '异动规则设置',
  '文号',
  '导出学籍卡',
  '适用学生范围',
]
const shouldReduce = [
  '文档版本：V2.2',
  '申请内容在上 + 审批日志四列表格',
  '管理端查询/维护/审批列表增加撤销',
  'keyword 搜索',
  'Last Action Time（表头 tooltip）',
  'MovementApprovalLogTable 四列表格置于申请详情下方',
]

console.log('=== 应包含 ===')
for (const s of shouldHave) console.log(s, full.includes(s) ? 'OK' : 'MISSING')

console.log('\n=== 应减少/消除 ===')
for (const s of shouldReduce) {
  console.log(s, 'count=', full.split(s).length - 1)
}

const vi = full.indexOf('文档版本')
console.log('\n版本块:\n', full.slice(vi, vi + 550))

const i28 = full.indexOf('2.8 V2.2')
if (i28 >= 0) console.log('\n§2.8片段:\n', full.slice(i28, i28 + 350))
