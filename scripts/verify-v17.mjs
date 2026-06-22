import fs from 'fs'
import JSZip from 'jszip'

const p = 'c:/Users/admin/Desktop/马来教务/模板/厦大马来分校本科教务系统产品需求文档-学籍管理模块-V1.7.docx'
const zip = await JSZip.loadAsync(fs.readFileSync(p))
const xml = await zip.file('word/document.xml').async('string')
const texts = [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join('')

const checks = [
  ['V1.7', texts.includes('V1.7')],
  ['异动类别', texts.includes('2.2.1.2 异动类别')],
  ['学籍异动维护', texts.includes('2.2.1.5 学籍异动维护')],
  ['学籍异动查询', texts.includes('2.2.1.6 学籍异动查询')],
  ['三实施行为开关', texts.includes('三个实施行为开关') || texts.includes('实施行为开关')],
  ['autoImplement 或 自动实施', texts.includes('是否自动实施') || texts.includes('自动实施')],
  ['维护与查询职责分离', texts.includes('2.4 维护与查询职责分离')],
  ['ExportModal xlsx', texts.includes('ExportModal') && texts.includes('xlsx')],
  ['9个模块菜单介绍', (texts.match(/1、菜单内容简介/g) || []).length === 9],
]

for (const [k, v] of checks) console.log(k, v ? 'OK' : 'FAIL')

console.log('1、菜单内容简介 出现次数', (texts.match(/1、菜单内容简介/g) || []).length)
