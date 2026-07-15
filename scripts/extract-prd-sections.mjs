import fs from 'fs'
import JSZip from 'jszip'

export async function extractDocxText(docxPath) {
  const xml = await JSZip.loadAsync(fs.readFileSync(docxPath)).then((z) =>
    z.file('word/document.xml').async('string'),
  )
  return [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) =>
    m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
  )
}

export function splitBySections(nodes) {
  const sections = []
  let current = null

  for (const n of nodes) {
    const m = n.match(/^(2\.2\.1(?:\.\d+)+)\s+(.+)/)
    if (m) {
      if (current) sections.push(current)
      current = { id: m[1], title: `${m[1]} ${m[2]}`, lines: [] }
      continue
    }
    if (/^2\.2\.1\.\d+\s/.test(n)) {
      if (current) sections.push(current)
      current = { id: n.split(/\s/)[0], title: n, lines: [] }
      continue
    }
    if (current && n.trim()) current.lines.push(n.trim())
  }
  if (current) sections.push(current)
  return sections
}

export function sectionText(section) {
  return section.lines.join('\n')
}

export function pickKeywords(text) {
  const keys = [
    '搜索', '字段', '列表', 'Tab', '标签页', '抽屉', '弹窗', '详情', '审批', '流程图',
    '文号', '导出', '预览', 'PDF', '撤销', '学籍类型', '适用学生', '规则', '导入',
    '列', '按钮', '流转日志', '版本快照', '家长', '附件', '默认', '休学', '转专业',
  ]
  return keys.filter((k) => text.includes(k))
}

if (process.argv[1]?.includes('extract-prd-sections')) {
  const path = process.argv[2]
  const nodes = await extractDocxText(path)
  const sections = splitBySections(nodes)
  for (const s of sections) {
    console.log('\n===', s.title, '===')
    console.log(sectionText(s).slice(0, 800))
  }
}
