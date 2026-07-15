/**
 * 按菜单模块生成 V2.0 vs V2.4 变更对比 docx
 * 固定三维度：字段 / 排版 / 内容
 */
import fs from 'fs'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
} from 'docx'
import { extractDocxText, splitBySections, sectionText } from './extract-prd-sections.mjs'

const V20 = 'd:/任务/马来/马来教务/模板/厦大马来分校本科教务系统产品需求文档-学籍管理模块-V2.0.docx'
const V24 = 'd:/任务/马来/马来教务/模板/厦大马来分校本科教务系统产品需求文档-学籍管理模块-V2.4.docx'
const OUT = 'd:/任务/马来/马来教务/模板/学籍管理模块-需求文档V2.0与V2.4变更对比说明.docx'

const FONT = '宋体'
const SIZE = 21

async function getSection(path, id) {
  const sec = splitBySections(await extractDocxText(path)).find((s) => s.id === id)
  return sec ? sectionText(sec) : ''
}

function intro(text) {
  const m = text.match(/1、菜单内容简介[\s\S]*?(?=2、|$)/)
  return m ? m[0].replace(/1、菜单内容简介\s*/, '').replace(/\s+/g, ' ').trim() : ''
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

function searchDesc(text) {
  if (text.includes('5 个独立文本框')) {
    return '5 个独立文本框（学号/姓名/中文名/身份证号/手机号，有值同时满足）及原有下拉筛选字段'
  }
  const m = text.match(/3、支持查询检索的字段信息[\s\S]*?(?=4、|$)/)
  if (!m) return ''
  const names = listFieldNames(m[0])
  return names.length ? names.join('、') : ''
}

function dimBlock(title, before, after, summary) {
  return [
    p(`【${title}】`, true),
    line('调整前', before),
    line('调整后', after),
    line('差异总结', summary),
    p(''),
  ]
}

function line(label, text) {
  return new Paragraph({
    spacing: { after: 60 },
    indent: { left: 360 },
    children: [new TextRun({ text: `${label}：${text}`, size: SIZE, font: FONT })],
  })
}

function p(text, bold = false) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text, bold, size: SIZE, font: FONT })],
  })
}

function menuTitle(level, name) {
  const prefix = level === 1 ? '一级菜单' : '二级子菜单'
  return new Paragraph({
    heading: level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
    spacing: { before: level === 1 ? 200 : 120, after: 100 },
    children: [new TextRun({ text: `${prefix}：${name}`, bold: true, size: level === 1 ? 28 : 24, font: FONT })],
  })
}

function noChange() {
  return ['无变更', '无变更', '无变更']
}

function diff3(before, after, summary) {
  return [before, after, summary]
}

async function main() {
  const s = {}
  for (const id of [
    '2.2.1.1', '2.2.1.2', '2.2.1.3', '2.2.1.4', '2.2.1.4.1', '2.2.1.4.2',
    '2.2.1.4.3', '2.2.1.4.4', '2.2.1.5', '2.2.1.6', '2.2.1.7', '2.2.1.8', '2.2.1.9',
  ]) {
    s[id] = { v20: await getSection(V20, id), v24: await getSection(V24, id) }
  }

  const nodes24 = await extractDocxText(V24)
  const hasStudentTypeCol = nodes24.some((n) => n === '学籍类型' || n.includes('学籍类型列'))

  const children = []

  function addMenu(level, name, field, layout, content) {
    children.push(menuTitle(level, name))
    for (const [title, triple] of [['字段', field], ['排版', layout], ['内容', content]]) {
      children.push(...dimBlock(title, ...triple))
    }
  }

  // 2.2.1.1 学生基本信息
  {
    const t20 = s['2.2.1.1'].v20
    const t24 = s['2.2.1.1'].v24
    const f20 = listFieldNames(t20).join('、')
    const f24 = listFieldNames(t24).join('、')
    addMenu(
      1,
      '学生基本信息',
      diff3(
        `列表含${f20 || '学号、姓名、学生类别、专业等'}；搜索支持${searchDesc(t20) || '学号、学生姓名、学生类别等字段检索'}`,
        `列表字段结构不变${hasStudentTypeCol ? '，新增「学籍类型」列表列' : ''}；搜索新增 5 个独立文本框（学号/姓名/中文名/身份证号/手机号，多值 AND）及原有下拉筛选`,
        '新增学籍类型列及 5 个独立 AND 搜索文本框',
      ),
      diff3(
        '详情第八页签为 Tab「状态日志」，前置页签 Others；搜索区未明确 5 文本框分行布局',
        '第八页签改为标签页「状态日志」，前置页签「其他信息」；第一行 5 文本框+专业/入学批次/状态，折叠区含学生类别、国籍、学生准证有效期等',
        '搜索区布局描述更细，Tab 改为标签页',
      ),
      diff3(
        '支持 Preview 以学生身份跳转；详情无导出学籍卡',
        '改为以学生身份预览跳转；详情底部新增「导出学籍卡」按钮',
        '新增导出学籍卡，跳转描述通俗化',
      ),
    )
  }

  // 2.2.1.2 异动类别
  {
    const t20 = s['2.2.1.2'].v20
    const t24 = s['2.2.1.2'].v24
    const f = listFieldNames(t20).join('、') || '类别编码、类别名称、学籍状态、类别'
    addMenu(
      1,
      '异动类别',
      noChange(),
      noChange(),
      diff3(
        '使用 categoryCode、reasons[]、Set Reason 等表述；演示行含 DEF001',
        '改为类别编码、原因列表、设置原因等中文表述；演示行 DEF001 写作「休学异动类别」',
        '表述通俗化，业务规则不变',
      ),
    )
  }

  // 2.2.1.3 知情同意书
  {
    const t20 = s['2.2.1.3'].v20
    const t24 = s['2.2.1.3'].v24
    const f20 = listFieldNames(t20).join('、')
    const f24 = listFieldNames(t24).join('、')
    addMenu(
      1,
      '知情同意书',
      diff3(
        `列表/弹窗含${f20 || '名称、适用异动类别、Student Type、Remark'}`,
        `Student Type 改为「学生类别」，Remark 改为「备注」；新增「适用学生范围」（第一年/第二年及以上，非必填，列表展示）`,
        '字段中文化，新增适用学生范围',
      ),
      diff3(
        '弹窗顺序：名称→适用异动类别→Student Type→Remark→附件',
        '弹窗顺序：名称→适用异动类别→学生类别→适用学生范围→备注→附件',
        '弹窗字段顺序调整',
      ),
      diff3(
        '模板按「异动类别+Student Type」唯一；四 Tab 申请通过 resolveConsentTemplate 下载',
        '按「异动类别+学生类别」唯一；转专业/休学/复学/退学标签页及休学/退学家长区按类别+学生类别匹配下载',
        '唯一性规则与联动范围扩展至四类申请',
      ),
    )
  }

  // 2.2.1.7 异动规则设置（新增）
  addMenu(
    1,
    '异动规则设置',
    diff3('无此菜单', '列表字段：规则名称（只读）、规则值、是否启用、操作；无搜索字段', '整菜单新增'),
    diff3('无此菜单', '纯列表页，排在知情同意书之后；无搜索区；规则值行内修改，启用开关即时保存', '新增独立规则配置页'),
    diff3(
      '无此菜单',
      '四条内置规则（本地生长/短学期转专业周次上限、国际生距开学月数阈值、中国学生逾期是否允许提交）；本期仅演示存储',
      '新增全局异动规则配置',
    ),
  )

  // 2.2.1.4 学籍异动申请（老师）
  {
    const t20 = s['2.2.1.4'].v20
    const t24 = s['2.2.1.4'].v24
    addMenu(
      1,
      '学籍异动申请（老师）',
      diff3(
        '四类子申请列表字段各自独立；列表日期列名「生效学期」',
        '子菜单列表字段结构不变；列表日期列名改为「生效日期」',
        '日期列名由生效学期改为生效日期',
      ),
      diff3(
        'Tab 壳层嵌入四 View；默认打开「休学」；搜索双行（首行学号或姓名/专业代码/申请学年学期/状态，次行是否实施可收起）',
        '顶部四个标签页结构；默认打开「转专业」；搜索双行布局不变',
        '默认标签页由休学改为转专业',
      ),
      diff3(
        '状态含 Draft；页面称 Tab/View',
        'Draft 改为「草稿」；页面称标签页/申请页面结构',
        '用语通俗化',
      ),
    )
  }

  // 2.2.1.4.1 转专业
  addMenu(
    2,
    '转专业',
    diff3(
      '列表含申请编号、学号、姓名、原专业、新专业、状态、申请日期等；原因存 reasonId',
      '列表字段相同；原因存储表述为「原因编号」',
      '无字段增删，命名通俗化',
    ),
    diff3(
      '嵌套 Tab 壳层；Section I/VII 分区；StudentSelectModal 选学生',
      '四个标签页结构内；第一分区/第七分区；选择学生弹窗',
      '分区与容器命名中文化',
    ),
    diff3(
      '详情纯只读；流转日志独立弹窗',
      '详情抽屉顶部审批流程图、下方申请详情；支持预览PDF/导出PDF；流转历史合并进详情',
      '详情抽屉布局重构，新增 PDF 能力',
    ),
  )

  // 2.2.1.4.2 休学
  addMenu(
    2,
    '休学',
    diff3(
      '休学原因来自 DEF001 类别 reasons；家长信息手动填写，家长区可 Download Consent Letter',
      '原因来自「休学异动类别」配置；选学生后从家庭成员列表自动带入非空家长/监护人',
      '原因来源表述变更，家长信息改为自动带入',
    ),
    diff3('Tab 壳层内；家长区单一表单', '四个标签页结构内；≥2 人时分块展示（家长/监护人 1/2…）', '家长区支持多人分块展示'),
    diff3('声明区可下载知情同意书', '声明区不再提供「下载知情同意书」按钮，改由模板匹配下载', '删除声明区单独下载按钮'),
  )

  // 2.2.1.4.3 复学
  addMenu(
    2,
    '复学',
    noChange(),
    diff3('Tab 壳层内', '四个标签页组成的申请页面结构内', '容器描述变更，布局不变'),
    noChange(),
  )

  // 2.2.1.4.4 退学
  addMenu(
    2,
    '退学',
    diff3(
      '原因来自 WDR001 类别 reasons',
      '原因来自「退学异动类别配置的原因列表」',
      '原因来源表述变更',
    ),
    diff3('Tab 壳层内', '四个标签页结构内', '容器描述变更，布局不变'),
    noChange(),
  )

  // 2.2.1.5 学籍异动申请（学生）
  {
    const t20 = s['2.2.1.5'].v20
    const t24 = s['2.2.1.5'].v24
    addMenu(
      1,
      '学籍异动申请（学生）',
      noChange(),
      diff3('与老师共用 Tab 壳层与四 View', '与老师共用四个标签页组成的申请页面结构', '容器描述变更，结构不变'),
      diff3(
        '新建不提供 StudentSelectModal；引用 §2.2.1.4.1–4.4',
        '新建不提供选择学生弹窗；引用 2.2.1.4.1 至 2.2.1.4.4',
        '表述通俗化，差异规则不变',
      ),
    )
  }

  // 2.2.1.6 学籍异动审批
  {
    const t20 = s['2.2.1.6'].v20
    const t24 = s['2.2.1.6'].v24
    addMenu(
      1,
      '学籍异动审批',
      diff3(
        '列表含生效学期；是否实施显示 Y/N',
        '生效学期改为「生效日期」；是否实施显示「是/否」',
        '日期列改名，显示值中文化',
      ),
      diff3(
        'Tab 顺序待我审批→已提交→已处理历史；搜索五字段 inline；DetailModal+[审批]打开 MovementApprovalModal',
        '标签页顺序不变；搜索五字段同一行；申请详情弹窗+「审批」打开审批意见弹窗；详情抽屉流程图在上',
        '详情抽屉流程图在上，弹窗描述通俗化',
      ),
      diff3(
        '状态 Badge；ExportModal 导出；Recall 撤回',
        '状态标签；导出字段选择弹窗导出；撤回；管理端撤销仅出现在已处理历史列表',
        '导出/状态用语中文化，补充撤销范围说明',
      ),
    )
  }

  // 2.2.1.8 学籍异动维护
  {
    const t20 = s['2.2.1.8'].v20
    const t24 = s['2.2.1.8'].v24
    addMenu(
      1,
      '学籍异动维护',
      diff3(
        '15 列宽表，无文号列；含生效学期；是否实施 Y/N',
        '学号前新增文号列（未填显示 NA）；生效学期改为生效日期；是否实施改为是/否',
        '新增文号列，日期列改名，显示值中文化',
      ),
      diff3(
        '搜索单行五字段；行操作详情、流转日志；详情仅脱敏',
        '搜索两行九项条件；行操作修改文号、详情、导出PDF；详情含审批流程图+申请内容（护照等仍脱敏）',
        '搜索区扩展，行操作重构，详情增加流程图',
      ),
      diff3(
        '工具栏实施/导出/删除；流转日志查看审批历史；状态 Badge',
        '工具栏不变；流转日志合并进详情流程图；新增修改文号与导出PDF；状态改为胶囊形标签',
        '新增文号编制与 PDF 导出',
      ),
    )
  }

  // 2.2.1.9 学籍异动查询
  {
    const t20 = s['2.2.1.9'].v20
    const t24 = s['2.2.1.9'].v24
    addMenu(
      1,
      '学籍异动查询',
      diff3(
        '15 列只读宽表，无文号列；含生效学期；全部非 Draft 记录',
        '仍无文号列；生效学期改为生效日期；Draft 改为「草稿」',
        '日期列改名，状态词中文化',
      ),
      diff3(
        '搜索首行四字段、次行学号/姓名可收起；行操作详情（脱敏）与流转日志',
        '搜索区布局相同；行操作描述相同；详情抽屉含审批流程图',
        '详情抽屉布局变更',
      ),
      diff3(
        '工具栏仅导出；ExportModal 导出 xlsx；详情脱敏',
        '工具栏仅导出；导出字段选择弹窗导出 Excel；封面补充查询页预览PDF',
        '导出描述通俗化，详情增加 PDF 预览',
      ),
    )
  }

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 } } },
      children,
    }],
  })

  const buf = await Packer.toBuffer(doc)
  const alt = OUT.replace('.docx', '-菜单对比.docx')
  let target = OUT
  try {
    fs.writeFileSync(OUT, buf)
  } catch (e) {
    if (e.code === 'EBUSY') {
      fs.writeFileSync(alt, buf)
      target = alt
    } else throw e
  }
  console.log('已生成:', target)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
