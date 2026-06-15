import {
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from 'docx'

export const FIELD_HEADERS = [
  '序号',
  '字段中文名称',
  '英文名称',
  '字段类型',
  '必填',
  '校验规则（没有明确规则时先限制字符即可，放宽）',
  '备注（如下拉框取值来源、说明等）',
  '是否代码集取值',
  '数据格式样例（无特定格式留空）',
]

export function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ text, heading: level, spacing: { before: 240, after: 120 } })
}

export function body(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22 })],
    spacing: { after: 120 },
  })
}

export function bullet(text) {
  return new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 80 } })
}

export function tableFromRows(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      (cells) =>
        new TableRow({
          children: cells.map(
            (text) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: String(text), size: 18 })],
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
          ),
        }),
    ),
  })
}

export function fieldTable(rows) {
  return tableFromRows([FIELD_HEADERS, ...rows])
}

export function fieldTableSection(title = '') {
  const items = [heading('（2）新增—字段信息表', HeadingLevel.HEADING_5)]
  if (title) items.push(body(title))
  return items
}

export function dataFlowSection({ explanation, preconditions, downstream }) {
  return [
    heading('4、数据前后流转关系（说明、前置条件、下游输出）', HeadingLevel.HEADING_5),
    body('1）说明：'),
    body(explanation),
    body('2）前置条件：'),
    body(preconditions),
    body('3）下游输出：'),
    body(downstream),
  ]
}

export function businessFlowSection(flowText) {
  return [
    heading('5、业务流关系（操作流程）', HeadingLevel.HEADING_5),
    body(`操作流程：${flowText}`),
  ]
}

export function functionButton(index, nameZh, nameEn, { description, interaction, remarks }) {
  return [
    body(`${index}、功能按钮——${nameZh}（英文名称：${nameEn}）`),
    body('a. 功能说明（描述、业务的事件交互、备注信息等）：'),
    bullet(`描述：${description}`),
    bullet(`业务的事件交互：${interaction}`),
    bullet(`备注信息（校验规则补充、其他说明等）：${remarks}`),
    body('b. 原型参考截图'),
  ]
}

export function functionButtonSection(buttons) {
  const items = [heading('（3）菜单功能清单', HeadingLevel.HEADING_5)]
  buttons.forEach((btn, i) => {
    items.push(...functionButton(i + 1, btn.nameZh, btn.nameEn, btn))
  })
  return items
}

export function buildModuleSection({
  headingText,
  intro,
  listFieldTitle,
  listFields,
  formFieldTitle,
  formFields,
  searchFields,
  dataFlow,
  businessFlow,
  buttons,
}) {
  const items = [
    heading(headingText, HeadingLevel.HEADING_4),
    heading('菜单介绍', HeadingLevel.HEADING_5),
    body(intro),
    heading('（1）页面展示字段信息', HeadingLevel.HEADING_5),
    body(listFieldTitle),
    fieldTable(listFields),
    ...fieldTableSection(formFieldTitle),
    fieldTable(formFields),
  ]
  if (searchFields?.length) {
    items.push(heading('支持查询检索的字段信息', HeadingLevel.HEADING_5))
    items.push(fieldTable(searchFields))
  }
  items.push(...dataFlowSection(dataFlow))
  items.push(...businessFlowSection(businessFlow))
  items.push(...functionButtonSection(buttons))
  return items
}
