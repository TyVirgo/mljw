import fs from 'fs'
import JSZip from 'jszip'

const templatePath =
  'c:/Users/admin/Desktop/马来教务/模板/厦大马来分校本科教务系统产品需求文档模板（空白模板）0610.docx'

const buf = fs.readFileSync(templatePath)
const zip = await JSZip.loadAsync(buf)
const xml = await zip.file('word/document.xml').async('string')

const texts = [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1])
let line = ''
const lines = []
for (const t of texts) {
  if (t.includes('\n') || xml.includes(`<w:br`)) {
    // rough paragraph break detection via w:p boundaries
  }
  line += t
  if (xml.indexOf(`<w:p`) !== -1) {
    // split by paragraph tags instead
  }
}

// Split by paragraph boundaries
const paras = xml.split(/<w:p[\s>]/).slice(1)
const output = paras.map((p) => {
  const ts = [...p.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1])
  return ts.join('').trim()
}).filter(Boolean)

paras.forEach((p, i) => {
  const ts = [...p.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1])
  const text = ts.join('').trim()
  if (text) console.log(`${i}: ${text}`)
})
