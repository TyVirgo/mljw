import fs from 'fs'

const xml = fs.readFileSync('temp-template/word/document.xml', 'utf8')
const paras = [...xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].map((m, i) => {
  const text = [...m[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((x) => x[1]).join('').trim()
  const pStyle = m[0].match(/<w:pStyle w:val="(\d+)"/)?.[1] || ''
  return { i, pStyle, text }
})

paras.forEach((p) => {
  if (p.text) console.log(`${p.i}\t[${p.pStyle}]\t${p.text.slice(0, 100)}`)
})

// find tbl positions
let idx = 0
for (const m of xml.matchAll(/<w:tbl[\s\S]*?<\/w:tbl>/g)) {
  const firstText = [...m[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((x) => x[1]).join('').slice(0, 60)
  console.log('TABLE', idx++, 'at', m.index, firstText)
}
