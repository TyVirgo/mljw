import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ASSET_DIR = path.resolve(__dirname, '../../temp-template')

let paraSeq = 0
export function resetParaIds() {
  paraSeq = 0
}

function nextParaId() {
  paraSeq += 1
  return paraSeq.toString(16).toUpperCase().padStart(8, '0')
}

export function escapeXml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function readAsset(name) {
  return fs.readFileSync(path.join(ASSET_DIR, name), 'utf8')
}

let tblPr = ''
let tblGridField = ''
let fieldHeaderRow = ''
let fieldDataRowTemplate = ''

export function loadTemplateAssets() {
  tblPr = readAsset('tblPr.xml')
  tblGridField = readAsset('tblGrid.xml')
  fieldHeaderRow = readAsset('headerRow.xml')
  fieldDataRowTemplate = readAsset('dataRow.xml')
}

function runText(text) {
  return `<w:r><w:rPr><w:rFonts w:hint="eastAsia" w:ascii="宋体" w:hAnsi="宋体" w:cs="宋体"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-US" w:eastAsia="zh-CN"/></w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`
}

/** 正文段落（无标题样式） */
export function pBody(text) {
  return `<w:p w14:paraId="${nextParaId()}"><w:pPr><w:jc w:val="both"/><w:rPr><w:rFonts w:hint="eastAsia"/><w:lang w:val="en-US" w:eastAsia="zh-CN"/></w:rPr></w:pPr>${runText(text)}</w:p>`
}

/** 模板标题样式 2–8；suppressNum 显式关闭样式继承的自动编号（用于菜单介绍 1–6 固定序号） */
export function pHeading(style, text, { numbered = false, suppressNum = false } = {}) {
  let num = ''
  if (suppressNum) {
    num = '<w:numPr><w:numId w:val="0"/></w:numPr>'
  } else if (numbered && style === '6') {
    num = '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="3"/></w:numPr>'
  }
  return `<w:p w14:paraId="${nextParaId()}"><w:pPr><w:pStyle w:val="${style}"/>${num}<w:bidi w:val="0"/><w:rPr><w:rFonts w:hint="default" w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:lang w:val="en-US" w:eastAsia="zh-CN"/></w:rPr></w:pPr>${runText(text)}</w:p>`
}

/** 菜单介绍固定序号标题（每模块独立 1–6，不触发 Word 自动编号） */
export function pMenuIntroHeading(index, title) {
  return pHeading('7', `${index}、${title}`, { suppressNum: true })
}

export function pBulletItem(text) {
  return `<w:p w14:paraId="${nextParaId()}"><w:pPr><w:jc w:val="both"/><w:rPr><w:rFonts w:hint="eastAsia" w:ascii="宋体" w:hAnsi="宋体" w:cs="宋体"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-US" w:eastAsia="zh-CN"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:hint="eastAsia" w:ascii="宋体" w:hAnsi="宋体" w:cs="宋体"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-US" w:eastAsia="zh-CN"/></w:rPr><w:t xml:space="preserve">·  ${escapeXml(text)}</w:t></w:r></w:p>`
}

function fieldDataRow(cells, { align = 'center' } = {}) {
  const cellMatches = [...fieldDataRowTemplate.matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)].map((m) => m[0])
  const count = Math.min(cellMatches.length, cells.length)
  const rowCells = []
  for (let i = 0; i < count; i++) {
    rowCells.push(replaceCellText(cellMatches[i], cells[i], i === 0 ? 'center' : align))
  }
  return `<w:tr w14:paraId="${nextParaId()}">${rowCells.join('')}</w:tr>`
}

/** Tab 分隔行（合并 9 列） */
export function fieldTabSeparatorRow(title) {
  return `<w:tr w14:paraId="${nextParaId()}"><w:trPr><w:trHeight w:val="480" w:hRule="atLeast"/></w:trPr><w:tc><w:tcPr><w:gridSpan w:val="9"/><w:tcW w:w="5000" w:type="pct"/><w:tcBorders><w:top w:val="single" w:color="7F7F7F" w:sz="2" w:space="0"/><w:left w:val="single" w:color="7F7F7F" w:sz="2" w:space="0"/><w:bottom w:val="single" w:color="7F7F7F" w:sz="2" w:space="0"/><w:right w:val="single" w:color="7F7F7F" w:sz="2" w:space="0"/></w:tcBorders><w:shd w:val="clear" w:color="auto" w:fill="EDEDED"/><w:vAlign w:val="center"/></w:tcPr><w:p w14:paraId="${nextParaId()}"><w:pPr><w:jc w:val="left"/><w:rPr><w:b/><w:bCs/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:bCs/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t xml:space="preserve">${escapeXml(title)}</w:t></w:r></w:p></w:tc></w:tr>`
}

function replaceCellText(cellXml, text, align = 'center') {
  const safe = escapeXml(text)
  const jc = align === 'left' ? 'left' : 'center'
  if (/<w:t[\s/>]/.test(cellXml)) {
    return cellXml.replace(/<w:t[^>]*>[\s\S]*?<\/w:t>/, `<w:t xml:space="preserve">${safe}</w:t>`)
  }
  return cellXml.replace(
    /<\/w:tcPr>/,
    `</w:tcPr><w:p w14:paraId="${nextParaId()}"><w:pPr><w:jc w:val="${jc}"/><w:rPr><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t xml:space="preserve">${safe}</w:t></w:r></w:p>`,
  )
}

export function buildFieldTable(rows, { align = 'center' } = {}) {
  const dataRows = rows.map((r) => fieldDataRow(r, { align })).join('')
  return `<w:tbl>${tblPr}${tblGridField}${fieldHeaderRow}${dataRows}</w:tbl>`
}

/** 按 Tab/Section 分组的新增字段表（每 Tab 内序号从 1 重新编号） */
export function buildGroupedFormFieldTable(pageTitle, groups) {
  const parts = [fieldHeaderRow]
  for (const group of groups) {
    parts.push(fieldTabSeparatorRow(`${pageTitle}——${group.title}`))
    const rows = toFieldRows(group.entries)
    rows.forEach((row, i) => {
      row[0] = String(i + 1)
      parts.push(fieldDataRow(row, { align: 'left' }))
    })
  }
  return `<w:tbl>${tblPr}${tblGridField}${parts.join('')}</w:tbl>`
}

function toFieldRows(entries) {
  return entries.map((e, i) => [
    String(i + 1),
    e.zh,
    e.en,
    e.type || '文本',
    e.required || '否',
    e.validation || '—',
    e.remark || '—',
    e.codeSet || '否',
    e.sample || '',
  ])
}

function simpleCell(text, header = false) {
  const fill = header ? '<w:shd w:val="clear" w:color="auto" w:fill="D9F3FD"/>' : ''
  const bold = header ? '<w:b/><w:bCs/>' : ''
  return `<w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:color="808080" w:sz="2" w:space="0"/><w:left w:val="single" w:color="808080" w:sz="2" w:space="0"/><w:bottom w:val="single" w:color="808080" w:sz="2" w:space="0"/><w:right w:val="single" w:color="808080" w:sz="2" w:space="0"/></w:tcBorders>${fill}<w:vAlign w:val="center"/></w:tcPr><w:p w14:paraId="${nextParaId()}"><w:pPr><w:jc w:val="center"/><w:rPr><w:sz w:val="20"/>${bold}</w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/>${bold}</w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p></w:tc>`
}

function buildSimpleTable(headers, rows) {
  const headerRow = `<w:tr>${headers.map((h) => simpleCell(h, true)).join('')}</w:tr>`
  const bodyRows = rows.map((row) => `<w:tr>${row.map((c) => simpleCell(c)).join('')}</w:tr>`).join('')
  const grid = headers.map(() => '<w:gridCol w:w="1800"/>').join('')
  const pr =
    '<w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:color="DEE0E3" w:sz="4" w:space="0"/><w:left w:val="single" w:color="DEE0E3" w:sz="4" w:space="0"/><w:bottom w:val="single" w:color="DEE0E3" w:sz="4" w:space="0"/><w:right w:val="single" w:color="DEE0E3" w:sz="4" w:space="0"/><w:insideH w:val="single" w:color="DEE0E3" w:sz="4" w:space="0"/><w:insideV w:val="single" w:color="DEE0E3" w:sz="4" w:space="0"/></w:tblBorders></w:tblPr>'
  return `<w:tbl>${pr}<w:tblGrid>${grid}</w:tblGrid>${headerRow}${bodyRows}</w:tbl>`
}

export function buildAppDirectoryTable(rows) {
  return buildSimpleTable(
    ['一级目录', '一级目录英文名称', '二级目录', '二级目录英文名称', '三级目录', '备注说明'],
    rows,
  )
}

export function dataFlowBlock({ explanation, preconditions, downstream }) {
  return [
    pBody(`1）说明：${explanation}`),
    pBody(`2）前置条件：${preconditions}`),
    pBody(`3）下游输出：${downstream}`),
  ].join('')
}

export function functionButtonXml(index, nameZh, nameEn, { description, interaction, remarks, drillDown }) {
  const drill = drillDown ?? '无下钻页面'
  return [
    pHeading('7', `${index}、功能按钮/开关——${nameZh}（英文名称：${nameEn}）`),
    pHeading('8', 'a.功能说明（描述、业务的事件交互、备注信息等）：'),
    pBulletItem(`描述：${description}`),
    pBulletItem(`业务的事件交互：${interaction}`),
    pBulletItem(`备注信息（校验规则补充、其他说明等）：${remarks}`),
    pHeading('8', 'b.按钮下钻页面说明（备注说明）：'),
    pBody(`下钻页面说明：${drill}`),
    pHeading('8', 'c.原型参考截图'),
  ].join('')
}

export function buildModuleXml({
  menuTitle,
  menuSummary,
  listFieldNote,
  listFields,
  searchFieldNote,
  searchFields,
  formPageTitle,
  formFieldGroups,
  dataFlow,
  businessFlow,
  prototypeLink,
  buttons,
}) {
  const parts = [
    pHeading('5', menuTitle),
    pHeading('6', '菜单介绍'),
    pMenuIntroHeading(1, '菜单内容简介'),
    pBody(menuSummary),
    pMenuIntroHeading(2, '页面展示字段信息'),
    pBody(listFieldNote || '列表页表格展示字段如下：'),
    buildFieldTable(listFields, { align: 'left' }),
    pMenuIntroHeading(3, '支持查询检索的字段信息'),
    pBody(searchFieldNote || (searchFields?.length ? '搜索区支持以下字段检索：' : '本模块列表页暂无独立检索字段。')),
  ]
  if (searchFields?.length) {
    parts.push(buildFieldTable(searchFields, { align: 'left' }))
  }
  parts.push(pMenuIntroHeading(4, '数据前后流转关系(说明、前置条件、下游输出)'))
  parts.push(dataFlowBlock(dataFlow))
  parts.push(pMenuIntroHeading(5, '业务流关系(操作流程)'))
  parts.push(pBody(`操作流程：${businessFlow}`))
  parts.push(pMenuIntroHeading(6, '原型参考链接'))
  parts.push(pBody(prototypeLink || '可交互原型演示环境（学籍管理模块）。'))
  parts.push(pHeading('6', '新增—字段信息表'))
  parts.push(buildGroupedFormFieldTable(formPageTitle, formFieldGroups))
  parts.push(pHeading('6', '菜单功能清单'))
  buttons.forEach((btn, i) => {
    parts.push(functionButtonXml(i + 1, btn.nameZh, btn.nameEn, btn))
  })
  return parts.join('')
}

export function wrapDocumentBody(innerXml) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" mc:Ignorable="w14">
<w:body>
${innerXml}
<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1800" w:bottom="1440" w:left="1800" w:header="851" w:footer="992" w:gutter="0"/><w:cols w:space="425" w:num="1"/><w:docGrid w:type="lines" w:linePitch="312" w:charSpace="0"/></w:sectPr>
</w:body>
</w:document>`
}

export function buildCoverSection({
  version = 'V1.6',
  date = '2026年6月15日',
  note = 'V1.6 按公司 PRD 模板结构生成；含丰富菜单介绍、Tab 分组字段表、扩展表单内功能按钮说明；业务描述纯中文，技术标识括号备注。',
} = {}) {
  return [
    `<w:p w14:paraId="${nextParaId()}"><w:pPr><w:jc w:val="center"/><w:rPr><w:rFonts w:hint="eastAsia" w:ascii="宋体" w:hAnsi="宋体" w:cs="宋体"/><w:sz w:val="44"/><w:szCs w:val="44"/><w:lang w:val="en-US" w:eastAsia="zh-CN"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:hint="eastAsia" w:ascii="宋体" w:hAnsi="宋体" w:cs="宋体"/><w:sz w:val="44"/><w:szCs w:val="44"/><w:lang w:val="en-US" w:eastAsia="zh-CN"/></w:rPr><w:t>厦大马来分校本科教务系统产品需求文档</w:t></w:r></w:p>`,
    `<w:p w14:paraId="${nextParaId()}"><w:pPr><w:jc w:val="center"/><w:rPr><w:sz w:val="32"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="32"/></w:rPr><w:t>学籍管理模块（学生基本信息 + 学籍异动）</w:t></w:r></w:p>`,
    pBody(`文档版本：${version}`),
    pBody(`创建日期：${date}`),
    pBody('需求确认状态：已确认'),
    pBody(`说明：${note}`),
  ].join('')
}

export function buildOverviewSection({ scopeExtra = '' } = {}) {
  const scope =
    '本文档描述厦大马来分校本科教务系统「学籍管理」模块产品需求，覆盖学生基本信息维护、异动类别配置、四类学籍异动申请（转专业/休学/复学/退学）、统一异动审批、异动维护与异动查询。' +
    scopeExtra
  return [
    pHeading('2', '1 文档概述'),
    pHeading('3', '1.1 文档目的'),
    pBody(
      `${scope}文档为 AI 可交互原型生成与需求评审的标准化输入，确保原型符合业务逻辑、本地化规范与设计约定。`,
    ),
    pHeading('3', '1.2 开发背景'),
    pBody('开发模式：边分析边迭代，分模块生成可交互原型（当前为纯前端演示数据，无后端接口）。'),
    pBody('目标用户：教务管理人员、学籍异动审批角色、学生（申请侧）。'),
    pBody('覆盖范围：本科生学籍管理；门户二级应用「学籍管理」。'),
    pHeading('3', '1.3 文档说明'),
    pBody('本文档依据《厦大马来分校本科教务系统产品需求文档模板（带参考数据版）0610》章节结构编写。'),
    pBody('每个二级菜单模块均包含：菜单介绍、页面展示字段、检索字段、数据流转、业务流、原型链接、新增字段表、菜单功能清单。'),
    pBody('已确认模块标记为「已确认」；字段表采用 9 列表头；功能按钮含下钻页面说明。'),
  ].join('')
}

export function buildSeparationTable({ extended = false } = {}) {
  const parts = [
    pHeading('3', '2.3 申请与审批职责分离'),
    buildSimpleTable(
      ['能力', '学生基本信息', '异动申请', '异动审批'],
      [
        ['详情入口', '只读详情抽屉（七页签）', '只读详情弹窗（无审批）', '全页审批详情（含审批表单）'],
        ['教务核定分区', '—', '表单不含（审批人填写）', '待我审批查看时含教务核定字段'],
        ['流转日志', '—', '列表独立日志弹窗', '列表独立日志弹窗'],
        ['撤回', '—', '—', '已处理历史查看后撤回'],
      ],
    ),
  ]
  if (extended) {
    parts.push(
      pHeading('3', '2.4 维护与查询职责分离'),
      buildSimpleTable(
        ['能力', '异动维护', '异动查询', '说明'],
        [
          ['数据范围', '仅 Approved', '全部非 Draft', '查询含进行中/拒绝等全态'],
          ['工具栏', '实施·改编号·导出·删除', '仅导出', '查询只读'],
          ['行操作', 'Edit | Details | Log', 'Details | Log', '查询无 Edit'],
          ['导出', 'ExportModal → xlsx', 'ExportModal → xlsx', '共用字段与导出逻辑'],
          ['搜索布局', '单行五字段', '双行+收起', '查询次行默认展开'],
        ],
      ),
    )
  }
  return parts.join('')
}
