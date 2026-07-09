import fs from 'fs'
import JSZip from 'jszip'

const docxPath =
  'c:/Users/admin/Desktop/马来教务/模板/厦大马来分校本科教务系统产品需求文档-学籍管理模块-V2.0.docx'
const buf = fs.readFileSync(docxPath)
const zip = await JSZip.loadAsync(buf)
const xml = await zip.file('word/document.xml').async('string')

const keys = [
  '学籍异动维护',
  '学籍异动查询',
  '学籍异动审批',
  '学生基本信息',
  '默认休学',
  '默认转专业',
  '流转日志',
  'Section VII',
  '休学期间',
  'Preview PDF',
  '撤销',
  'Student Pass',
  '2.6 V2.0',
  '2.7 V2.1',
  '生效学期',
  '生效日期',
  '历史申请次序',
  '预览',
  'ApprovalTimeline',
  'MovementApprovalLogTable',
  '详情抽屉含时间线',
  '15 列',
  '查询只读',
]
for (const k of keys) {
  const count = xml.split(k).length - 1
  console.log(`${k}: ${count}`)
}
