import fs from 'fs'

const xml = fs.readFileSync('temp-template/word/document.xml', 'utf8')
const tables = [...xml.matchAll(/<w:tbl[\s\S]*?<\/w:tbl>/g)]
console.log('tables', tables.length)
fs.writeFileSync('temp-template/table0.xml', tables[0][0])
fs.writeFileSync('temp-template/table1.xml', tables[1][0])
console.log('table0 len', tables[0][0].length)
console.log('table1 len', tables[1][0].length)

// count rows in table1
const rows = [...tables[1][0].matchAll(/<w:tr[\s\S]*?<\/w:tr>/g)]
console.log('table1 rows', rows.length)
if (rows[1]) fs.writeFileSync('temp-template/table1-row-sample.xml', rows[1][0])
