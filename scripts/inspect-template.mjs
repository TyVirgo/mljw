import fs from 'fs'

const xml = fs.readFileSync('temp-template/word/document.xml', 'utf8')
const paras = [...xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].map((p) => {
  const ts = [...p[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join('')
  const pStyle = p[0].match(/<w:pStyle w:val="([^"]+)"/)?.[1] || ''
  return { text: ts.trim(), style: pStyle }
}).filter((p) => p.text)

console.log('Total paragraphs:', paras.length)
paras.forEach((p, i) => {
  const tag = p.style ? `[${p.style}]` : ''
  console.log(`${String(i + 1).padStart(3)} ${tag} ${p.text.slice(0, 180)}`)
})
