import fs from 'fs'
import { extractDocxText, splitBySections, sectionText } from './extract-prd-sections.mjs'

const V20 = 'd:/任务/马来/马来教务/模板/厦大马来分校本科教务系统产品需求文档-学籍管理模块-V2.0.docx'
const V24 = 'd:/任务/马来/马来教务/模板/厦大马来分校本科教务系统产品需求文档-学籍管理模块-V2.4.docx'

const s20 = splitBySections(await extractDocxText(V20))
const s24 = splitBySections(await extractDocxText(V24))

function snippet(text, max = 600) {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > max ? clean.slice(0, max) + '…' : clean
}

function findLines(text, patterns) {
  const lines = text.split('\n')
  return lines.filter((l) => patterns.some((p) => (typeof p === 'string' ? l.includes(p) : p.test(l))))
}

const moduleIds = [
  '2.2.1.1',
  '2.2.1.2',
  '2.2.1.3',
  '2.2.1.4',
  '2.2.1.4.1',
  '2.2.1.4.2',
  '2.2.1.4.3',
  '2.2.1.4.4',
  '2.2.1.5',
  '2.2.1.6',
  '2.2.1.7',
  '2.2.1.8',
  '2.2.1.9',
]

for (const id of moduleIds) {
  const a = s20.find((s) => s.id === id)
  const b = s24.find((s) => s.id === id)
  console.log('\n########', id, '########')
  if (!a) console.log('V2.0: （无此章节）')
  else {
    const t = sectionText(a)
    console.log('V2.0 title:', a.title)
    console.log('V2.0 intro:', snippet(t.split('1、菜单内容简介')[1]?.split('2、')[0] || t, 400))
    const hits = findLines(t, ['搜索', '列表', '字段', '详情', '审批', '流转', 'Tab', '导出', '预览', '撤销', '文号', 'keyword', 'Student'])
    console.log('V2.0 key lines:', hits.slice(0, 8).join(' | '))
  }
  if (!b) console.log('V2.4: （无此章节）')
  else {
    const t = sectionText(b)
    console.log('V2.4 title:', b.title)
    console.log('V2.4 intro:', snippet(t.split('1、菜单内容简介')[1]?.split('2、')[0] || t, 400))
    const hits = findLines(t, ['搜索', '列表', '字段', '详情', '审批', '流转', '标签页', '导出', '预览', '撤销', '文号', '五个', '学籍类型', '适用学生', '规则'])
    console.log('V2.4 key lines:', hits.slice(0, 8).join(' | '))
  }
}
