import fs from 'fs'
import JSZip from 'jszip'

const p = 'c:/Users/admin/Desktop/马来教务/模板/厦大马来分校本科教务系统产品需求文档-学籍管理模块-V2.4.docx'
const xml = await JSZip.loadAsync(fs.readFileSync(p)).then((z) => z.file('word/document.xml').async('string'))
const nodes = [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1])

const patterns = [
  /Modal/i,
  /Recall/i,
  /Review/i,
  /Create\/Edit/i,
  /Download Consent/i,
  /ConsentForm/i,
  /Form Modal/i,
  /[^标签]Tab[^页]/,
  /嵌入/,
  /Section /,
  /History/,
  /Edit 打开/,
  /Movement[A-Z]/,
]

for (const n of nodes) {
  if (patterns.some((re) => re.test(n)) && n.length > 8) {
    console.log(n.slice(0, 160))
  }
}
