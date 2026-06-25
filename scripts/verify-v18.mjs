import fs from 'fs'
import JSZip from 'jszip'

const p = 'c:/Users/admin/Desktop/马来教务/模板/厦大马来分校本科教务系统产品需求文档-学籍管理模块-V1.8.docx'
const zip = await JSZip.loadAsync(fs.readFileSync(p))
const xml = await zip.file('word/document.xml').async('string')
const texts = [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join('')

const checks = [
  ['V1.8', texts.includes('V1.8')],
  ['2.5 异动展示与格式约定', texts.includes('2.5 异动展示与格式约定')],
  ['YYYY-MM-DD', texts.includes('YYYY-MM-DD')],
  ['申请学年学期', texts.includes('申请学年学期')],
  ['pill Badge', texts.includes('pill') || texts.includes('Badge')],
  ['护照/IC 脱敏', texts.includes('脱敏') || texts.includes('maskPassportIc')],
  ['15 列', texts.includes('15')],
  ['ExportModal', texts.includes('ExportModal')],
  ['无 sortable', texts.includes('无 sortable') || texts.includes('sortable')],
  ['9 个可选扩展列', texts.includes('9 个可选') || texts.includes('9 个可选扩展列')],
]

for (const [k, v] of checks) console.log(k, v ? 'OK' : 'FAIL')
