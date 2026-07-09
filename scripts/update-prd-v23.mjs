/**
 * 基于 OpenSpec changes 将学籍管理 PRD V2.2 更新为 V2.3
 * 保留 docx 模板样式，仅替换/增补正文内容
 */
import fs from 'fs'
import JSZip from 'jszip'

const SOURCE = String.raw`c:\Users\admin\Desktop\马来教务\模板\厦大马来分校本科教务系统产品需求文档-学籍管理模块-V2.2.docx`
const TARGET = String.raw`c:\Users\admin\Desktop\马来教务\模板\厦大马来分校本科教务系统产品需求文档-学籍管理模块-V2.3.docx`

/** @type {Array<[string|string[], string|string[]]>} */
const REPLACEMENTS = [
  // ── 版本元数据 V2.3 ──
  ['文档版本：V2.2', '文档版本：V2.3'],
  [
    '说明：V2.2 在 V2.0 基础上继续对齐原型与 OpenSpec changes（截至 2026-07-09）：详情抽屉改为「申请内容在上 + 审批日志四列表格在下」；四异动 Section 重组与声明条款类型化；维护/查询列表列序与搜索统一（9 项+更多/收起）；管理端查询/维护/审批列表增加撤销（In Progress）；学生档案统一 keyword 搜索、补列与 Preview 以学生身份跳转；Student Pass Expiry 列表列与范围搜索；休学期间字段 tooltip 与起止日期；国际生备注与多槽位附件；审批列表增量列等。V2.0/V2.1 约定仍有效，增量见 §2.7、§2.8。',
    '说明：V2.3 在 V2.2 基础上继续对齐原型与 OpenSpec changes（截至 2026-07-09 晚）：详情抽屉改回「审批流程图在上 + 申请内容在下」（ApprovalTimeline，与课程申请一致）；管理端撤销收敛至审批历史 Tab；维护列表增加文号列与修改文号、行操作「导出 PDF」（查询为「预览 PDF」）；学生档案搜索拆为 5 个独立文本框；新增学籍类型列、详情导出学籍卡、知情同意书适用学生范围、异动规则设置菜单；审批列表移除最近审核时间列等。V2.0–V2.2 约定仍有效，增量见 §2.7、§2.8、§2.9。',
  ],
  ['V2.0/V2.1/V2.2 增量约定见 §2.6、§2.7、§2.8', 'V2.0–V2.3 增量约定见 §2.6、§2.7、§2.8、§2.9'],
  ['V2.2 增量见 §2.7、§2.8', 'V2.3 增量见 §2.7、§2.8、§2.9'],

  // ── §2.1 应用目录 ──
  [
    '学生基本信息七页签新建/编辑；详情八页签（含状态日志）；Preview 以学生身份跳转；导入导出',
    '学生基本信息七页签新建/编辑；详情八页签（含状态日志）+导出学籍卡；学籍类型列；5 字段搜索；Preview 以学生身份跳转；导入导出',
  ],
  [
    '知情同意书按异动类别+Student Type 模板学籍管理Student Status Management学籍异动Student Status Change学籍异动申请（老师）',
    '知情同意书配置行+版本快照；适用学生范围学籍管理Student Status Management学籍异动Student Status Change异动规则设置内置 3 条规则；规则值+启用学籍管理Student Status Management学籍异动Student Status Change学籍异动申请（老师）',
  ],
  [
    '学籍异动维护15 列；无 Edit/改编号',
    '学籍异动维护文号列+修改文号；导出 PDF；15 列；无 Edit/改编号',
  ],
  [
    '学籍异动查询只读；Preview PDF；异动类型筛选；详情抽屉含审批日志表',
    '学籍异动查询只读；预览 PDF；异动类型筛选；详情抽屉含审批流程图',
  ],
  [
    '学籍异动审批三 Tab；专业代码搜索；详情抽屉+Modal 审批',
    '学籍异动审批三 Tab；历史 Tab 撤销（In Progress）；历史申请次序列；专业代码搜索；详情抽屉+Modal 审批',
  ],
  [
    '已落地：学生基本信息、异动类别、知情同意书、学籍异动申请（老师/学生）、学籍异动审批、异动维护、异动查询。',
    '已落地：学生基本信息、异动类别、知情同意书、异动规则设置、学籍异动申请（老师/学生）、学籍异动审批、异动维护、异动查询。',
  ],

  // ── 详情抽屉：表格 → 流程图在上（V2.3 覆盖 V2.2）──
  [
    '详情抽屉改为「申请内容在上 + 审批日志四列表格在下」',
    '详情抽屉为「审批流程图在上 + 申请内容在下」（ApprovalTimeline + MovementDetailExportBody）',
  ],
  [
    '申请详情在上、审批日志表在下',
    '审批流程图在上、申请详情在下',
  ],
  [
    '上方为异动申请详情（MovementDetailContent），下方为审批日志四列表格（MovementApprovalLogTable：Description / Action By / Action By Role / Created At）',
    '上方为竖向审批流程图（ApprovalTimeline + buildMovementTimelineNodes），下方为异动申请详情（MovementDetailContent / MovementDetailExportBody）',
  ],
  [
    '申请详情在上、审批日志四列表格在下',
    '审批流程图在上、申请详情在下',
  ],
  [
    '（V2.2 已合并）审批流转历史改在详情抽屉底部以四列表格（MovementApprovalLogTable）展示，列含 Description、Action By、Action By Role、Created At；Submitted 显示 Application Submitted；不再单独打开 ApprovalLogModal 或 ApprovalTimeline。',
    '（V2.3 已合并）审批流转历史改在详情抽屉顶部以竖向流程图（ApprovalTimeline）展示，含阶段、处理人、状态徽章、时间与意见；申请字段在下方；Preview/Export PDF 与抽屉 WYSIWYG；不再单独打开 ApprovalLogModal。',
  ],
  [
    '·  描述：（V2.2）在详情抽屉底部审批日志表格查看完整流转历史；列表行内无独立「流转日志」按钮。',
    '·  描述：（V2.3）在详情抽屉顶部审批流程图查看完整流转历史；列表行内无独立「流转日志」按钮。',
  ],
  [
    '·  描述：（V2.2）在详情抽屉底部审批日志表格查看审批流转历史；列表行内无独立「流转日志」按钮。',
    '·  描述：（V2.3）在详情抽屉顶部审批流程图查看审批流转历史；列表行内无独立「流转日志」按钮。',
  ],
  [
    '·  业务的事件交互：V2.2 行内仅「详情」按钮；点击后抽屉内下方表格展示审批日志。',
    '·  业务的事件交互：V2.3 行内仅「详情」按钮；点击后抽屉内上方流程图、下方申请详情。',
  ],
  [
    '·  业务的事件交互：V2.2 点击「详情」打开 ApplicationDetailDrawer，申请详情在上、审批日志四列表格在下。',
    '·  业务的事件交互：V2.3 点击「详情」打开 ApplicationDetailDrawer，审批流程图在上、申请详情在下。',
  ],
  [
    '·  描述：详情抽屉只读展示申请全文与底部审批日志表；待我审批时底栏 [审批] 打开 MovementApprovalModal。',
    '·  描述：详情抽屉只读展示流程图+申请全文；待我审批时底栏 [审批] 打开 MovementApprovalModal。',
  ],
  [
    '·  业务的事件交互：行内点击「详情」→ 右滑打开 ApplicationDetailDrawer（只读详情+底部审批日志表）。',
    '·  业务的事件交互：行内点击「详情」→ 右滑打开 ApplicationDetailDrawer（流程图在上+只读详情在下）。',
  ],
  [
    '（V2.2 已合并至详情抽屉底部审批日志表，无独立日志按钮）',
    '（V2.3 已合并至详情抽屉顶部审批流程图，无独立日志按钮）',
  ],
  [
    '详情抽屉含审批日志表',
    '详情抽屉含审批流程图',
  ],
  [
    'MovementApprovalLogTable 四列表格（Description / Action By / Action By Role / Created At）置于申请详情下方；Submitted 显示 Application Submitted；Created At 格式 YYYY-MM-DD HH:mm:ss',
    'ApprovalTimeline 竖向流程图置于申请详情上方；节点含阶段、处理人、状态徽章、时间与意见；MovementDetailExportBody 供抽屉与 PDF 预览/导出共用',
  ],
  [
    '顶栏固定，中间可滚动（申请详情在上、审批日志表在下），底栏场景按钮（Close/Review/Recall 等）；Cancel 保留在列表行',
    '顶栏固定，中间可滚动（流程图在上、申请详情在下），底栏场景按钮（Close/Review/Recall/Export PDF 等）',
  ],

  // ── 撤销入口 V2.3（覆盖 V2.2）──
  [
    '管理端查询/维护/审批列表增加撤销（In Progress）',
    '管理端撤销仅审批历史 Tab（In Progress）；查询/维护/申请管理端列表无撤销',
  ],
  [
    '管理端撤销异动查询/维护/审批列表status===In Progress 时行内显示「撤销」/Cancel（tooltip+确认弹框）；不在详情抽屉底栏；学生端 Early Cancel 规则不变',
    '管理端撤销仅异动审批历史 Tab；status===In Progress 时行内「撤销」；查询/维护/申请管理端无撤销；学生端 Early Cancel 不变',
  ],
  [
    '异动查询/维护/审批列表',
    '异动审批 · 历史 Tab',
  ],
  [
    'status===In Progress 时行内显示「撤销」/Cancel（tooltip+确认弹框）；不在详情抽屉底栏；学生端 Early Cancel 规则不变',
    '仅 In Progress 行内「撤销」；查询/维护/申请管理端无撤销；学生端 Early Cancel 不变',
  ],
  [
    '只读；Preview PDF；异动类型筛选',
    '只读；预览 PDF；异动类型筛选',
  ],
  [
    '前缀列统一至生效日期；nationality 列；9 项搜索+更多/收起；点击查询才过滤；导出列序与主表一致',
    '前缀列含文号（维护）；统一至生效日期；nationality 列；9 项搜索+更多/收起；维护导出 PDF/查询预览 PDF',
  ],
  [
    '查询/维护/审批三列表 In Progress 时显示「撤销」/Cancel（带 tooltip+确认）；学生端 Pending Review 且审批未开始仍可 Cancel',
    '仅审批历史 Tab In Progress 显示「撤销」；学生端 Pending Review 且审批未开始仍可 Cancel',
  ],
  [
    'V2.2 行操作「详情」（含审批日志表）+ In Progress 时「撤销」；Preview PDF；无独立流转日志按钮',
    'V2.3 行操作「详情」（含流程图）+「导出 PDF」/「预览 PDF」；维护另有「修改文号」；无独立流转日志按钮',
  ],

  // ── 学生档案搜索 V2.3 ──
  [
    '学生档案统一 keyword 搜索、补列与 Preview 以学生身份跳转',
    '学生档案 5 字段独立搜索（学号/姓名/中文名/身份证/电话）、学籍类型列与 Preview 以学生身份跳转',
  ],
  [
    '搜索区支持统一 keyword 模糊检索（学号/姓名/中文名/NRIC/电话 OR 匹配）及下列字段：',
    '搜索区支持 5 个独立文本框模糊检索（学号/姓名/中文名/身份证号/手机号，有值 AND 组合）及下列字段：',
  ],
  [
    '填写 keyword 或下拉筛选后点击「查询」（带图标）或「重置」；折叠区含 Student Type、Nationality、Registration Time、Programme Level、Programme Structure、Expected Completion/Graduation Batch、Outstanding Fee、Student Pass Expiry 日期范围',
    '填写各文本框或下拉筛选后点击「查询」（带图标）或「重置」；第一行 5 文本框 + Programme/Intake/Status；折叠区含 Student Type、Nationality 等；折叠区含 Student Pass Expiry 日期范围',
  ],
  [
    'keyword OR 匹配；主表补 Status/Nationality/Outstanding Fee；左侧冻结复选框/序号/学号/姓名；Programme Level 统一 Foundation/Undergraduate/Postgraduate',
    '5 字段 AND 模糊匹配；主表补 Status/学籍类型/Nationality/Outstanding Fee；左侧冻结复选框/序号/学号/姓名；Programme Level 统一 Foundation/Undergraduate/Postgraduate',
  ],

  // ── 维护/查询 PDF 按钮分化 ──
  [
    '前缀列：序号→状态→审批环节→是否实施→学号→姓名→Intake→Programme→生效日期→…；Preview PDF；9 项搜索+更多/收起',
    '前缀列：序号→状态→审批环节→是否实施→文号→学号→姓名→Intake→Programme→生效日期→…；维护「导出 PDF」/查询「预览 PDF」；9 项搜索+更多/收起',
  ],
  [
    '学籍异动查询              只读；Preview PDF；列序与维护一致；9 项搜索+更多/收起',
    '学籍异动查询              只读；预览 PDF；列序与维护一致（无文号列）；9 项搜索+更多/收起',
  ],
  [
    '操作列 Preview PDF，与详情 Export PDF 同源',
    '维护行操作「导出 PDF」、查询行操作「预览 PDF」；与详情 Export PDF 弹窗同源（MovementDetailPdfPreviewModal）',
  ],

  // ── 审批列表列 V2.3 ──
  [
    '三 Tab（待我审批→已提交→历史）；inline 5 字段搜索（学年学期/专业代码/状态/学号/姓名）；增量列：申请日期、历史申请次序、Last Action Time；详情抽屉+Modal 审批',
    '三 Tab（待我审批→已提交→历史）；inline 5 字段搜索；增量列：申请日期、历史申请次序（已移除最近审核时间）；历史 Tab 撤销；详情抽屉+Modal 审批',
  ],
  [
    '历史申请次序、Last Action Time（表头 tooltip）；申请日期列；附件区「支持格式」hint 在按钮下方',
    '历史申请次序（表头 tooltip）；申请日期列；已移除最近审核时间；附件区「支持格式」hint 在按钮下方',
  ],

  // ── 学生档案增量字段 ──
  [
    '或行内编辑/详情/预览（以学生身份跳转学生端异动申请）查看',
    '或行内编辑/详情/预览（以学生身份跳转学生端异动申请）查看；详情 footer「导出学籍卡」',
  ],
  [
    '详情八页签（含状态日志）；Preview 以学生身份跳转',
    '详情八页签（含状态日志）+导出学籍卡；学籍类型列；Preview 以学生身份跳转',
  ],

  // ── 知情同意书适用学生范围 ──
  [
    '配置行+版本快照；按异动类别×Student Type×学历层次',
    '配置行+版本快照；适用学生范围（第一年/第二年及以上）；按异动类别×Student Type×学历层次',
  ],

  // ── §2.7 详情抽屉描述修正（插入块内）──
  [
    '单一「详情」按钮；上方 MovementDetailContent 申请全文，下方 MovementApprovalLogTable 四列；管理端 Footer 可「导出 PDF」',
    '单一「详情」按钮；上方 ApprovalTimeline 流程图，下方 MovementDetailContent；管理端 Footer 可「导出 PDF」',
  ],
]

const FLOW_LOG_MERGED_NOTE =
  '（V2.3 说明：本按钮已合并至「详情」抽屉内顶部审批流程图，原型不再提供独立「流转日志/Approval Log」行内按钮；以下描述供历史变更追溯。）'

function esc(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function p(text, style = '') {
  const pPr = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''
  return `<w:p w:rsidR="00E664A3" w:rsidRDefault="00000000">${pPr}<w:r><w:rPr><w:rFonts w:ascii="宋体" w:hAnsi="宋体" w:cs="宋体" w:hint="eastAsia"/></w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`
}

function applyReplacements(xml) {
  let result = xml
  let total = 0
  for (const [from, to] of REPLACEMENTS) {
    if (result.includes(from)) {
      result = result.split(from).join(to)
      total++
    }
  }
  return { xml: result, count: total }
}

function buildSection29Xml() {
  const lines = [
    p('2.9 V2.3 交互统一约定（2026-07-09）', '2'),
    p('V2.3 在 V2.2 已落地能力基础上，继续对齐 OpenSpec changes 下列增量；与 V2.2 冲突处以本节为准。'),
    p('约定项'),
    p('适用范围'),
    p('规则说明'),
    p('详情抽屉布局'),
    p('异动详情/PDF 预览/导出'),
    p('ApprovalTimeline 在上、MovementDetailContent 在下；MovementDetailExportBody 三处同源 WYSIWYG'),
    p('管理端撤销'),
    p('学籍异动审批 · 历史 Tab'),
    p('仅 In Progress 行显示「撤销」；移除查询/维护/申请管理端撤销入口'),
    p('维护文号'),
    p('学籍异动维护'),
    p('学号前列「文号」（未填 NA）；行操作「修改文号」弹窗；PDF 文件名前缀用手动文号，无随机'),
    p('PDF 行操作文案'),
    p('维护 vs 查询'),
    p('维护「导出 PDF」；查询「预览 PDF」；共用 MovementDetailPdfPreviewModal'),
    p('学生档案搜索'),
    p('学生基本信息列表'),
    p('5 独立文本框 AND 模糊匹配；取代 V2.2 统一 keyword'),
    p('学籍类型'),
    p('学生基本信息列表/Enrollment Tab'),
    p('列表学籍状态右侧列；Enrollment 下拉随状态联动；无搜索筛选'),
    p('导出学籍卡'),
    p('学生基本信息详情抽屉'),
    p('footer 左侧「导出学籍卡」按钮（本期仅入口，无逻辑）'),
    p('知情同意书适用学生范围'),
    p('知情同意书配置'),
    p('新建/编辑 Remark 前下拉；列表列展示；不参与模板匹配键'),
    p('异动规则设置'),
    p('学籍异动侧边栏'),
    p('知情同意书后新增菜单；3 条内置规则；可改规则值与启用；无新增/搜索'),
    p('审批列表列'),
    p('学籍异动审批'),
    p('保留历史申请次序；移除最近审核时间列'),
    p('关联 OpenSpec 变更包（V2.3 增量）'),
    p('refine-movement-detail-approval-timeline、refine-movement-admin-cancel-to-approval-history、add-movement-maintenance-archive-number、refine-movement-maintenance-pdf-action-label、refine-student-profile-split-keyword-search、add-student-profile-track-category-field、add-student-profile-export-card-button、add-consent-form-applicable-student-scope、add-movement-rule-settings、refine-movement-rule-settings-split-rows、remove-movement-approval-last-action-time-column 等'),
  ]
  return lines.join('')
}

function insertSection29(xml) {
  if (xml.includes('2.9 V2.3')) return xml
  const insertAt = xml.lastIndexOf('</w:body>')
  if (insertAt === -1) return xml
  return xml.slice(0, insertAt) + buildSection29Xml() + xml.slice(insertAt)
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error('源文件不存在:', SOURCE)
    process.exit(1)
  }

  const buf = fs.readFileSync(SOURCE)
  const zip = await JSZip.loadAsync(buf)
  let xml = await zip.file('word/document.xml').async('string')
  const before = xml.length

  const { xml: updated, count } = applyReplacements(xml)
  xml = updated
  console.log(`已应用 ${count} 处文本替换`)

  for (const re of [
    /(<w:t[^>]*>)(6、功能按钮\/开关——流转日志[^<]*)(<\/w:t>)/g,
    /(<w:t[^>]*>)(7、功能按钮\/开关——流转日志[^<]*)(<\/w:t>)/g,
    /(<w:t[^>]*>)(8、功能按钮\/开关——流转日志[^<]*)(<\/w:t>)/g,
    /(<w:t[^>]*>)(9、功能按钮\/开关——流转日志[^<]*)(<\/w:t>)/g,
  ]) {
    xml = xml.replace(re, (m, a, b, c) => {
      if (b.includes('V2.3 说明')) return m
      return `${a}${b}${esc(FLOW_LOG_MERGED_NOTE)}${c}`
    })
  }

  xml = insertSection29(xml)

  zip.file('word/document.xml', xml)
  const out = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  fs.writeFileSync(TARGET, out)
  console.log(`已生成: ${TARGET}`)
  console.log(`document.xml 字节: ${before} → ${xml.length}`)

  const checks = [
    '文档版本：V2.3',
    '2.9 V2.3',
    'ApprovalTimeline',
    '审批流程图在上',
    '异动规则设置',
    '文号',
    '导出 PDF',
    '预览 PDF',
    '5 个独立文本框',
    '学籍类型',
    '导出学籍卡',
    '适用学生范围',
    '审批历史 Tab',
    '最近审核时间',
  ]
  console.log('\n--- 校验 ---')
  for (const s of checks) {
    console.log(s, xml.includes(s) ? 'OK' : 'MISSING')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
