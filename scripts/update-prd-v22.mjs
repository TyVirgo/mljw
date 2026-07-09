/**
 * 基于 OpenSpec changes 将学籍管理 PRD V2.0 更新为 V2.2
 * 保留 docx 模板样式，仅替换/增补正文内容
 */
import fs from 'fs'
import JSZip from 'jszip'

const SOURCE = String.raw`c:\Users\admin\Desktop\马来教务\模板\厦大马来分校本科教务系统产品需求文档-学籍管理模块-V2.0.docx`
const TARGET = String.raw`c:\Users\admin\Desktop\马来教务\模板\厦大马来分校本科教务系统产品需求文档-学籍管理模块-V2.2.docx`

/** @type {Array<[string|string[], string|string[]]>} */
const REPLACEMENTS = [
  // ── 版本元数据 V2.2 ──
  ['文档版本：V2.0', '文档版本：V2.2'],
  ['创建日期：2026年6月30日', '创建日期：2026年7月9日'],
  [
    '说明：V2.0 在 V1.9 基础上对齐原型最新交互与 OpenSpec changes：统一申请详情右滑抽屉（详情+竖向审批时间线合并，移除独立流转日志入口）；附件文件名旁增加在线预览（👁）；审核弹框操作选项改为通过/不通过/驳回；学生档案国籍优先录入并自动带出学生类别；详情抽屉新增状态日志 Tab；知情同意书改为配置行+版本快照模型；等。V1.9 约定仍有效，V2.0 增量见 §2.6。',
    '说明：V2.2 在 V2.0 基础上继续对齐原型与 OpenSpec changes（截至 2026-07-09）：详情抽屉改为「申请内容在上 + 审批日志四列表格在下」；四异动 Section 重组与声明条款类型化；维护/查询列表列序与搜索统一（9 项+更多/收起）；管理端查询/维护/审批列表增加撤销（In Progress）；学生档案统一 keyword 搜索、补列与 Preview 以学生身份跳转；Student Pass Expiry 列表列与范围搜索；休学期间字段 tooltip 与起止日期；国际生备注与多槽位附件；审批列表增量列等。V2.0/V2.1 约定仍有效，增量见 §2.7、§2.8。',
  ],
  ['V2.0 增量约定见 §2.6', 'V2.0/V2.1/V2.2 增量约定见 §2.6、§2.7、§2.8'],
  ['V2.0 增量见 §2.6', 'V2.2 增量见 §2.7、§2.8'],

  // ── §2.1 应用目录 ──
  ['15 列；无 Edit/改编号；详情抽屉含时间线', '15 列；Preview PDF；无 Edit/改编号；详情抽屉含审批日志表'],
  ['只读；异动类型筛选；详情抽屉含时间线', '只读；Preview PDF；异动类型筛选；详情抽屉含审批日志表'],
  ['Tab 壳层；双行搜索含学号/姓名', 'Tab 壳层；默认转专业；双行搜索含学号/姓名'],
  ['Tab 壳层；隐藏学号/姓名列', 'Tab 壳层；默认转专业；隐藏学号/姓名列'],
  ['七页签新建/编辑；详情八页签（含状态日志）；导入导出', '七页签新建/编辑；详情八页签（含状态日志）；Preview 以学生身份跳转；导入导出'],

  // ── 默认 Tab 转专业 ──
  ['（默认休学）', '（默认转专业）'],
  ['默认 Tab 为休学', '默认 Tab 为转专业'],
  ['默认休学', '默认转专业'],

  // ── 详情抽屉：时间线 → 审批日志表（V2.1/V2.2）──
  [
    '下钻页面说明：下钻至「申请详情右滑抽屉」（MovementApplicationDetailDrawer）：固定顶栏标题+关闭；可滚动区上方为竖向审批时间线（ApprovalTimeline，替代原 ApprovalLogModal 表格），下方为异动详情字段（MovementDetailContent）；固定底栏 [关闭]；待我审批场景另有 [审批] 打开 MovementApprovalModal、[撤回]（History 且允许时）。列表页保持可见，不再整页替换 ReviewView。',
    '下钻页面说明：下钻至「申请详情右滑抽屉」（ApplicationDetailDrawer / MovementApplicationDetailDrawer）：固定顶栏标题+关闭；可滚动区上方为异动申请详情（MovementDetailContent），下方为审批日志四列表格（MovementApprovalLogTable：Description / Action By / Action By Role / Created At）；固定底栏 [关闭]；待我审批场景另有 [审批] 打开 MovementApprovalModal、[撤回]（History 且允许时）。列表页保持可见；Cancel 保留在列表行，不在抽屉底栏。',
  ],
  [
    '下钻页面说明：下钻至「申请详情右滑抽屉」（MovementApplicationDetailDrawer）：时间线+详情+底栏操作；[审批] 打开 MovementApprovalModal（操作选项：通过/不通过/驳回）。',
    '下钻页面说明：下钻至「申请详情右滑抽屉」（ApplicationDetailDrawer）：申请详情在上、审批日志表在下；[审批] 打开 MovementApprovalModal（操作选项：通过/不通过/驳回）。',
  ],
  [
    '下钻页面说明：（V2.0 已合并）审批流转历史改在详情抽屉顶部以竖向时间线（ApprovalTimeline）展示，含阶段名、处理人、状态徽章、时间与意见；不再单独打开 ApprovalLogModal。',
    '下钻页面说明：（V2.2 已合并）审批流转历史改在详情抽屉底部以四列表格（MovementApprovalLogTable）展示，列含 Description、Action By、Action By Role、Created At；Submitted 显示 Application Submitted；不再单独打开 ApprovalLogModal 或 ApprovalTimeline。',
  ],
  [
    '·  描述：（V2.0 已合并至「详情」）在详情抽屉顶部时间线查看完整流转历史。',
    '·  描述：（V2.2）在详情抽屉底部审批日志表格查看完整流转历史；列表行内无独立「流转日志」按钮。',
  ],
  [
    '·  描述：（V2.0 已合并至「详情」）在详情抽屉顶部时间线查看审批流转历史。',
    '·  描述：（V2.2）在详情抽屉底部审批日志表格查看审批流转历史；列表行内无独立「流转日志」按钮。',
  ],
  [
    '·  业务的事件交互：V2.0 行内仅「详情」按钮；点击后抽屉内时间线区展示流转历史。',
    '·  业务的事件交互：V2.2 行内仅「详情」按钮；点击后抽屉内下方表格展示审批日志。',
  ],
  [
    '·  业务的事件交互：V2.0 点击「详情」打开 ApplicationDetailDrawer/MovementApplicationDetailDrawer，时间线区展示环节、操作人、状态徽章、时间与意见。',
    '·  业务的事件交互：V2.2 点击「详情」打开 ApplicationDetailDrawer，申请详情在上、审批日志四列表格在下。',
  ],
  [
    '·  描述：详情抽屉只读展示申请全文与时间线；待我审批时底栏 [审批] 打开 MovementApprovalModal。',
    '·  描述：详情抽屉只读展示申请全文与底部审批日志表；待我审批时底栏 [审批] 打开 MovementApprovalModal。',
  ],
  [
    '·  业务的事件交互：行内点击「详情」→ 右滑打开 MovementApplicationDetailDrawer（只读详情+时间线）。',
    '·  业务的事件交互：行内点击「详情」→ 右滑打开 ApplicationDetailDrawer（只读详情+底部审批日志表）。',
  ],
  [
    'V2.0 行操作仅「详情」（含时间线）；无独立流转日志按钮；工具栏保留实施、导出、删除',
    'V2.2 行操作「详情」（含审批日志表）+ In Progress 时「撤销」；Preview PDF；无独立流转日志按钮；工具栏保留实施、导出、删除',
  ],
  [
    '（V2.0 已合并至详情抽屉顶部竖向时间线，无独立日志按钮）',
    '（V2.2 已合并至详情抽屉底部审批日志表，无独立日志按钮）',
  ],

  // ── 转专业 Section VII ──
  [
    '转专业 Section VII 申请侧 disabled',
    '转专业 Section VII 不在申请 FormModal 展示（仅审批详情可编辑、已批准详情只读，样式与上下 Section 一致）',
  ],
  [
    'Section VII 申请侧 disabled',
    'Section VII 不在申请 FormModal 展示',
  ],

  // ── 家长/监护人多位 ──
  ['Section III 家长同意', 'Section III 家长/监护人确认与同意（可多位联系人）'],
  [
    '家长区可 Download Consent Letter',
    'Section III 选学生后从 family[] 映射全部非空家长/监护人（重复 form-grid；≥2 人时以「家长/监护人 1/2…」标签与分割线区分）；声明区不再提供 Download Consent Letter 按钮',
  ],

  // ── 日期格式 ──
  [
    'YYYY-MM-DD（formatMovementDate）',
    '展示 dd.Mmm.YYYY（如 29.Sep.2025）；存储 ISO YYYY-MM-DD（formatMovementDate）',
  ],

  // ── Demo 国籍 ──
  ['Demo 数据国籍含 Taiwan', 'Demo 数据国籍不含 Taiwan（已移除该选项）'],

  // ── 撤销入口 V2.2（覆盖 V2.0 收窄描述）──
  [
    '查询/审批列表无 Cancel',
    '查询/维护/审批三列表 In Progress 时显示「撤销」/Cancel（带 tooltip+确认）；学生端 Pending Review 且审批未开始仍可 Cancel',
  ],

  // ── 维护/查询 ──
  ['生效学期', '生效日期'],
  [
    '学籍异动维护                      15 列；无 Edit/改编号',
    '学籍异动维护                      前缀列：序号→状态→审批环节→是否实施→学号→姓名→Intake→Programme→生效日期→…；Preview PDF；9 项搜索+更多/收起',
  ],
  [
    '学籍异动查询              只读',
    '学籍异动查询              只读；Preview PDF；列序与维护一致；9 项搜索+更多/收起',
  ],

  // ── 学生档案搜索 V2.2 ──
  [
    '搜索区支持以下字段检索：',
    '搜索区支持统一 keyword 模糊检索（学号/姓名/中文名/NRIC/电话 OR 匹配）及下列字段：',
  ],
  [
    '填写搜索条件后查询或重置',
    '填写 keyword 或下拉筛选后点击「查询」（带图标）或「重置」；折叠区含 Student Type、Nationality、Registration Time、Programme Level、Programme Structure、Expected Completion/Graduation Batch、Outstanding Fee、Student Pass Expiry 日期范围',
  ],

  // ── Student Pass Expiry ──
  [
    'Basic Info Tab 内不再重复国籍字段',
    'Basic Info Tab 内不再重复国籍字段；China/International 展示只读 Student Pass Expiry Date（dd/mm/yyyy，IO 维护）；Local 不展示',
  ],

  // ── §2.6 旧时间线描述更新 ──
  [
    'ApprovalTimeline 竖向时间线替代 ApprovalLogModal 表格；节点含阶段、处理人、状态徽章（Submitted/Pending/Approved 等）、时间、意见；异动结合 workflowStages 补全未到达节点',
    'MovementApprovalLogTable 四列表格（Description / Action By / Action By Role / Created At）置于申请详情下方；Submitted 显示 Application Submitted；Created At 格式 YYYY-MM-DD HH:mm:ss',
  ],
  [
    '原「详情+流转日志/Approval Log」双按钮合并为单一「详情」；点击后 ApplicationDetailDrawer（或 MovementApplicationDetailDrawer）右滑进入；顶栏固定，中间可滚动，底栏场景按钮（Close/Review/Recall 等）',
    '原「详情+流转日志/Approval Log」双按钮合并为单一「详情」；点击后 ApplicationDetailDrawer 右滑进入；顶栏固定，中间可滚动（申请详情在上、审批日志表在下），底栏场景按钮（Close/Review/Recall 等）；Cancel 保留在列表行',
  ],
  [
    '顶栏固定，中间可滚动，底栏场景按钮（Close/Review/Recall 等）',
    '顶栏固定，中间可滚动（申请详情在上、审批日志表在下），底栏场景按钮（Close/Review/Recall 等）',
  ],

  // ── 异动表单 Section 重组 ──
  [
    'Section II；只读',
    'Section I 只读（Current Programme/Intake/School 自 Section II 移入）',
  ],
  [
    '新增/编辑转专业申请页面——Tab2（Section II 转专业信息、英文名：Programme Transfer Info）',
    '新增/编辑转专业申请页面——Tab2（Section II : STUDENT APPLICATION，仅 Start Semester、新专业志愿、transferReason；Current 字段在 Section I）',
  ],
  [
    'Section IV 支持性文件',
    'Section IV : SUPPORTING DOCUMENTS（复学无 Download Consent Letter；国际生另必填 Flight Tickets；复学可选 Medical Recovery；同意书 pdf/jpg/png/docx ≤5MB）',
  ],
  [
    '「休学期间」下拉',
    '「休学期间」下拉（标签旁 ? tooltip：可含申请日之前补回学期与之后学期）',
  ],
  [
    'Deferment Period 下拉',
    'Deferment Period 下拉（休学期间字段 tooltip 说明补回/之后学期）',
  ],

  // ── 审批列表增量列 ──
  [
    '三 Tab；专业代码搜索；详情抽屉+Modal 审批',
    '三 Tab（待我审批→已提交→历史）；inline 5 字段搜索（学年学期/专业代码/状态/学号/姓名）；增量列：申请日期、历史申请次序、Last Action Time；详情抽屉+Modal 审批',
  ],

  // ── Preview 登录 ──
  [
    '或行内编辑/详情查看',
    '或行内编辑/详情/预览（以学生身份跳转学生端异动申请）查看',
  ],

  // ── 状态日志备注 ──
  [
    'StatusLogTab 四列只读）',
    'StatusLogTab 四列只读；毕业备注含 Completion/Graduation Batch/Date；退学备注含 Last Date of Attendance+Reason（WDR001）；转专业 Implement 备注含 oldCode→newCode 与学期；休学备注含起止日期）',
  ],

  // ── 知情同意书/附件 hint ──
  [
    '上传后文件名旁显示 👁 预览',
    '上传后文件名旁显示 👁 预览；「支持格式」hint 位于每行「选择文件」按钮下方',
  ],

  // ── 字段标签统一 ──
  ['Programme Level 中文', 'Programme Level 中文统一「专业层次」；表头/搜索/详情 label 同源注册表；表头带 tooltip'],
]

const FLOW_LOG_MERGED_NOTE =
  '（V2.2 说明：本按钮已合并至「详情」抽屉内底部审批日志表，原型不再提供独立「流转日志/Approval Log」行内按钮；以下描述供历史变更追溯。）'

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
    if (Array.isArray(from)) {
      for (let i = 0; i < from.length; i++) {
        const f = from[i]
        const t = Array.isArray(to) ? to[i] : to
        if (result.includes(f)) {
          result = result.split(f).join(t)
          total++
        }
      }
    } else if (result.includes(from)) {
      result = result.split(from).join(to)
      total++
    }
  }
  return { xml: result, count: total }
}

function buildSection27Xml() {
  const lines = [
    p('2.7 V2.1 交互统一约定（2026-07-02）', '2'),
    p('V2.1 在 V2.0 已落地能力基础上，继续对齐 OpenSpec changes 下列增量；未列出的模块仍按 §2.2 各菜单说明执行。'),
    p('约定项'),
    p('适用范围'),
    p('规则说明'),
    p('详情抽屉布局'),
    p('异动申请/审批/维护/查询、PDF 预览'),
    p('单一「详情」按钮；上方 MovementDetailContent 申请全文，下方 MovementApprovalLogTable 四列；管理端 Footer 可「导出 PDF」'),
    p('转专业 Section VII'),
    p('ProgrammeTransferOfficeUseSection'),
    p('申请 FormModal 不含 Section VII；审批详情可编辑；已批准只读；movement-detail-body 样式'),
    p('多位家长/监护人'),
    p('休学/退学 Section III'),
    p('选学生后从 student.family[] 映射 parentContacts[]；≥2 人时序号标签与分割线；不回写档案'),
    p('休学起止日期'),
    p('休学/复学 Section II'),
    p('「休学期间」下方只读起止日期（dd/MM/YYYY），联动 semesterInfo'),
    p('默认申请 Tab'),
    p('学籍异动申请（老师/学生）'),
    p('Tab 壳层默认转专业'),
    p('Preview PDF'),
    p('异动维护/查询列表'),
    p('操作列 Preview PDF，与详情 Export PDF 同源'),
    p('异动原因适用人员'),
    p('异动类别「设置原因」'),
    p('适用人员类别老师/学生多选（默认双选）'),
    p('学籍 Enrollment 级联'),
    p('学生基本信息'),
    p('专业 → 专业代码 → 专业层次 → 学院；专业优先联动'),
    p('Demo 国籍'),
    p('学生档案'),
    p('移除 Taiwan 选项'),
    p('关联 OpenSpec 变更包（V2.1 增量）'),
    p('refine-movement-admin-detail-export、add-movement-parent-contacts-from-family、add-programme-transfer-office-use-approval、refine-movement-application-default-tab-and-visa-expiry、add-movement-list-pdf-preview、refine-movement-reason-personnel-multiselect、add-deferment-resumption-period-date-fields、refine-student-profile-enrollment-programme-first-cascade、remove-taiwan-from-demo-nationality 等'),
  ]
  return lines.join('')
}

function buildSection28Xml() {
  const lines = [
    p('2.8 V2.2 交互统一约定（2026-07-09）', '2'),
    p('V2.2 在 V2.1 已落地能力基础上，继续对齐 OpenSpec changes 下列增量。'),
    p('约定项'),
    p('适用范围'),
    p('规则说明'),
    p('管理端撤销'),
    p('异动查询/维护/审批列表'),
    p('status===In Progress 时行内显示「撤销」/Cancel（tooltip+确认弹框）；不在详情抽屉底栏；学生端 Early Cancel 规则不变'),
    p('维护/查询列序与搜索'),
    p('异动维护+异动查询'),
    p('前缀列统一至生效日期；nationality 列；9 项搜索+更多/收起；点击查询才过滤；导出列序与主表一致'),
    p('审批列表增量列'),
    p('学籍异动审批'),
    p('历史申请次序、Last Action Time（表头 tooltip）；申请日期列；附件区「支持格式」hint 在按钮下方'),
    p('Student Pass Expiry'),
    p('学生基本信息'),
    p('China/International 只读字段；列表列+From/To 范围搜索+导出；转专业 visaExpiryDate 改读此字段'),
    p('学生档案搜索'),
    p('学生基本信息列表'),
    p('keyword OR 匹配；主表补 Status/Nationality/Outstanding Fee；左侧冻结复选框/序号/学号/姓名；Programme Level 统一 Foundation/Undergraduate/Postgraduate'),
    p('Preview 登录'),
    p('学生基本信息列表'),
    p('操作列 Preview（中文「预览」）以学生 studentId 跳转学籍异动申请（学生端）；无顶栏 Banner'),
    p('异动表单结构'),
    p('四异动申请/详情'),
    p('Section II–IV 重组；Applicant Notes 在 Section I 前；Declaration 在附件后；类型化声明条款（退学1条/休学复学2条/转专业3条）；国际生备注在 Applicant Notes 下'),
    p('Status Log 备注'),
    p('学生档案详情 Tab8'),
    p('毕业四字段；退学 WDR001 原因；转专业学期行；休学起止日期行'),
    p('休学期间 tooltip'),
    p('休学/复学表单'),
    p('「休学期间」标签旁 ? 说明可含申请日前补回与之后学期'),
    p('关联 OpenSpec 变更包（V2.2 增量）'),
    p('add-movement-admin-cancel、refine-movement-maintenance-query-list-columns-search、add-student-pass-expiry-date、add-status-log-graduation-withdrawal-remarks、add-deferment-period-field-tooltip、add-movement-approval-list-columns-and-documents-hint、add-movement-international-remarks-and-documents、add-programme-transfer-status-log-remark、add-student-profile-preview-login、restructure-movement-application-sections、reorder-movement-declaration-and-applicant-notes、unify-movement-declaration-section、unify-student-profile-field-labels、refine-student-profile-list-search、refine-student-profile-enrollment-demo-fields、refine-movement-declaration-content、unify-application-detail-drawer 等'),
  ]
  return lines.join('')
}

function insertSections(xml) {
  const insertAt = xml.lastIndexOf('</w:body>')
  if (insertAt === -1) return xml
  if (xml.includes('2.7 V2.1')) return xml
  return xml.slice(0, insertAt) + buildSection27Xml() + buildSection28Xml() + xml.slice(insertAt)
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
    xml = xml.replace(re, `$1$2${esc(FLOW_LOG_MERGED_NOTE)}$3`)
  }

  xml = insertSections(xml)

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
    '文档版本：V2.2',
    '2.7 V2.1',
    '2.8 V2.2',
    'MovementApprovalLogTable',
    '默认转专业',
    'Preview PDF',
    '撤销',
    'Student Pass Expiry',
    '历史申请次序',
    '生效日期',
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
