import fs from 'fs'
import JSZip from 'jszip'

const p = 'c:/Users/admin/Desktop/马来教务/模板/厦大马来分校本科教务系统产品需求文档-学籍管理模块-V2.4.docx'
const xml = await JSZip.loadAsync(fs.readFileSync(p)).then((z) => z.file('word/document.xml').async('string'))
const full = [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join('')

const keywords = [
  '审批流程',
  '在上',
  '文号',
  '修改文号',
  '导出PDF',
  '预览PDF',
  '五个独立',
  '学籍类型',
  '适用学生',
  '管理端撤销',
  '最近审核',
  '2.2.1.7',
  '四条内置规则',
  '审批历史',
]

for (const k of keywords) {
  console.log(k, full.includes(k) ? 'YES' : 'NO', full.split(k).length - 1)
}
