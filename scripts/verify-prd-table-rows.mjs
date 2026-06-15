import fs from 'fs'
import JSZip from 'jszip'
import { loadTemplateAssets, buildFieldTable } from './prd/prd-xml.mjs'
import { profileListFields, profileFormFields } from './prd/prd-content.mjs'

function cellTexts(trXml) {
  return [...trXml.matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)].map((tc) =>
    [...tc[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
      .map((m) => m[1])
      .join('')
      .trim(),
  )
}

loadTemplateAssets()
console.log('=== Generated table sample (list, 3 rows) ===')
const listTbl = buildFieldTable(profileListFields.slice(0, 3))
const listRows = [...listTbl.matchAll(/<w:tr[\s\S]*?<\/w:tr>/g)].map((m) => cellTexts(m[0]))
listRows.forEach((r, i) => console.log(`row${i}:`, r))

console.log('\n=== Generated table sample (form, 3 rows) ===')
const formTbl = buildFieldTable(profileFormFields.slice(0, 3))
const formRows = [...formTbl.matchAll(/<w:tr[\s\S]*?<\/w:tr>/g)].map((m) => cellTexts(m[0]))
formRows.forEach((r, i) => console.log(`row${i}:`, r))

const p = 'c:/Users/admin/Desktop/马来教务/模板/厦大马来分校本科教务系统产品需求文档-学籍管理模块-V1.4.docx'
const zip = await JSZip.loadAsync(fs.readFileSync(p))
const xml = await zip.file('word/document.xml').async('string')

// locate first list table after student basic info section
const marker = '2.2.1.1 学生基本信息'
const start = xml.indexOf(marker)
const listNote = xml.indexOf('列表页表格展示字段如下：', start)
const tblStart = xml.indexOf('<w:tbl>', listNote)
const tblEnd = xml.indexOf('</w:tbl>', tblStart) + 8
const firstTbl = xml.slice(tblStart, tblEnd)
const docRows = [...firstTbl.matchAll(/<w:tr[\s\S]*?<\/w:tr>/g)].map((m) => cellTexts(m[0]))
console.log('\n=== DOC first student profile LIST table rows ===')
docRows.forEach((r, i) => console.log(`row${i}:`, r))

const formMarker = '新增/编辑表单主要字段（七 Tab 汇总）：'
const formNote = xml.indexOf(formMarker, start)
const formTblStart = xml.indexOf('<w:tbl>', formNote)
const formTblEnd = xml.indexOf('</w:tbl>', formTblStart) + 8
const formTblXml = xml.slice(formTblStart, formTblEnd)
const docFormRows = [...formTblXml.matchAll(/<w:tr[\s\S]*?<\/w:tr>/g)].map((m) => cellTexts(m[0]))
console.log('\n=== DOC first student profile FORM table rows (first 5) ===')
docFormRows.slice(0, 5).forEach((r, i) => console.log(`row${i}:`, r))
console.log('form table total rows:', docFormRows.length)
