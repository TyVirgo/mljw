import fs from 'fs'
import JSZip from 'jszip'

const p = 'd:/任务/马来/马来教务/学籍管理/变更说明书 -模板.docx'
const z = await JSZip.loadAsync(fs.readFileSync(p))
const xml = await z.file('word/document.xml').async('string')

const tblStart = xml.indexOf('<w:tbl>')
const tblEnd = xml.indexOf('</w:tbl>', tblStart) + 8
const tbl = xml.slice(tblStart, tblEnd)
const rows = [...tbl.matchAll(/<w:tr[\s\S]*?<\/w:tr>/g)]
console.log('row0 cells:', (rows[0][0].match(/<w:tc/g) || []).length)
console.log('row1 sample:\n', rows[1][0].slice(0, 1500))
fs.writeFileSync('scripts/template-table-row-sample.xml', rows[1][0])

// sample body paragraph before section 一
const idx = xml.indexOf('一、文档对比说明')
const pStart = xml.lastIndexOf('<w:p', idx)
const pEnd = xml.indexOf('</w:p>', idx) + 6
fs.writeFileSync('scripts/template-heading-sample.xml', xml.slice(pStart, pEnd))

// sample normal paragraph
const idx2 = xml.indexOf('本变更说明书对比')
const pStart2 = xml.lastIndexOf('<w:p', idx2)
const pEnd2 = xml.indexOf('</w:p>', idx2) + 6
fs.writeFileSync('scripts/template-body-para-sample.xml', xml.slice(pStart2, pEnd2))
