import fs from 'fs'
import JSZip from 'jszip'

const p = 'c:/Users/admin/Desktop/马来教务/模板/厦大马来分校本科教务系统产品需求文档-学籍管理模块-V1.6.docx'
const zip = await JSZip.loadAsync(fs.readFileSync(p))
const xml = await zip.file('word/document.xml').async('string')

const labels = [
  '菜单内容简介',
  '页面展示字段信息',
  '支持查询检索的字段信息',
  '数据前后流转关系',
  '业务流关系',
  '原型参考链接',
]

for (const label of labels) {
  const re = new RegExp(`<w:p[^>]*>[\\s\\S]{0,600}?${label.replace(/[()]/g, '\\$&')}[\\s\\S]{0,200}?<\\/w:p>`)
  const m = xml.match(re)
  if (m) {
    const hasAutoNum = /<w:numId w:val="4"/.test(m[0])
    const hasSuppress = /<w:numId w:val="0"/.test(m[0])
    const text = [...m[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((x) => x[1]).join('')
    console.log(`\n=== ${label} ===`)
    console.log('text:', text)
    console.log('auto numId 4:', hasAutoNum, '| suppressed:', hasSuppress)
  }
}

// verify each module's menu intro starts at 1
const introBlocks = [...xml.matchAll(/菜单介绍[\s\S]{0,3000}?6、原型参考链接/g)]
console.log('\n模块菜单介绍块数:', introBlocks.length)
introBlocks.forEach((block, i) => {
  const t = [...block[0].matchAll(/<w:t[^>]*>(\d、[^<]*)<\/w:t>/g)].map((x) => x[1])
  console.log(`模块${i + 1} 序号标题:`, t.slice(0, 6).join(' | '))
})
