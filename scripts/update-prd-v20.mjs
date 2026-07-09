/**
 * 基于 OpenSpec changes 将学籍管理 PRD V1.9 更新为 V2.0
 * 保留 docx 模板样式，仅替换/增补正文内容
 */
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const SOURCE = String.raw`c:\Users\admin\Desktop\马来教务\模板\厦大马来分校本科教务系统产品需求文档-学籍管理模块-V1.9.docx`;
const TARGET = String.raw`c:\Users\admin\Desktop\马来教务\模板\厦大马来分校本科教务系统产品需求文档-学籍管理模块-V2.0.docx`;

/** @type {Array<[string|string[], string|string[]]>} */
const REPLACEMENTS = [
  // ── 版本元数据 ──
  ['文档版本：V1.9', '文档版本：V2.0'],
  ['创建日期：2026年6月15日', '创建日期：2026年6月30日'],
  [
    '说明：V1.9 在 V1.8 基础上全面对齐 OpenSpec changes：侧边栏两组导航（移除学生个人学习计划）；新增知情同意书；学籍异动申请拆为老师/学生双入口 Tab 壳层；审批搜索改专业代码、View→Modal 审批、历史 Tab 显示是否实施；异动类别去 Student Type、原因同步申请下拉；维护/查询搜索改专业代码（查询增异动类型）；维护移除 Edit/改编号；生效学期 YYYY/MM；转专业 Section VII 申请侧 disabled。',
    '说明：V2.0 在 V1.9 基础上对齐原型最新交互与 OpenSpec changes：统一申请详情右滑抽屉（详情+竖向审批时间线合并，移除独立流转日志入口）；附件文件名旁增加在线预览（👁）；审核弹框操作选项改为通过/不通过/驳回；学生档案国籍优先录入并自动带出学生类别；详情抽屉新增状态日志 Tab；知情同意书改为配置行+版本快照模型；等。V1.9 约定仍有效，V2.0 增量见 §2.6。',
  ],
  [
    'V1.9 增量约定见 §2.5',
    'V2.0 增量约定见 §2.6（§2.5 仍有效）',
  ],

  // ── 应用目录 ──
  ['七页签档案增删改查、导入导出', '七页签新建/编辑；详情八页签（含状态日志）；导入导出'],
  ['三 Tab；专业代码搜索；Modal 审批', '三 Tab；专业代码搜索；详情抽屉+Modal 审批'],
  ['按异动类别+Student Type 模板', '配置行+版本快照；按异动类别×Student Type×学历层次'],
  ['15 列；无 Edit/改编号', '15 列；无 Edit/改编号；详情抽屉含时间线'],
  ['只读；异动类型筛选', '只读；异动类型筛选；详情抽屉含时间线'],

  // ── 模块介绍 ──
  [
    '通过七个信息页签组织录入与展示',
    '新建/编辑通过七个信息页签录入；详情抽屉在 Others 之后增加第八 Tab「状态日志」只读展示',
  ],
  [
    '在右侧抽屉（StudentProfileFormDrawer）中按七个页签依次维护档案信息，前端按学生类别（本地生/中国学生/国际生）分支校验必填项与字段显隐',
    '在右侧抽屉（StudentProfileFormDrawer）中：顶部分为「国籍信息」（可搜索国籍下拉+只读学生类别，Malaysia→Local、China→China、其他→International）与「信息填写」（七个页签）。未选国籍前七 Tab 为空态；选国籍后按学生类别分支校验与显隐。Basic Info Tab 内不再重复国籍字段',
  ],
  [
    'StudentProfileDetailDrawer',
    'StudentProfileDetailDrawer（详情含八 Tab，第 8 Tab 为 Status Log 状态日志：Status、Date Effective、Changed By、Remarks 四列只读表格）',
  ],

  // ── 学生档案表单 Tab1（仅匹配 Tab1 区块标题，避免误改列表「学生类别」列）──
  [
    '新增/编辑学生档案页面——Tab1（顶栏配置、英文名：Student Category）',
    '新增/编辑学生档案页面——国籍信息区（顶栏、英文名：Nationality Info；非 Tab）',
  ],

  // ── 知情同意书 ──
  [
    '知情同意书配置：按适用异动类别与 Student Type（Local/Chinese/International，中文「中国」）维护模板；(类别+类型) 唯一。含学生/家长附件 mock；四 Tab 申请 Form/Detail 与休学/退学家长区 resolveConsentTemplate 解析',
    '知情同意书配置：按「异动类别 × Student Type × 学历层次」维护配置行（组合唯一）。Create 弹窗仅五字段（名称、异动类别、Student Type、学历层次、批注），不含生效学年学期与附件；Save 仅创建配置行。Edit 仅改名称与批注。列表操作：编辑 | 版本快照（已移除 View）。版本快照表：生效学年学期、变更人、附件（文件名+👁预览）、更新时间、应用（YnSwitch 互斥）；「新增版本」在表格上方左侧，须上传学生同意书、可选家长同意书、可选「是否立即应用」。四 Tab 申请仍通过 resolveConsentTemplate 解析全局已应用版本',
  ],
  [
    '操作流程：进入【学籍异动】→【知情同意书】→ 按异动类别/名称/Student Type 查询 → 新增或编辑模板与附件 → 行内查看/编辑 → 批量删除。',
    '操作流程：进入【学籍异动】→【知情同意书】→ 按异动类别/名称/Student Type 查询 → 新增配置行（五字段）→ 行内「版本快照」维护各学期附件与是否应用 → 行内编辑名称/批注 → 批量删除。',
  ],
  [
    '新增/编辑知情同意书页面——Tab1（基本信息、英文名：Consent Form Basic Info）',
    '新增知情同意书弹窗（Create：五字段 2×2 布局+批注，无附件/无生效学期）',
  ],
  [
    '编辑知情同意书页面——Tab1（基本信息、英文名：Consent Form Basic Info）',
    '编辑知情同意书弹窗（Edit：仅名称与批注）',
  ],

  // ── 审核弹框操作文案 ──
  [
    '审批结果单选（通过/拒绝/需修改材料）',
    '操作单选（通过/不通过/驳回；存库值仍为 Approved/Rejected/Update Required）',
  ],
  [
    '通过/拒绝/需修改材料',
    '通过/不通过/驳回',
  ],

  // ── §2.3 申请与审批 ──
  [
    'ReviewView 嵌入 DetailModal + [审批] 打开 Modal',
    'MovementApplicationDetailDrawer 右滑抽屉：顶栏时间线（ApprovalTimeline）+ 详情区 + 底栏 [关闭]/[审批]/[撤回]',
  ],
  [
    '列表独立日志弹窗',
    '（V2.0 已合并至详情抽屉顶部竖向时间线，无独立日志按钮）',
  ],
  [
    '只读 DetailModal（无审批）',
    '只读详情抽屉（MovementApplicationDetailDrawer，无审批按钮）',
  ],

  // ── §2.4 维护与查询 ──
  ['Details | Log', '详情（抽屉）'],
  ['Details | Log', '详情（抽屉）'],

  // ── 详情抽屉通用描述（替换旧 ReviewView / ApprovalLogModal）──
  [
    '下钻页面说明：下钻至「审批详情全页视图」（MovementApprovalReviewView）：嵌入 DetailModal 只读；待我审批底部 [审批] 打开 MovementApprovalModal；History 可 Recall。mode=readonly。',
    '下钻页面说明：下钻至「申请详情右滑抽屉」（MovementApplicationDetailDrawer）：固定顶栏标题+关闭；可滚动区上方为竖向审批时间线（ApprovalTimeline，替代原 ApprovalLogModal 表格），下方为异动详情字段（MovementDetailContent）；固定底栏 [关闭]；待我审批场景另有 [审批] 打开 MovementApprovalModal、[撤回]（History 且允许时）。列表页保持可见，不再整页替换 ReviewView。',
  ],
  [
    '下钻页面说明：下钻至「审批详情全页视图」（MovementApprovalReviewView）：嵌入 DetailModal 只读；待我审批底部 [审批] 打开 MovementApprovalModal；History 可 Recall。「确认审批」通过底部 [审批] 打开 Modal，见第7项',
    '下钻页面说明：下钻至「申请详情右滑抽屉」（MovementApplicationDetailDrawer）：时间线+详情+底栏操作；[审批] 打开 MovementApprovalModal（操作选项：通过/不通过/驳回）。',
  ],
  [
    '下钻页面说明：下钻至「流转日志弹窗」（ApprovalLogModal）：居中弹窗含标题栏；正文为审批流转历史表格，列含审批环节、操作人、操作动作、日期时间与办理意见；无数据时展示空状态提示，底部仅关闭按钮。',
    '下钻页面说明：（V2.0 已合并）审批流转历史改在详情抽屉顶部以竖向时间线（ApprovalTimeline）展示，含阶段名、处理人、状态徽章、时间与意见；不再单独打开 ApprovalLogModal。',
  ],

  // ── 详情/流转日志 业务描述 ──
  [
    '·  描述：查看该条审批记录的完整流转历史表格。',
    '·  描述：（V2.0 已合并至「详情」）在详情抽屉顶部时间线查看完整流转历史。',
  ],
  [
    '·  描述：查看该条记录的完整审批流转历史。',
    '·  描述：（V2.0 已合并至「详情」）在详情抽屉顶部时间线查看审批流转历史。',
  ],
  [
    '·  描述：查看审批流转历史表格。',
    '·  描述：（V2.0 已合并至「详情」）在详情抽屉顶部时间线查看审批流转历史。',
  ],
  [
    '·  业务的事件交互：行内点击流转日志打开 ApprovalLogModal。',
    '·  业务的事件交互：V2.0 行内仅「详情」按钮；点击后抽屉内时间线区展示流转历史。',
  ],
  [
    '·  业务的事件交互：行内点击流转日志打开日志弹窗（ApprovalLogModal），表格展示环节、操作人、时间与结果与意见。',
    '·  业务的事件交互：V2.0 点击「详情」打开 ApplicationDetailDrawer/MovementApplicationDetailDrawer，时间线区展示环节、操作人、状态徽章、时间与意见。',
  ],
  [
    '·  业务的事件交互：行内 Details → readonly ReviewView。',
    '·  业务的事件交互：行内点击「详情」→ 右滑打开 MovementApplicationDetailDrawer（只读详情+时间线）。',
  ],
  [
    '·  业务的事件交互：行内点击详情进入 ReviewView readonly 模式。',
    '·  业务的事件交互：行内点击「详情」→ 右滑打开 MovementApplicationDetailDrawer（只读详情+时间线）。',
  ],
  [
    '·  描述：ReviewView 只读详情；待我审批时 [审批] 打开 MovementApprovalModal。',
    '·  描述：详情抽屉只读展示申请全文与时间线；待我审批时底栏 [审批] 打开 MovementApprovalModal。',
  ],
  [
    '·  描述：ReviewView 只读详情，敏感字段脱敏，无审批区。',
    '·  描述：详情抽屉只读展示，敏感字段脱敏（maskSensitiveFields），无审批按钮。',
  ],
  [
    '·  业务的事件交互：View → ReviewView → [审批] → Modal → 返回列表。',
    '·  业务的事件交互：列表 [Approve]/行内「详情」→ 抽屉 → 底栏 [审批] → MovementApprovalModal → 关闭抽屉刷新列表。',
  ],

  // ── 附件预览 ──
  [
    'Documents 区附件只读展示文件名',
    'Documents 区附件只读展示文件名；文件名旁 👁（AttachmentPreviewTrigger）打开 AttachmentPreviewModal 在线预览（PDF/图片 mock 或 blob）；点击文件名仍为下载',
  ],
  [
    'Upload mock 必填附件',
    'Upload mock 必填附件；上传后文件名旁显示 👁 预览',
  ],

  [
    '·  描述：只读查看模板详情。',
    '·  描述：（V2.0 已移除）原 View 查看；现通过「版本快照」查看各学期附件与是否应用。',
  ],
  [
    '·  业务的事件交互：行内 View 打开 ConsentFormViewModal。',
    '·  业务的事件交互：V2.0 列表无 View；行内「版本快照」打开 ConsentFormVersionHistoryModal。',
  ],
  [
    '下钻页面说明：下钻至「知情同意书查看弹窗」（ConsentFormViewModal）：只读展示模板字段与附件文件名。',
    '下钻页面说明：下钻至「版本快照弹窗」（ConsentFormVersionHistoryModal）：表格展示各生效学年学期版本、附件（含👁预览）、应用开关；「新增版本」打开 ConsentFormVersionFormModal。',
  ],
  [
    '·  描述：创建知情同意书模板；(movementType+studentType) 须唯一。',
    '·  描述：创建知情同意书配置行（五字段，不含附件与生效学期）；组合维度唯一。',
  ],
  [
    '·  业务的事件交互：Create 打开 ConsentFormFormModal，上传附件后 Save。',
    '·  业务的事件交互：Create 打开 ConsentFormFormModal 填写五字段后 Save；附件在后续「版本快照→新增版本」上传。',
  ],

  // ── 清除遗留整页审阅描述 ──
  [
    'MovementApprovalReviewView',
    'MovementApplicationDetailDrawer（V2.0 已废弃整页 ReviewView）',
  ],

  // ── 维护页 V1.9 备注更新 ──
  [
    'V1.9 移除行内 Edit 与「修改异动编号」；工具栏保留实施、导出、删除；行操作仅详情与流转日志',
    'V2.0 行操作仅「详情」（含时间线）；无独立流转日志按钮；工具栏保留实施、导出、删除',
  ],
];

/** 将流转日志功能按钮标题标记为已合并（保留章节结构） */
const FLOW_LOG_MERGED_NOTE =
  '（V2.0 说明：本按钮已合并至「详情」抽屉内顶部审批时间线，原型不再提供独立「流转日志/Approval Log」行内按钮；以下描述供 V1.9→V2.0 变更追溯。）';

function applyReplacements(xml) {
  let result = xml;
  let total = 0;
  for (const [from, to] of REPLACEMENTS) {
    if (Array.isArray(from)) {
      for (let i = 0; i < from.length; i++) {
        const f = from[i];
        const t = Array.isArray(to) ? to[i] : to;
        if (result.includes(f)) {
          result = result.split(f).join(t);
          total++;
        }
      }
    } else if (result.includes(from)) {
      result = result.split(from).join(to);
      total++;
    }
  }
  return { xml: result, count: total };
}

/** 在 §2.5 章节之后插入 §2.6 */
function insertSection26(xml) {
  const marker = '异动展示与格式约定';
  const idx = xml.indexOf(marker);
  if (idx === -1) {
    console.warn('未找到 §2.5 标题，§2.6 将插入文档末尾');
  }

  const insertAt = xml.lastIndexOf('</w:body>');
  if (insertAt === -1) return xml;

  const section26 = buildSection26Xml();
  return xml.slice(0, insertAt) + section26 + xml.slice(insertAt);
}

function esc(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** 复用 V1.9 文档中的段落/run 样式片段 */
function p(text, style = '') {
  const pPr = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : '';
  return `<w:p w:rsidR="00E664A3" w:rsidRDefault="00000000">${pPr}<w:r><w:rPr><w:rFonts w:ascii="宋体" w:hAnsi="宋体" w:cs="宋体" w:hint="eastAsia"/></w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}

function buildSection26Xml() {
  const lines = [
    p('2.6 V2.0 交互统一约定（2026-06-30）', '2'),
    p('V2.0 在 V1.9 已落地能力基础上，对齐 OpenSpec changes 下列增量；未列出的模块仍按 §2.2 各菜单说明执行。'),
    p('约定项'),
    p('适用范围'),
    p('规则说明'),
    p('统一详情入口'),
    p('异动申请/审批/维护/查询、课程申请/审批等列表'),
    p('原「详情+流转日志/Approval Log」双按钮合并为单一「详情」；点击后 ApplicationDetailDrawer（或 MovementApplicationDetailDrawer）右滑进入；顶栏固定，中间可滚动，底栏场景按钮（Close/Review/Recall 等）'),
    p('审批时间线'),
    p('详情抽屉内'),
    p('ApprovalTimeline 竖向时间线替代 ApprovalLogModal 表格；节点含阶段、处理人、状态徽章（Submitted/Pending/Approved 等）、时间、意见；异动结合 workflowStages 补全未到达节点'),
    p('审核弹框操作文案'),
    p('MovementApprovalModal、CourseApprovalModal'),
    p('「操作」单选：通过 / 不通过 / 驳回（存库 Approved/Rejected/Update Required 不变）；列表状态徽章仍为「已通过/已驳回/需修改」结果态'),
    p('附件在线预览'),
    p('知情同意书、异动申请/详情附件'),
    p('文件名旁 👁（AttachmentPreviewTrigger）打开 AttachmentPreviewModal；文件名点击仍为下载/mock；PDF/图片可预览，DOCX 显示说明占位'),
    p('学生档案国籍优先'),
    p('StudentProfileFormDrawer / DetailDrawer'),
    p('顶栏「国籍信息」：可搜索国籍下拉 + 只读学生类别；移除 Student Category 手选 radio；详情比表单多第 8 Tab「状态日志」（StatusLogTab 四列只读）'),
    p('知情同意书版本快照'),
    p('ConsentFormView 列表'),
    p('Create 五字段无附件；Edit 仅名称/批注；操作「编辑|版本快照」；版本快照内按生效学年学期维护附件与 YnSwitch 互斥「应用」'),
    p('关联 OpenSpec 变更包'),
    p('unify-application-detail-drawer、add-attachment-online-preview、refine-approval-modal-action-labels、refine-student-profile-nationality-first、refine-consent-form-version-snapshot 及 V1.9 已归档 changes'),
  ];
  return lines.join('');
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error('源文件不存在:', SOURCE);
    process.exit(1);
  }

  const buf = fs.readFileSync(SOURCE);
  const zip = await JSZip.loadAsync(buf);
  let xml = await zip.file('word/document.xml').async('string');

  const before = xml.length;
  const { xml: updated, count } = applyReplacements(xml);
  xml = updated;
  console.log(`已应用 ${count} 处文本替换`);

  // 标记流转日志按钮章节（在标题后追加说明）
  xml = xml.replace(
    /(<w:t[^>]*>)(6、功能按钮\/开关——流转日志[^<]*)(<\/w:t>)/g,
    `$1$2${esc(FLOW_LOG_MERGED_NOTE)}$3`,
  );
  xml = xml.replace(
    /(<w:t[^>]*>)(7、功能按钮\/开关——流转日志[^<]*)(<\/w:t>)/g,
    `$1$2${esc(FLOW_LOG_MERGED_NOTE)}$3`,
  );
  xml = xml.replace(
    /(<w:t[^>]*>)(8、功能按钮\/开关——流转日志[^<]*)(<\/w:t>)/g,
    `$1$2${esc(FLOW_LOG_MERGED_NOTE)}$3`,
  );
  xml = xml.replace(
    /(<w:t[^>]*>)(9、功能按钮\/开关——流转日志[^<]*)(<\/w:t>)/g,
    `$1$2${esc(FLOW_LOG_MERGED_NOTE)}$3`,
  );

  xml = insertSection26(xml);

  zip.file('word/document.xml', xml);
  const out = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  fs.writeFileSync(TARGET, out);
  console.log(`已生成: ${TARGET}`);
  console.log(`document.xml 字节: ${before} → ${xml.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
