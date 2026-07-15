/**
 * 生成 V2.0 vs V2.4 需求文档变更对比说明（docx）
 * 格式：逐项说明旧版内容 → 新版改为什么，全部使用三列对比表格
 */
import fs from 'fs'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  HeadingLevel,
  AlignmentType,
  VerticalAlign,
  ShadingType,
} from 'docx'
import { extractDocxText, splitBySections, sectionText } from './extract-prd-sections.mjs'

const V20 = 'd:/任务/马来/马来教务/模板/厦大马来分校本科教务系统产品需求文档-学籍管理模块-V2.0.docx'
const V24 = 'd:/任务/马来/马来教务/模板/厦大马来分校本科教务系统产品需求文档-学籍管理模块-V2.4.docx'
const OUT = 'd:/任务/马来/马来教务/模板/学籍管理模块-需求文档V2.0与V2.4变更对比说明.docx'
const OUT_TMP = 'd:/任务/马来/马来教务/模板/学籍管理模块-需求文档V2.0与V2.4变更对比说明-更新中.docx'
const OUT_ALT = 'd:/任务/马来/马来教务/模板/学籍管理模块-需求文档V2.0与V2.4变更对比说明-V2.docx'

const HEADER_FILL = 'B4D7EE'
const HEADER_TEXT = '1F4E79'
const ALT_FILL = 'F2F7FB'
const BORDER_COLOR = '8EAADB'
const BORDER = { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR }
const HEADER_BORDER = { style: BorderStyle.SINGLE, size: 2, color: '2E75B6' }
const TABLE_BORDERS = {
  top: HEADER_BORDER,
  bottom: BORDER,
  left: BORDER,
  right: BORDER,
  insideHorizontal: BORDER,
  insideVertical: BORDER,
}

const W3 = [16, 42, 42]
const FONT = '宋体'
const BODY_SIZE = 21
const HEADER_SIZE = 22

function runs(text, { bold = false, color } = {}) {
  return String(text ?? '—')
    .split('\n')
    .flatMap((line, i, arr) => {
      const parts = [new TextRun({ text: line || ' ', bold, size: BODY_SIZE, font: FONT, color })]
      if (i < arr.length - 1) parts.push(new TextRun({ break: 1 }))
      return parts
    })
}

function cell(text, { bold = false, fill, widthPct, align = AlignmentType.LEFT, color } = {}) {
  return new TableCell({
    width: widthPct ? { size: widthPct, type: WidthType.PERCENTAGE } : undefined,
    shading: fill ? { fill, type: ShadingType.CLEAR } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    children: [new Paragraph({ alignment: align, children: runs(text, { bold, color }) })],
  })
}

function headerRow(cols) {
  return new TableRow({
    tableHeader: true,
    children: cols.map((t, i) =>
      cell(t, { bold: true, fill: HEADER_FILL, widthPct: W3[i], color: HEADER_TEXT }),
    ),
  })
}

function dataRow(cols, alt = false) {
  return new TableRow({
    children: cols.map((t, i) => cell(t, { fill: alt ? ALT_FILL : undefined, widthPct: W3[i] })),
  })
}

/** 三列对比表：对比项 | V2.0旧版内容 | V2.4新版内容 */
function compareTable(rows, title) {
  const children = []
  if (title) {
    children.push(
      new Paragraph({
        spacing: { before: 160, after: 80 },
        children: [new TextRun({ text: title, bold: true, size: 22, font: FONT, color: '2E75B6' })],
      }),
    )
  }
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: TABLE_BORDERS,
      rows: [
        headerRow(['对比项', 'V2.0 旧版内容', 'V2.4 新版内容']),
        ...rows.map((r, i) => dataRow(r, i % 2 === 1)),
      ],
    }),
  )
  return children
}

function sectionBlock(title, desc, tables) {
  const out = [h2(title)]
  if (desc) out.push(p(desc))
  for (const t of tables) out.push(...t, p(''))
  return out
}

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { after: 200 }, children: [new TextRun({ text, bold: true, size: 36, font: FONT })] })
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 }, children: [new TextRun({ text, bold: true, size: 28, font: FONT, color: '1F4E79' })] })
}
function p(text) {
  return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text, size: BODY_SIZE, font: FONT })] })
}

async function getSection(path, id) {
  const sec = splitBySections(await extractDocxText(path)).find((s) => s.id === id)
  return sec ? sectionText(sec) : ''
}

function menuIntro(text) {
  const m = text.match(/1、菜单内容简介[\s\S]*?(?=2、|$)/)
  return m ? m[0].replace(/1、菜单内容简介\s*/, '').replace(/\s+/g, ' ').trim() : '（该版本未单独撰写菜单简介）'
}

function listFieldNames(text) {
  const list = text.split('\n').map((l) => l.trim())
  const names = []
  let inList = false
  for (let i = 0; i < list.length; i++) {
    if (list[i] === '字段中文名称') inList = true
    if (inList && /^\d+$/.test(list[i])) {
      const zh = list[i + 1]
      if (zh && !/^(字段|英文|序号|—)/.test(zh) && zh.length < 40) names.push(zh)
    }
    if (inList && /^3、支持查询/.test(list[i])) break
  }
  return [...new Set(names)]
}

function fieldDiff(t20, t24) {
  const f20 = listFieldNames(t20)
  const f24 = listFieldNames(t24)
  const s20 = new Set(f20)
  const s24 = new Set(f24)
  return { f20, f24, only20: f20.filter((x) => !s24.has(x)), only24: f24.filter((x) => !s20.has(x)) }
}

function listButtons(text) {
  return [...text.matchAll(/\d+、功能按钮\/开关——([^\n（]+)/g)].map((m) => m[1].trim())
}

function snippet(text, keyword, len = 200) {
  const i = text.indexOf(keyword)
  if (i < 0) return '—'
  return text.slice(i, i + len).replace(/\s+/g, ' ').trim()
}

async function main() {
  const ids = [
    '2.2.1.1', '2.2.1.2', '2.2.1.3', '2.2.1.4', '2.2.1.4.1', '2.2.1.4.2',
    '2.2.1.4.3', '2.2.1.4.4', '2.2.1.5', '2.2.1.6', '2.2.1.7', '2.2.1.8', '2.2.1.9',
  ]
  const sections = {}
  for (const id of ids) {
    sections[id] = { v20: await getSection(V20, id), v24: await getSection(V24, id) }
  }

  const nodes20 = await extractDocxText(V20)
  const nodes24 = await extractDocxText(V24)
  const cover20 = nodes20.find((n) => n.startsWith('说明：')) || ''
  const cover24 = nodes24.find((n) => n.startsWith('说明：')) || ''
  const dir20 = nodes20.find((n) => n.includes('学生基本信息') && n.includes('异动')) || ''
  const dir24 = nodes24.find((n) => n.includes('学生基本信息') && n.includes('异动规则')) || ''

  const children = [
    h1('学籍管理模块 · 需求文档变更对比说明'),
    p('对比文档：厦大马来分校本科教务系统产品需求文档-学籍管理模块'),
    p('调整前版本：V2.0（旧版）    调整后版本：V2.4（新版）'),
    p('本文档逐菜单、逐项对比两份需求文档的实际正文：左列为对比维度，中间列为 V2.0 旧版原文或含义，右列为 V2.4 新版改为什么。标注「无」表示该版本未描述或不存在该能力。'),
    p(''),
  ]

  // 一、文档整体
  children.push(
    ...sectionBlock(
      '一、文档整体变化',
      '以下为整份需求文档层面的结构、用语与全局能力差异。',
      [
        compareTable([
          ['文档版本号', 'V2.0', 'V2.4'],
          [
            '封面「说明」',
            cover20.replace(/^说明：/, '').trim() || '—',
            cover24.replace(/^说明：/, '').trim() || '—',
          ],
          [
            '应用目录摘要行',
            dir20.trim() || '—',
            dir24.trim() || '—',
          ],
          [
            '版本附录章节',
            '保留 §2.6–§2.9 等版本增量约定（如详情抽屉时间线合并规则写于附录）',
            '删除 §2.6–§2.9；同类约定分散写入各菜单正文与下钻说明',
          ],
          [
            '菜单标题格式',
            '含英文副标题及「（已确认）」标记，如 Tab / Modal 等混排',
            '仅保留中文菜单名，技术组件名改为业务用语（标签页、弹窗等）',
          ],
          [
            '侧边栏菜单',
            '无「异动规则设置」入口',
            '新增「异动规则设置」，排在「知情同意书」之后',
          ],
          [
            '列表日期列名（多处）',
            '列名写「生效学期」，格式 YYYY/MM 或 年/月',
            '列名改为「生效日期」，格式仍为 年/月',
          ],
          [
            '是否实施显示值',
            '列表与导出显示 Y/N；Pending 显示为 —',
            '列表与导出显示 是/否；待实施显示为横线',
          ],
          [
            '状态展示样式',
            'pill Badge、Expired 等英文状态词',
            '胶囊形「状态标签」、已过期 等中文状态词',
          ],
        ], '表 1-1  文档整体对比'),
      ],
    ),
  )

  // 2.2.1.1
  const s11 = sections['2.2.1.1']
  const d11 = fieldDiff(s11.v20, s11.v24)
  children.push(
    ...sectionBlock(
      '二、2.2.1.1 学生基本信息',
      '学生档案主数据维护页。V2.4 在搜索能力、列表列、详情操作上有明显增强。',
      [
        compareTable([
          ['菜单内容简介（原文）', menuIntro(s11.v20), menuIntro(s11.v24)],
        ], '表 2-1  菜单简介'),
        compareTable([
          [
            '搜索区文本框',
            '未单独描述五个独立文本框；搜索以常规下拉/筛选为主',
            '新增 5 个独立搜索文本框：学号、姓名、中文名、身份证号、手机号；多个有值时同时满足（AND）',
          ],
          [
            '搜索区第一行布局',
            '未明确「5 文本框 + 专业/入学批次/状态」分行描述',
            '明确：第一行 5 文本框 + 专业/入学批次/状态；折叠区含学生类别、国籍、学生准证有效期等',
          ],
          [
            '列表「学籍类型」列',
            '列表字段表未单独列出学籍类型列',
            '应用目录与正文补充：列表增加「学籍类型」列展示',
          ],
          [
            '详情页签命名',
            'Others 页签；第八 Tab「状态日志」',
            '「其他信息」页签；第八个标签页「状态日志」',
          ],
          [
            '详情底部操作',
            '无「导出学籍卡」描述',
            '详情抽屉 footer 增加「导出学籍卡」按钮（本期为入口能力）',
          ],
          [
            '预览跳转',
            'Preview 以学生身份跳转',
            '以学生身份预览跳转（用语通俗化，含义不变）',
          ],
          [
            '列表核心字段',
            d11.f20.join('、') || '—',
            (d11.f24.join('、') || d11.f20.join('、')) + '（另正文补充学籍类型列）',
          ],
          [
            '搜索区说明（正文摘录）',
            snippet(s11.v20, '搜索区支持', 180),
            snippet(s11.v24, '搜索区支持', 240),
          ],
          [
            '操作流程（正文摘录）',
            snippet(s11.v20, '操作流程：', 220),
            snippet(s11.v24, '操作流程：', 300),
          ],
          [
            '功能按钮清单',
            listButtons(s11.v20).join('、') || '—',
            (listButtons(s11.v24).join('、') || '—') + '；详情另有「导出学籍卡」',
          ],
        ], '表 2-2  逐项对比'),
      ],
    ),
  )

  // 2.2.1.2
  const s12 = sections['2.2.1.2']
  children.push(
    ...sectionBlock(
      '三、2.2.1.2 异动类别',
      '业务规则与演示数据基本不变，主要差异为用词通俗化。',
      [
        compareTable([
          ['菜单内容简介（原文）', menuIntro(s12.v20), menuIntro(s12.v24)],
        ], '表 3-1  菜单简介'),
        compareTable([
          [
            '唯一标识字段名',
            'categoryCode 全局唯一；演示行含 PT001/DEF001/WDR001/RES001',
            '类别编码 全局唯一；演示行含 PT001/休学异动类别/WDR001/RES001（DEF001 改为中文展示名）',
          ],
          [
            '原因列表字段',
            'reasons[] 同步至转专业/休学/退学申请原因下拉',
            '原因列表 同步至转专业/休学/退学申请原因下拉（含义相同）',
          ],
          [
            '设置原因弹窗',
            'Set Reason 弹窗',
            '设置原因 弹窗',
          ],
          [
            '表单弹窗组件名',
            'MovementCategoryFormModal 等英文组件名',
            '异动类别表单弹窗',
          ],
          [
            '类别下拉数据源',
            '学籍类型Options',
            '学籍类型选项（不与学籍状态联动，规则不变）',
          ],
          [
            '四行演示与三开关',
            'PT001/DEF001/WDR001/RES001；修改学籍状态/类型、自动实施、允许学生申请',
            '与旧版一致，仅 DEF001 在简介中写作「休学异动类别」',
          ],
        ], '表 3-2  逐项对比'),
      ],
    ),
  )

  // 2.2.1.3
  const s13 = sections['2.2.1.3']
  const d13 = fieldDiff(s13.v20, s13.v24)
  children.push(
    ...sectionBlock(
      '四、2.2.1.3 知情同意书',
      'V2.4 新增「适用学生范围」维度，字段命名全面中文化，与四类申请的模板匹配规则写得更细。',
      [
        compareTable([
          ['菜单内容简介（原文）', menuIntro(s13.v20), menuIntro(s13.v24)],
        ], '表 4-1  菜单简介'),
        compareTable([
          [
            '模板唯一性规则',
            '按适用异动类别 + Student Type（Local/Chinese/International）维护；(类别+类型) 唯一',
            '按适用异动类别 + 学生类别 + 适用学生范围维护；异动类别与学生类别组合须唯一',
          ],
          [
            '适用学生范围',
            '无此字段',
            '新建/编辑弹窗增加下拉：第一年 / 第二年及以上，非必填；列表同步展示，未配置显示横线',
          ],
          [
            '弹窗字段顺序',
            '名称 → 适用异动类别 → Student Type → Remark → 附件',
            '名称 → 适用异动类别 → 学生类别 → 适用学生范围 → 备注 → 附件',
          ],
          [
            'Student Type 字段',
            '字段名为 Student Type，选项 Local/Chinese/International',
            '字段名改为「学生类别」，选项含义不变',
          ],
          [
            'Remark 字段',
            '字段名为 Remark',
            '字段名改为「备注」',
          ],
          [
            '与申请页联动',
            '四 Tab 申请 Form/Detail；休学/退学家长区 resolveConsentTemplate 下载',
            '转专业/休学/复学/退学四个标签页内表单与详情；休学/退学家长区按异动类别+学生类别匹配下载知情同意书',
          ],
          [
            '列表字段（完整）',
            d13.f20.join('、') || '—',
            d13.f24.join('、') || '—',
          ],
          [
            '仅旧版有的字段名',
            d13.only20.join('、') || '无',
            '—（已更名或替换）',
          ],
          [
            '仅新版有的字段',
            '—',
            d13.only24.join('、') || '适用学生范围（列表与弹窗）',
          ],
          [
            '功能按钮',
            listButtons(s13.v20).join('、') || '—',
            listButtons(s13.v24).join('、') || '—',
          ],
        ], '表 4-2  逐项对比'),
      ],
    ),
  )

  // 2.2.1.7
  const s17 = sections['2.2.1.7']
  children.push(
    ...sectionBlock(
      '五、2.2.1.7 异动规则设置（V2.4 新增整节）',
      'V2.0 需求文档中完全不存在该菜单；V2.4 新增完整四级小节。',
      [
        compareTable([
          ['章节是否存在', '无 2.2.1.7 章节', '新增 2.2.1.7 异动规则设置（含菜单介绍 1–6、字段表、功能清单）'],
          ['菜单入口', '无', '侧边栏「学籍异动」→「异动规则设置」，排在知情同意书之后'],
          ['页面形态', '无', '纯列表页；无搜索区；不提供新增/删除规则'],
          ['列表字段', '无', '序号、规则名称（只读）、规则值、是否启用、操作'],
          [
            '四条内置规则',
            '无',
            '①本地生长学期转专业申请周次上限\n②本地生短学期转专业申请周次上限\n③国际学生转专业距下学期开学月数阈值\n④中国学生转专业逾期是否仍允许提交',
          ],
          ['规则值修改方式', '无', '行内「修改 → 保存/取消」编辑规则值'],
          ['是否启用', '无', '行内开关，修改后立即保存'],
          ['功能按钮', '无', listButtons(s17.v24).join('、') || '修改规则值、是否启用'],
          ['本期实现范围', '无', '仅配置展示与本地演示存储，尚未接入申请/审批自动校验'],
          ['菜单简介（V2.4 原文）', '—', menuIntro(s17.v24)],
        ], '表 5-1  新增菜单逐项说明'),
      ],
    ),
  )

  // 2.2.1.4
  const s14 = sections['2.2.1.4']
  children.push(
    ...sectionBlock(
      '六、2.2.1.4 学籍异动申请（老师）及四个子类型',
      '老师端与学生端共用申请页面结构。V2.4 默认标签页由休学改为转专业，四类子申请均改为「四个标签页」表述。',
      [
        compareTable([
          [
            '默认打开标签页',
            '页面内 Tab：转专业·休学·复学·退学（默认休学）',
            '页面顶部四个标签页：转专业·休学·复学·退学（默认打开转专业）',
          ],
          [
            '页面结构描述',
            'Tab 壳层 + 四 View 嵌入',
            '四个标签页组成的申请页面结构；每页内为申请列表与操作区',
          ],
          [
            '搜索区首行',
            '学号或姓名、专业代码、申请学年学期、状态（含 Draft）',
            '学号或姓名、专业代码、申请学年学期、状态（含 草稿）',
          ],
          [
            '搜索区次行',
            '是否实施，可收起',
            '是否实施，可收起（与旧版一致）',
          ],
          [
            '老师端列表列',
            '展示学号、姓名，支持关键字搜索',
            '展示学号、姓名，支持关键字搜索（不变）',
          ],
          [
            '列表日期列名',
            '生效学期，格式 YYYY/MM',
            '生效日期，格式 年/月',
          ],
          [
            '子节引用方式',
            '2.2.1.4.1–2.2.1.4.4 各 Tab 业务字段',
            '2.2.1.4.1 至 2.2.1.4.4 各标签页业务字段与按钮',
          ],
        ], '表 6-1  申请总述对比'),
      ],
    ),
  )

  const s41 = sections['2.2.1.4.1']
  children.push(
    h2('6.1 转专业（2.2.1.4.1）'),
    ...compareTable([
      ['菜单简介（原文）', menuIntro(s41.v20), menuIntro(s41.v24)],
      [
        '页面容器',
        '嵌入学籍异动申请 Tab 壳层',
        '位于学籍异动申请页面内「四个标签页组成的申请页面结构」',
      ],
      [
        '基本信息分区名',
        'Section I 学号姓名同行',
        '第一分区（基本信息）学号姓名同行',
      ],
      [
        '选学生方式',
        '老师新建可 StudentSelectModal 选学生',
        '老师新建时可打开「选择学生弹窗」选取学生',
      ],
      [
        '申请学年学期格式',
        'YYYY/MM，选学生后写入 intake',
        '年/月，选学生后写入 intake',
      ],
      [
        '转专业原因存储',
        '类别配置下拉（reasonId）',
        '类别配置下拉（原因编号）',
      ],
      [
        '教务核定分区',
        'Section VII 教务核定三字段申请侧 disabled 置灰',
        '第七分区（教务核定信息）三字段申请侧不可编辑置灰',
      ],
      [
        '详情抽屉布局',
        'V2.0 §2.6 附录约定审批时间线合并进抽屉',
        '详情抽屉顶部竖向审批流程图，下方申请详情；支持预览PDF/导出PDF',
      ],
      [
        '流转日志',
        '功能清单保留独立「流转日志」按钮/弹窗描述',
        '审批流转历史合并至详情抽屉顶部流程图（下钻说明）',
      ],
      [
        '列表字段',
        fieldDiff(s41.v20, s41.v24).f20.join('、') || '—',
        fieldDiff(s41.v20, s41.v24).f24.join('、') || '—',
      ],
    ], '表 6-2  转专业逐项对比'),
    p(''),
  )

  const s42 = sections['2.2.1.4.2']
  children.push(
    h2('6.2 休学（2.2.1.4.2）'),
    ...compareTable([
      ['菜单简介（原文）', menuIntro(s42.v20), menuIntro(s42.v24)],
      [
        '页面容器',
        'Tab 壳层内',
        '四个标签页组成的申请页面结构内',
      ],
      [
        '休学原因来源',
        '休学主要原因下拉来自 DEF001 类别 reasons',
        '休学主要原因下拉来自「休学异动类别」配置的原因列表',
      ],
      [
        '家长信息录入',
        '家长区可 Download Consent Letter（手动下载）',
        '选学生后从「家庭成员列表」自动带入全部非空家长/监护人；≥2 人时分块展示（家长/监护人 1/2…）',
      ],
      [
        '声明区下载按钮',
        '声明区提供下载知情同意书能力（与家长区下载并存）',
        '声明区不再提供「下载知情同意书」按钮；改由模板匹配机制统一下载',
      ],
      [
        '国际生审批',
        '国际生含 ISAO 审批节点',
        '国际生含 ISAO 审批节点（不变）',
      ],
      [
        '列表字段',
        fieldDiff(s42.v20, s42.v24).f20.join('、') || '—',
        fieldDiff(s42.v20, s42.v24).f24.join('、') || '—',
      ],
    ], '表 6-3  休学逐项对比'),
    p(''),
  )

  const s43 = sections['2.2.1.4.3']
  children.push(
    h2('6.3 复学（2.2.1.4.3）'),
    ...compareTable([
      ['菜单简介（原文）', menuIntro(s43.v20), menuIntro(s43.v24)],
      ['页面容器', 'Tab 壳层内', '四个标签页组成的申请页面结构内'],
      ['休学/复学学期', '须选择休学/复学学期，双声明与附件', '与旧版相同'],
      ['RES001 原因同步', 'RES001 本阶段不同步申请原因下拉', '与旧版相同'],
    ], '表 6-4  复学逐项对比'),
    p(''),
  )

  const s44 = sections['2.2.1.4.4']
  children.push(
    h2('6.4 退学（2.2.1.4.4）'),
    ...compareTable([
      ['菜单简介（原文）', menuIntro(s44.v20), menuIntro(s44.v24)],
      ['页面容器', 'Tab 壳层内', '四个标签页组成的申请页面结构内'],
      [
        '退学原因来源',
        '主要原因来自 WDR001 类别 reasons',
        '主要原因来自「退学异动类别配置的原因列表」',
      ],
      ['国际生 ISAO', '国际生 ISAO 提示', '与旧版相同'],
      ['家长知情同意书', '家长知情同意书模板联动', '与旧版相同'],
    ], '表 6-5  退学逐项对比'),
    p(''),
  )

  // 2.2.1.5
  const s15 = sections['2.2.1.5']
  children.push(
    ...sectionBlock(
      '七、2.2.1.5 学籍异动申请（学生）',
      '学生端与老师端共用页面，差异规则与 V2.0 一致，主要改为通俗表述。',
      [
        compareTable([
          [
            '与老师端关系',
            '共用 Tab 壳层与四 View',
            '共用「四个标签页组成的申请页面结构」',
          ],
          [
            '引用子节',
            '§2.2.1.4.1–4.4',
            '2.2.1.4.1 至 2.2.1.4.4',
          ],
          [
            '搜索区学号/姓名',
            '隐藏学号或姓名关键字搜索',
            '与旧版相同',
          ],
          [
            '列表学号/姓名列',
            '隐藏学号、姓名列',
            '与旧版相同',
          ],
          [
            '新建选学生',
            '学生身份上下文，不提供 StudentSelectModal',
            '学生身份上下文，不提供选择学生弹窗',
          ],
        ], '表 7-1  学生端申请对比'),
      ],
    ),
  )

  // 2.2.1.6
  const s16 = sections['2.2.1.6']
  const d16 = fieldDiff(s16.v20, s16.v24)
  children.push(
    ...sectionBlock(
      '八、2.2.1.6 学籍异动审批',
      '三个标签页结构不变；V2.4 统一详情抽屉布局，并将 Y/N、Badge 等改为中文业务用语。',
      [
        compareTable([
          ['菜单简介（原文）', menuIntro(s16.v20), menuIntro(s16.v24)],
        ], '表 8-1  菜单简介'),
        compareTable([
          [
            '标签页顺序',
            'Tab：待我审批 → 已提交 → 已处理历史（仅待我审批角标）',
            '标签页：待我审批 → 已提交 → 已处理历史（仅待我审批角标）',
          ],
          [
            '搜索区布局',
            '五字段 inline：学年学期、专业代码、状态、学号、姓名',
            '五字段同一行排列：学年学期、专业代码、状态、学号、姓名',
          ],
          [
            '已处理历史·是否实施',
            '显示 Y/N',
            '显示 是/否',
          ],
          [
            '查看详情',
            '只读 DetailModal + 底部 [审批] 打开 MovementApprovalModal',
            '只读「申请详情弹窗」+ 底部「审批」打开「审批意见弹窗」',
          ],
          [
            '导出',
            'ExportModal 导出',
            '「导出字段选择弹窗」导出',
          ],
          [
            '撤回',
            'Recall 撤回',
            '「撤回」撤回（用语中文化）',
          ],
          [
            '状态展示',
            '状态 Badge',
            '状态标签',
          ],
          [
            '生效列名与格式',
            '生效学期 YYYY/MM',
            '生效日期 年/月',
          ],
          [
            '详情抽屉布局',
            'V2.0 §2.6 附录约定时间线合并进抽屉',
            '顶部竖向审批流程图 + 下方申请详情；预览PDF/导出PDF与抽屉一致',
          ],
          [
            '管理端撤销（封面）',
            '封面未集中描述撤销出现位置',
            '封面明确：仅「已处理历史」列表、审批进行中时可撤销',
          ],
          [
            '列表字段',
            d16.f20.join('、') || '—',
            d16.f24.join('、') || '—',
          ],
          [
            '功能按钮',
            listButtons(s16.v20).join('、') || '—',
            listButtons(s16.v24).join('、') || '—',
          ],
        ], '表 8-2  逐项对比'),
      ],
    ),
  )

  // 2.2.1.8
  const s18 = sections['2.2.1.8']
  const d18 = fieldDiff(s18.v20, s18.v24)
  children.push(
    ...sectionBlock(
      '九、2.2.1.8 学籍异动维护',
      'V2.4 最大变化：新增文号列与 PDF 导出，行操作由「流转日志」改为「修改文号 + 导出PDF」，详情增加审批流程图。',
      [
        compareTable([
          ['菜单简介（原文）', menuIntro(s18.v20), menuIntro(s18.v24)],
        ], '表 9-1  菜单简介'),
        compareTable([
          [
            '数据范围',
            '仅 Approved（已通过）记录',
            '仅「已通过」记录（中文状态，规则不变）',
          ],
          [
            '列表文号列',
            '无文号列；列序以学号开头',
            '学号前一列增加「文号」，未填显示 NA；用于 PDF 文件名前缀',
          ],
          [
            '搜索区',
            '搜索：学年学期/专业代码/状态/学号/姓名（单行五字段描述）',
            '搜索区两行共九项条件（扩展说明，与查询对齐）',
          ],
          [
            '工具栏',
            '实施、导出、删除（无修改异动编号）',
            '实施、导出、删除（与旧版相同）',
          ],
          [
            '行操作',
            '详情、流转日志（无 Edit）',
            '修改文号、详情、导出PDF（无编辑）',
          ],
          [
            '修改文号',
            '无',
            '弹窗输入文号（1–100 字符，英文字母与数字）',
          ],
          [
            '导出PDF',
            '无',
            '维护页行内「导出PDF」（与查询页「预览PDF」区分）',
          ],
          [
            '详情内容',
            '详情脱敏（maskSensitiveFields）',
            '详情含审批流程图 + 申请内容；护照、身份证号等仍脱敏',
          ],
          [
            '是否实施显示',
            'Y/N；pill Badge',
            '是/否；胶囊形状态标签',
          ],
          [
            '生效列名',
            '字段表列名「生效学期」',
            '字段表列名「生效日期」',
          ],
          [
            '列表字段差异',
            d18.only20.join('、') || '无',
            d18.only24.join('、') || '无',
          ],
          [
            '列表字段（完整）',
            d18.f20.join('、') || '—',
            d18.f24.join('、') || '—',
          ],
          [
            '功能按钮',
            listButtons(s18.v20).join('、') || '—',
            listButtons(s18.v24).join('、') || '—',
          ],
        ], '表 9-2  逐项对比'),
      ],
    ),
  )

  // 2.2.1.9
  const s19 = sections['2.2.1.9']
  const d19 = fieldDiff(s19.v20, s19.v24)
  children.push(
    ...sectionBlock(
      '十、2.2.1.9 学籍异动查询',
      '查询页菜单简介两版几乎相同；V2.4 在封面与详情下钻说明中补充预览PDF，列表仍无文号列。',
      [
        compareTable([
          ['菜单简介（原文）', menuIntro(s19.v20), menuIntro(s19.v24)],
        ], '表 10-1  菜单简介'),
        compareTable([
          [
            '数据范围',
            '全部非 Draft 记录',
            '全部非「草稿」记录',
          ],
          [
            '搜索区',
            '首行：学年学期/专业代码/状态/异动类型；次行学号/姓名可收起',
            '与旧版相同',
          ],
          [
            '工具栏',
            '仅导出',
            '仅导出',
          ],
          [
            '列表文号列',
            '无文号列',
            '无文号列（V2.4 正文明确：维护有文号、查询无文号）',
          ],
          [
            '行操作（正文）',
            '详情（脱敏）与流转日志',
            '正文仍写「详情（脱敏）与流转日志」',
          ],
          [
            '详情抽屉',
            '详情脱敏',
            '详情抽屉含审批流程图（与维护/审批统一布局）',
          ],
          [
            '预览PDF',
            '未在封面或本节菜单简介中描述',
            'V2.4 封面总述「查询页提供预览PDF」；详情下钻说明含预览PDF/导出PDF',
          ],
          [
            '导出',
            'ExportModal 导出 xlsx',
            '导出字段选择弹窗 导出 Excel表格',
          ],
          [
            '生效列名',
            '字段表列名「生效学期」',
            '字段表列名「生效日期」',
          ],
          [
            '列表字段差异',
            d19.only20.join('、') || '无',
            d19.only24.join('、') || '无',
          ],
          [
            '列表字段（完整）',
            d19.f20.join('、') || '—',
            d19.f24.join('、') || '—',
          ],
          [
            '功能按钮',
            listButtons(s19.v20).join('、') || '—',
            listButtons(s19.v24).join('、') || '—',
          ],
          [
            '操作流程（摘录）',
            snippet(s19.v20, '操作流程：', 200),
            snippet(s19.v24, '操作流程：', 200),
          ],
        ], '表 10-2  逐项对比'),
      ],
    ),
  )

  // 汇总
  children.push(
    ...sectionBlock(
      '十一、新增 / 删除 / 修改汇总',
      '以下汇总各菜单最核心变更，便于快速查阅；详细旧版→新版对照见上文各表。',
      [
        compareTable([
          ['新增菜单', '无', '2.2.1.7 异动规则设置（整节新增，四条内置规则）'],
          [
            '新增字段/列',
            '—',
            '学籍类型（学生档案列表）；适用学生范围（知情同意书）；文号（维护列表，查询页仍无）',
          ],
          [
            '新增按钮/操作',
            '—',
            '导出学籍卡；修改文号；维护行「导出PDF」；详情抽屉预览PDF/导出PDF',
          ],
          [
            '删除章节',
            '§2.6–§2.9 版本附录',
            '已删除，内容并入各菜单正文',
          ],
          [
            '删除/弱化的交互',
            '维护行操作「流转日志」为主路径；休学声明区单独下载按钮',
            '流转日志合并进详情流程图；休学声明区不再单独提供下载按钮',
          ],
          [
            '修改默认值',
            '异动申请默认标签页：休学',
            '异动申请默认标签页：转专业',
          ],
          [
            '修改搜索',
            '学生档案以常规筛选为主',
            '学生档案增加 5 个独立文本框 AND 检索',
          ],
          [
            '修改列名',
            '生效学期（维护/查询/审批等多处）',
            '生效日期（格式仍为 年/月）',
          ],
          [
            '修改显示值',
            '是否实施 Y/N；状态 Badge/Expired',
            '是否实施 是/否；胶囊形状态标签/已过期',
          ],
        ], '表 11-1  变更汇总'),
      ],
    ),
  )

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 } } },
      children,
    }],
  })

  const buf = await Packer.toBuffer(doc)
  const candidates = [OUT, OUT_TMP, OUT_ALT]
  let target = null
  for (const path of candidates) {
    try {
      fs.writeFileSync(path, buf)
      target = path
      break
    } catch (e) {
      if (e.code !== 'EBUSY') throw e
    }
  }
  if (!target) throw new Error('所有目标文件均被占用，请关闭 Word 后重试')
  console.log('已生成:', target, '大小:', buf.length, 'bytes')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
