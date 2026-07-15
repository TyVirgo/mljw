import fs from 'fs'
import JSZip from 'jszip'

const p = 'd:/任务/马来/马来教务/学籍管理/变更说明书 -模板.docx'
const z = await JSZip.loadAsync(fs.readFileSync(p))
const xml = await z.file('word/document.xml').async('string')

const texts = [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1])
texts.forEach((t, i) => {
  if (/^[一二三四五六]、|^4\.\d|^修改|^删除|^新增|^合计|^说明：|^文档版本|^编制日期|^修改前文档|^修改后文档/.test(t) || t.includes('变更说明书')) {
    console.log(i, t.slice(0, 100))
  }
})

const tblStart = xml.indexOf('<w:tbl>')
const tblEnd = xml.indexOf('</w:tbl>', tblStart) + 8
const tbl = xml.slice(tblStart, tblEnd)
const rows = [...tbl.matchAll(/<w:tr[\s\S]*?<\/w:tr>/g)]
console.log('\nTABLE rows:', rows.length)
console.log('DATA ROW XML length:', rows[1][0].length)
