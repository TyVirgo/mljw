import fs from 'fs'

const table1 = fs.readFileSync('temp-template/table1.xml', 'utf8')
const tblPr = table1.match(/<w:tblPr>[\s\S]*?<\/w:tblPr>/)?.[0] || ''
const tblGrid = table1.match(/<w:tblGrid>[\s\S]*?<\/w:tblGrid>/)?.[0] || ''
const rows = [...table1.matchAll(/<w:tr[\s\S]*?<\/w:tr>/g)].map((m) => m[0])
console.log('rows', rows.length)
fs.writeFileSync('temp-template/tblPr.xml', tblPr)
fs.writeFileSync('temp-template/tblGrid.xml', tblGrid)
fs.writeFileSync('temp-template/headerRow.xml', rows[0])
fs.writeFileSync('temp-template/dataRow.xml', rows[1] || rows[0])
console.log('header row cells', (rows[0].match(/<w:tc/g) || []).length)
console.log('data row cells', ((rows[1] || rows[0]).match(/<w:tc/g) || []).length)
