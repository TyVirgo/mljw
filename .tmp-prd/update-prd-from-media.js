import fs from 'fs'
import path from 'path'

const root = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'))
const input = path.join(root, 'prd-v2.0.md')
const output = path.join(root, 'prd-v2.1.md')

let text = fs.readFileSync(input, 'utf8')

const replacements = [
  [
    /文档版本：V2\.0[\s\S]*?§2\.6。/,
    `文档版本：V2.1

创建日期：2026年7月2日

需求确认状态：已确认

说明：V2.1 在 V2.0 基础上继续对齐原型与 OpenSpec changes（截至 2026-07-02）：详情抽屉改为「申请内容在上 + 审批日志表格在下」；休学/退学 Section III 支持多位家长/监护人（来自学生档案 family[]）；转专业 Section VII 自申请 Form 移除、仅在审批/已批准详情展示且样式对齐 movement-detail-body；异动申请 Tab 默认转专业；日历展示统一 dd.Mmm.YYYY；维护/查询列表增加 Preview PDF；撤销入口收窄；异动原因增加适用人员类别（老师/学生）多选；休学/复学 Section II 增加休学起止日期只读字段；学籍 Enrollment 专业优先级联等。V2.0 约定仍有效，V2.1 增量见 §2.7。`,
  ],
  [/V2\.0 增量约定见 §2\.6/g, 'V2.0/V2.1 增量约定见 §2.6、§2.7'],
  [/V2\.0 增量见\s*\n§2\.6/g, 'V2.1 增量见 §2.7'],
  [/（默认休学）/g, '（默认转专业）'],
  [/默认 Tab 为休学/g, '默认 Tab 为转专业'],
  [/默认休学/g, '默认转专业'],
  [
    /转专业 Section VII 申请侧 disabled/g,
    '转专业 Section VII 不在申请 FormModal 展示（仅审批详情可编辑、已批准详情只读，样式与上下 Section 一致）',
  ],
  [
    /Section VII 转专业申请侧 disabled 只读/g,
    'Section VII 不在学生/老师申请 FormModal 展示',
  ],
  [
    /Section VII 申请侧 disabled/g,
    'Section VII 不在申请 FormModal 展示',
  ],
  [
    /Section VII 教务专用[\s\S]*?申请侧 disabled/g,
    'Section VII 仅供教务办使用（审批时可编辑；已批准只读；申请 Form 不含本节）',
  ],
  [
    /流转日志独立弹窗/g,
    '详情右滑抽屉（申请内容 + 底部审批日志表）',
  ],
  [
    /上方为竖向审批时间线（ApprovalTimeline，替代原\s*\nApprovalLogModal\s*\n表格），下方为异动详情字段/g,
    '上方为异动申请详情字段（MovementDetailContent），下方为审批日志四列表格（MovementApprovalLogTable）',
  ],
  [
    /顶栏固定，中间可滚动，底栏场景按钮/g,
    '顶栏固定，中间可滚动（申请详情在上、审批日志表在下），底栏场景按钮',
  ],
  [
    /（V2\.0 已合并至「详情」）在详情抽屉顶部时间线查看审批流转历史。/g,
    '（V2.1）在详情抽屉底部审批日志表格查看流转历史；列表行内无独立「流转日志」按钮。',
  ],
  [
    /V2\.0\s*\n行内仅「详情」按钮；点击后抽屉内时间线区展示流转历史。/g,
    'V2.1 行内仅「详情」按钮；点击后抽屉内下方表格展示审批日志。',
  ],
  [
    /已合并至详情抽屉顶部竖向时间线，无独立日志按钮/g,
    '已合并至详情抽屉底部审批日志表，无独立日志按钮',
  ],
  [
    /ApprovalTimeline 竖向时间线替代 ApprovalLogModal\s*\n表格/g,
    'MovementApprovalLogTable 四列表格置于申请详情下方（管理端详情抽屉与 PDF 预览同源）',
  ],
  [
    /审批时间线\s*\n\s*\n详情抽屉内/g,
    '审批日志表\n\n详情抽屉内（申请内容下方）',
  ],
  [
    /Section III 家长同意/g,
    'Section III 家长/监护人确认与同意（可多位联系人）',
  ],
  [
    /家长区可 Download Consent Letter/g,
    'Section III 选学生后从 family[] 映射全部非空家长/监护人（重复 form-grid；≥2 人时以「家长/监护人 1/2…」标签与分割线区分）；附件区 Download Consent Letter',
  ],
  [
    /Demo 数据国籍含 Taiwan/g,
    'Demo 数据国籍不含 Taiwan（已移除该选项）',
  ],
  [
    /YYYY-MM-DD（formatMovementDate）/g,
    '展示 dd.Mmm.YYYY（如 29.Sep.2025）；存储 ISO YYYY-MM-DD（formatMovementDate）',
  ],
  [
    /学籍异动维护[\s\S]*?15 列/g,
    '学籍异动维护                      15 列；Preview PDF',
  ],
  [
    /学籍异动查询[\s\S]*?只读/g,
    '学籍异动查询              只读；Preview PDF',
  ],
]

for (const [from, to] of replacements) {
  text = text.replace(from, to)
}

const section27 = `

## 2.7 V2.1 交互统一约定（2026-07-02）

V2.1 在 V2.0 已落地能力基础上，继续对齐 OpenSpec changes 下列增量；未列出的模块仍按 §2.2 各菜单说明执行。

| **约定项** | **适用范围** | **规则说明** |
| --- | --- | --- |
| 详情抽屉布局 | 异动申请/审批/维护/查询、PDF 预览 | 单一「详情」按钮打开 ApplicationDetailDrawer；**上方** MovementDetailContent 申请全文，**下方** MovementApprovalLogTable 四列（环节/操作人/动作/时间/意见）；管理端 Footer 可「导出 PDF」 |
| 转专业 Section VII | ProgrammeTransferOfficeUseSection | **申请 FormModal 不含 Section VII**；审批详情可编辑（默认 1st choice / startSemester / 当天）；已批准只读；使用 movement-detail-body 的 section-bar + detail-grid / form-grid，与上下 Section 视觉一致 |
| 多位家长/监护人 | 休学/退学 Section III | 选学生后从 student.family[] 映射 parentContacts[] 快照；表单/详情按联系人数重复原单联系人字段块；≥2 人时显示「家长/监护人 n」标签 + 顶部分割线；可编辑但不回写档案；休学每条非空联系人姓名+电话必填，退学五项全必填 |
| 休学起止日期 | 休学/复学 Section II | 「休学期间」下方只读休学开始/结束日期（dd/MM/YYYY），联动 semesterInfo；复学随休学期间联动 |
| 默认申请 Tab | 学籍异动申请（老师/学生） | Tab 壳层默认 **转专业**（非休学） |
| Preview PDF | 异动维护/查询列表 | 操作列增加 Preview PDF，iframe 预览与详情 Export PDF 同源 |
| 撤销入口 | 管理端列表 | 撤销仅保留「学籍异动申请（管理端）」In Progress + 「学籍异动维护」；查询/审批列表无 Cancel；学生端审批开始前仍可 Cancel（带说明 tooltip） |
| 异动原因适用人员 | 异动类别「设置原因」 | 每条原因增加适用人员类别 **老师/学生多选**（默认双选）；休学/退学申请原因按 applicantMode 过滤 |
| 学籍 Enrollment 级联 | 学生基本信息 Enrollment Tab | 字段顺序：专业 → 专业代码 → 专业层次 → 学院；专业为唯一可选手动下拉；入学批次/注册时间/学期字段带 tooltip |
| 签证有效期展示 | 四异动 Section I、学生档案 | China/International 展示 Student Pass Expiry **截止日期**（dd/mm/yyyy）；Local 显示 — |
| Demo 国籍 | 学生档案国籍下拉 | 移除 Taiwan 选项 |

**关联 OpenSpec 变更包（V2.1 增量）**：refine-movement-admin-detail-export、add-movement-parent-contacts-from-family、add-programme-transfer-office-use-approval、refine-movement-application-default-tab-and-visa-expiry、add-movement-list-pdf-preview、refine-movement-cancel-entry-points、refine-movement-reason-personnel-multiselect、add-deferment-resumption-period-date-fields、refine-student-profile-enrollment-programme-first-cascade、remove-taiwan-from-demo-nationality、unify-movement-date-format（展示层）等。
`

if (!text.includes('## 2.7 V2.1')) {
  text += section27
}

// Patch §2.3 table row about 流转日志
text = text.replace(
  /（V2\.0\s*\n\s*已合并至详情抽屉顶部竖向时间线，无独立日志按钮）/g,
  '（V2.1 已合并至详情抽屉底部审批日志表，无独立日志按钮）',
)

// Patch §2.6 association list at end
text = text.replace(
  /关联 OpenSpec 变更包\s*\n\s*\nunify-application-detail-drawer[\s\S]*?及 V1\.9 已归档 changes/,
  `关联 OpenSpec 变更包

unify-application-detail-drawer、add-attachment-online-preview、refine-approval-modal-action-labels、refine-student-profile-nationality-first、refine-consent-form-version-snapshot 及 V1.9 已归档 changes；V2.1 增量见 §2.7`,
)

// Add maintenance/query Preview PDF in §2.4 if missing
if (!text.includes('Preview PDF')) {
  text = text.replace(
    /查询只读\s*\n\s*\n\s*行操作/g,
    '查询只读\n\n       Preview PDF          维护/查询列表操作列 iframe 预览\n\n       行操作',
  )
}

fs.writeFileSync(output, text, 'utf8')
console.log('Wrote', output, 'bytes', fs.statSync(output).size)
