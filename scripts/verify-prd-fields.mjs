import fs from 'fs'
import JSZip from 'jszip'
import { loadTemplateAssets, buildFieldTable } from './prd/prd-xml.mjs'
import { profileListFields, profileFormFields, profileSearchFields } from './prd/prd-content.mjs'

loadTemplateAssets()
const sample = buildFieldTable(profileListFields.slice(0, 2))
console.log('sample table has w:t count:', (sample.match(/<w:t/g) || []).length)
console.log('profileListFields rows:', profileListFields.length)
console.log('profileFormFields rows:', profileFormFields.length)
console.log('profileSearchFields rows:', profileSearchFields.length)
console.log('first list row:', profileListFields[0])
console.log('sample snippet:', sample.includes('XMUM2309001') ? 'has student id' : 'missing')
console.log('sample snippet2:', sample.slice(0, 500))

const p = 'c:/Users/admin/Desktop/马来教务/模板/厦大马来分校本科教务系统产品需求文档-学籍管理模块-V1.3.docx'
if (fs.existsSync(p)) {
  const zip = await JSZip.loadAsync(fs.readFileSync(p))
  const xml = await zip.file('word/document.xml').async('string')
  const keys = ['学号', 'Student ID', '列表页表格展示字段如下', '新增/编辑表单', '字段中文名称', 'Tan Wei Ming', 'Deferment Period', '英文姓名']
  for (const k of keys) console.log(k, (xml.split(k).length - 1), 'occurrences')
  // find first w:tbl after 页面展示
  const i = xml.indexOf('（1）页面展示字段信息')
  console.log('section index', i)
  if (i > 0) console.log('next 2000 chars:', xml.slice(i, i + 2000))
}
