import fs from 'fs'
import { loadTemplateAssets } from './prd/prd-xml.mjs'

loadTemplateAssets()
const fieldDataRowTemplate = fs.readFileSync('temp-template/dataRow.xml', 'utf8')
const row = ['1', '学号', 'Student ID', '文本', '是', '唯一', '主键', '否', 'XMUM2309001']

function escapeXml(text) {
  return String(text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function replaceCellText(cellXml, text) {
  const safe = escapeXml(text)
  if (cellXml.includes('<w:t')) {
    return cellXml.replace(/<w:t[^>]*>[\s\S]*?<\/w:t>/, `<w:t xml:space="preserve">${safe}</w:t>`)
  }
  return cellXml.replace(
    /<\/w:tcPr>/,
    `</w:tcPr><w:p><w:r><w:t xml:space="preserve">${safe}</w:t></w:r></w:p>`,
  )
}

const cellMatches = [...fieldDataRowTemplate.matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)].map((m) => m[0])
console.log('cell count', cellMatches.length)
console.log('cell0 includes <w:t tag?', /<w:t[\s>]/.test(cellMatches[0]))
console.log('cell0 indexOf <w:t', cellMatches[0].indexOf('<w:t'))
const filled = replaceCellText(cellMatches[0], row[0])
console.log('filled cell:', filled.slice(0, 400))
console.log('includes 1?', filled.includes('>1<'))
