import fs from 'fs'
import JSZip from 'jszip'

const p = 'c:/Users/admin/Desktop/马来教务/模板/厦大马来分校本科教务系统产品需求文档-学籍管理模块-V2.3.docx'
const xml = await JSZip.loadAsync(fs.readFileSync(p)).then((z) => z.file('word/document.xml').async('string'))
for (const t of ['2.2.1.8', '2.2.1.3', '2.2.1.1']) {
  const idx = xml.indexOf(t)
  const snip = xml.slice(idx - 200, idx + 300)
  const style = snip.match(/w:pStyle w:val="(\d+)"/)
  console.log(t, 'style', style?.[1])
}
