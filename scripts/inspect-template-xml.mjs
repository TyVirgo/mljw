import fs from 'fs'

const xml = fs.readFileSync('temp-template/word/document.xml', 'utf8')
const paras = [...xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)]

function extractPara(pXml) {
  const text = [...pXml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join('')
  const pStyle = pXml.match(/<w:pStyle w:val="(\d+)"/)?.[1] || null
  const numId = pXml.match(/<w:numId w:val="(\d+)"/)?.[1] || null
  const ilvl = pXml.match(/<w:ilvl w:val="(\d+)"/)?.[1] || null
  const hasTbl = pXml.includes('<w:tbl')
  return { text: text.trim(), pStyle, numId, ilvl, raw: pXml.slice(0, 500), hasTbl }
}

// show sample XML for key styles
const targets = ['菜单介绍', '页面展示字段', '新增—字段信息表', '菜单功能清单', '功能按钮', '数据前后流转', '业务流关系', '原型参考']
for (let i = 0; i < paras.length; i++) {
  const p = extractPara(paras[i][0])
  if (targets.some((t) => p.text.includes(t))) {
    console.log('\n===', p.text.slice(0, 80), 'style=', p.pStyle, '===')
    console.log(paras[i][0].slice(0, 800))
  }
}

// table sample
const tbl = xml.match(/<w:tbl[\s\S]*?<\/w:tbl>/)
if (tbl) {
  console.log('\n=== TABLE SAMPLE ===')
  console.log(tbl[0].slice(0, 1200))
}
