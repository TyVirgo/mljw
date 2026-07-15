import fs from 'fs'
import { extractDocxText, splitBySections, sectionText } from './extract-prd-sections.mjs'

const V20 = 'd:/任务/马来/马来教务/模板/厦大马来分校本科教务系统产品需求文档-学籍管理模块-V2.0.docx'
const V24 = 'd:/任务/马来/马来教务/模板/厦大马来分校本科教务系统产品需求文档-学籍管理模块-V2.4.docx'

async function getModule(path, id) {
  const sec = splitBySections(await extractDocxText(path)).find((s) => s.id === id)
  return sec ? { title: sec.title, text: sectionText(sec) } : null
}

function pick(text, patterns) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && patterns.some((p) => (typeof p === 'string' ? l.includes(p) : p.test(l))))
}

function listFieldNames(text) {
  const list = text.split('\n').map((l) => l.trim())
  const names = []
  let inList = false
  for (let i = 0; i < list.length; i++) {
    if (list[i] === '字段中文名称') inList = true
    if (inList && /^\d+$/.test(list[i])) {
      const zh = list[i + 1]
      if (zh && !/^(字段|英文|序号|—)/.test(zh) && zh.length < 30) names.push(zh)
    }
    if (inList && /^3、支持查询/.test(list[i])) break
  }
  return [...new Set(names)]
}

function listButtons(text) {
  return pick(text, [/^(\d+)、功能按钮\/开关——/]).map((l) => l.replace(/^(\d+)、功能按钮\/开关——/, ''))
}

const ids = [
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

for (const id of ids) {
  const a = await getModule(V20, id)
  const b = await getModule(V24, id)
  console.log('\n===== ' + id + ' =====')
  for (const [label, m] of [
    ['V2.0', a],
    ['V2.4', b],
  ]) {
    if (!m) {
      console.log(label + ': 无此章节')
      continue
    }
    console.log(label + ' title:', m.title)
    const intro = m.text.split('1、菜单内容简介')[1]?.split('2、页面展示')[0] || ''
    console.log(label + ' intro:', intro.replace(/\s+/g, ' ').slice(0, 450))
    console.log(label + ' listFields:', listFieldNames(m.text).join('、'))
    console.log(label + ' buttons:', listButtons(m.text).slice(0, 12).join(' | '))
    console.log(
      label + ' key:',
      pick(m.text, [
        /^1）说明：/,
        /^2）前置条件：/,
        /^3）下游输出：/,
        /^操作流程：/,
        /行操作/,
        /工具栏/,
        /搜索区/,
        /下钻页面说明：/,
      ])
        .slice(0, 8)
        .map((s) => s.slice(0, 120))
        .join('\n  '),
    )
  }
}

// cover notes
for (const [label, p] of [
  ['V2.0', V20],
  ['V2.4', V24],
]) {
  const nodes = await extractDocxText(p)
  const note = nodes.find((n) => n.startsWith('说明：'))
  console.log('\n' + label + ' cover:', note?.slice(0, 350))
}
