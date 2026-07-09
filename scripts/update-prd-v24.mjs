/**
 * 学籍管理 PRD V2.3 → V2.4
 * - 去除版本对比表述与技术组件名
 * - 缩写改为完整通俗描述
 * - 新增 2.2.1.7 异动规则设置菜单小节（含标准字段表）
 */
import fs from 'fs'
import JSZip from 'jszip'
import { loadTemplateAssets, buildFieldTable, functionButtonXml } from './prd/prd-xml.mjs'

const SOURCE = String.raw`c:\Users\admin\Desktop\马来教务\模板\厦大马来分校本科教务系统产品需求文档-学籍管理模块-V2.3.docx`
const TARGET = String.raw`c:\Users\admin\Desktop\马来教务\模板\厦大马来分校本科教务系统产品需求文档-学籍管理模块-V2.4.docx`

function esc(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** 按长度降序，避免短词误替换 */
const TERM_REPLACEMENTS = [
  ['StudentMovementApplicationView 页顶水平 Tab（转专业·休学·复学·退学，默认转专业），嵌入四 View', '学籍异动申请页面顶部设有转专业、休学、复学、退学四个标签页，默认打开转专业；每个标签页内展示对应类型的申请列表与操作区'],
  ['页顶水平 Tab 切换转专业/休学/复学/退学（默认转专业），各 Tab 嵌入对应 View 维护列表与表单弹窗', '页面顶部设有转专业、休学、复学、退学四个标签页，默认打开转专业；每个标签页内展示对应类型的申请列表，以及新建、编辑、查看详情等表单弹窗'],
  ['各 Tab 嵌入对应 View 维护列表与表单弹窗', '每个标签页内展示对应类型的申请列表，以及新建、编辑、查看详情等表单弹窗'],
  ['进入同一 标签页外层页面（学籍异动申请页面），页顶水平 Tab 切换转专业/休学/复学/退学（默认转专业），各 Tab 嵌入对应 View 维护列表与', '进入学籍异动申请页面；页面顶部设有转专业、休学、复学、退学四个标签页，默认打开转专业；每个标签页内展示对应类型的申请列表与'],
  ['搜索区双行布局（MovementApplicationSearchBar）：老师入口首行含学号或姓名、专业代码、申请学年学期、状态（含 草稿）；学生入口隐藏学号或姓名；次行是否实施可收起。', '搜索区采用两行排列：老师入口第一行包含学号或姓名、专业代码、申请学年学期、状态（含草稿）；学生入口不显示学号或姓名；第二行提供是否实施筛选，可收起。'],
  ['搜索区双行布局（MovementApplicationSearchBar）：老师入口首行含学号或姓名、专业代码、申请学年学期、状态（含 Draft）；学生入口隐藏学号或姓名；次行是否实施可收起。', '搜索区采用两行排列：老师入口第一行包含学号或姓名、专业代码、申请学年学期、状态（含草稿）；学生入口不显示学号或姓名；第二行提供是否实施筛选，可收起。'],
  ['· 备注信息（校验规则补充、其他说明等）：MovementApplicationSearchBar；同一行排列的 布局。', '· 备注信息（校验规则补充、其他说明等）：搜索条件按两行排列展示。'],
  ['附件与 MovementAttachmentReadonly 对齐', '附件展示样式与其他申请类型保持一致'],
  ['全部字段与附件只读展示（MovementAttachmentReadonly）', '全部字段与附件以只读方式展示'],
  ['点击导入打开导入弹窗（StudentProfileImportModal）', '点击导入打开档案导入弹窗'],
  ['下钻至「档案导入弹窗」（StudentProfileImportModal）', '下钻至「档案导入弹窗」'],
  ['点击新增打开 MovementCategoryFormModal，保存写入列表。', '点击新增打开异动类别表单弹窗，保存后写入列表。'],
  ['下钻至「异动类别表单弹窗」（MovementCategoryFormModal）', '下钻至「异动类别表单弹窗」'],
  ['下钻至「转专业申请只读详情弹窗」（DetailModal）', '下钻至「转专业申请只读详情弹窗」'],
  ['下钻至「休学申请只读详情弹窗」（DetailModal）', '下钻至「休学申请只读详情弹窗」'],
  ['下钻至「复学申请只读详情弹窗」（DetailModal）', '下钻至「复学申请只读详情弹窗」'],
  ['下钻至「退学申请只读详情弹窗」（DetailModal）', '下钻至「退学申请只读详情弹窗」'],
  ['四种类型数据分别存入 movementStore 四个集合，与审批模块共享存储。', '四种异动类型的申请数据分别保存，并与审批模块共用同一份演示数据。'],
  ['知情同意书模板按 movementType+studentType 解析下载（按类别与学生类型匹配知情同意书模板）。', '知情同意书模板按异动类别与学生类别组合匹配后提供下载。'],
  ['(movementType, studentType) 组合不可重复', '异动类别与学生类别组合不可重复'],
  ['(movementType+studentType) 须唯一。', '异动类别与学生类别组合须唯一。'],
  ['(movementType, 学生类别) 提供 Download Consent L', '按异动类别与学生类别提供知情同意书下载'],
  ['含学生/家长附件 演示数据。四个标签页（转专业、休学、复学、退学） 申请 Form/Detail 及休学/退学家长区通过 按类别与学生类型匹配知情同意书模板(movementType, 学生类别) 提供 Download Consent L', '含学生与家长附件演示数据。转专业、休学、复学、退学四个标签页内的申请表单与详情，以及休学、退学家长信息区，均可按异动类别与学生类别匹配并下载对应知情同意书模板'],
  ['四 Tab 申请 Form/Detail 与休学/退学家长区 resolveConsentTemplate 下载。', '转专业、休学、复学、退学四个标签页内的申请表单与详情，以及休学、退学家长信息区，均可按异动类别与学生类别匹配并下载知情同意书。'],
  ['四 Tab 申请 Form/Detail', '四个标签页内的申请表单与详情'],
  ['四 Tab', '四个标签页（转专业、休学、复学、退学）'],
  ['StudentMovementApplicationView', '学籍异动申请页面'],
  ['StudentProfileFormDrawer', '学生档案新建与编辑抽屉'],
  ['StudentProfileDetailDrawer', '学生档案详情抽屉'],
  ['StudentProfileImportModal', '档案导入弹窗'],
  ['MovementApplicationDetailDrawer', '异动申请详情抽屉'],
  ['ApplicationDetailDrawer', '申请详情抽屉'],
  ['MovementDetailExportBody', '详情与导出共用的内容区域'],
  ['MovementDetailPdfPreviewModal', 'PDF预览弹窗'],
  ['MovementDetailContent', '申请详情内容区'],
  ['MovementApprovalLogTable', '审批记录表格'],
  ['MovementAdminCancelAction', '管理端撤销按钮'],
  ['MovementArchiveNumberModal', '修改文号弹窗'],
  ['MovementCategoryReasonModal', '设置原因弹窗'],
  ['MovementCategoryFormModal', '异动类别表单弹窗'],
  ['MovementApprovalModal', '审批意见弹窗'],
  ['MovementApplicationSearchBar', '申请列表搜索区'],
  ['MovementAttachmentReadonly', '附件只读展示区'],
  ['StudentSelectModal', '选择学生弹窗'],
  ['ApprovalTimeline', '审批流程竖向时间线'],
  ['buildMovementTimelineNodes', '审批流程节点数据'],
  ['AttachmentPreviewTrigger', '附件预览图标'],
  ['AttachmentPreviewModal', '附件在线预览弹窗'],
  ['ConfirmDialog', '确认对话框'],
  ['ExportModal', '导出字段选择弹窗'],
  ['ConsentFormVersionHistoryModal', '版本快照弹窗'],
  ['ConsentFormFormModal', '新建知情同意书弹窗'],
  ['YnSwitch', '是/否开关'],
  ['exportMovementQueryExcel', '查询列表导出逻辑'],
  ['formatMovementDate', '日历日期格式化'],
  ['formatEffectiveSession', '生效学期格式化'],
  ['maskPassportIc', '护照或身份证号脱敏'],
  ['resolveConsentTemplate', '按异动类别与学生类别匹配知情同意书模板'],
  ['resolveMovementCategoryConfig', '按类别编码读取异动类别配置'],
  ['resolveReasonLabel', '按原因编号显示原因名称'],
  ['movementType+studentType', '异动类别与学生类别组合'],
  ['movementType', '异动类别'],
  ['studentType', '学生类别'],
  ['movementDate', '异动日期'],
  ['movementStore', '本地演示数据存储'],
  ['movement-query-', '异动查询导出文件-'],
  ['list-page-search.css', '列表页搜索区标准样式'],
  ['movement-detail-body', '异动详情统一版式'],
  ['Student Pass Expiry Date', '学生准证有效期'],
  ['Student Pass Expiry', '学生准证有效期'],
  ['Student Type', '学生类别'],
  ['applicantMode', '申请端身份'],
  ['exportArchiveNumber', '导出文号'],
  ['trackCategory', '学籍类型'],
  ['parentContacts', '家长或监护人联系人列表'],
  ['student.family[]', '学生档案中的家庭成员信息'],
  ['localStorage', '浏览器本地存储'],
  ['npm run build', '项目构建验证'],
  ['iframe', '内嵌页面框架'],
  ['tooltip', '悬停提示'],
  ['mock', '演示数据'],
  ['Footer', '底部操作栏'],
  ['Tab 壳层', '四个标签页组成的申请页面结构'],
  ['四 View', '四个申请列表页面'],
  ['四异动', '四种异动类型（转专业、休学、复学、退学）'],
  ['四 Tab', '四个标签页（转专业、休学、复学、退学）'],
  ['四类', '四种类型'],
  ['三 Tab', '三个标签页（待我审批、已提交、历史）'],
  ['双行搜索', '两行排列的搜索条件'],
  ['inline', '同一行排列的'],
  ['keyword', '关键字'],
  ['WYSIWYG', '所见即所得'],
  ['Early Cancel', '审批开始前由学生自行取消'],
  ['Preview PDF', '预览PDF'],
  ['Export PDF', '导出PDF'],
  ['MovementApprovalReviewView', '整页审批详情页'],
  ['ReviewView', '整页审批详情页'],
  ['DetailModal', '申请详情弹窗'],
  ['ApprovalLogModal', '审批日志弹窗'],
  ['ProgrammeTransferOfficeUseSection', '转专业教务专用信息区'],
  ['MovementApplicantNotes', '申请人须知提示区'],
  ['MovementInternationalStudentRemarks', '国际生补充说明区'],
  ['MovementDocumentsUploadSection', '支持性文件上传区'],
  ['StatusLogTab', '状态日志标签页'],
  ['Enrollment Tab', '学籍信息标签页'],
  ['Basic Info Tab', '基本信息标签页'],
  ['IO 维护', '出入境办公室维护'],
  ['fullName 映射', '与姓名字段对应'],
  ['reasonId', '原因编号'],
  ['categoryCode', '类别编码'],
  ['studentCategory', '学生类别'],
  ['workflowStages', '审批环节配置'],
  ['approvalLog', '审批记录'],
  ['In Progress', '审批进行中'],
  ['Update Required', '需修改材料'],
  ['Pending Review', '待审核'],
  ['Draft', '草稿'],
  ['Cancelled', '已撤销'],
  ['Approved', '已通过'],
  ['Rejected', '已驳回'],
  ['Section VII', '第七分区（教务核定信息）'],
  ['Section I', '第一分区（基本信息）'],
  ['Form/Detail', '申请表单与详情'],
  ['Malaysia→Local、China→China、其他→International', '选择马来西亚对应本地生、中国对应中国学生、其他国家对应国际生'],
  ['Local / China / International', '本地生、中国学生、国际生'],
  ['Local/China/International', '本地生、中国学生、国际生'],
  ['Local/Chinese/International', '本地生、中国学生、国际生'],
  ['dd/mm/yyyy', '日/月/年'],
  ['dd/MM/YYYY', '日/月/年'],
  ['YYYY-MM-DD HH:mm:ss', '年-月-日 时:分:秒'],
  ['YYYY/MM', '年/月'],
  ['Details | Log', '详情 | 审批日志'],
  ['Details', '详情'],
  ['| Log', '| 审批日志'],
  ['Actions 列', '操作列'],
  ['Actions', '操作'],
  ['Badge', '状态标签'],
  ['sticky 固定', '右侧固定'],
  ['sticky', '固定'],
  ['sortable', '可排序'],
  ['pill 圆角色块', '胶囊形圆角色块'],
  ['pill', '胶囊形'],
  ['disabled', '不可编辑'],
  ['hint 说明', '说明文字'],
  ['hint', '说明文字'],
  ['AND 组合', '同时满足'],
  ['AND', '且'],
  ['OR', '或'],
  ['xlsx', 'Excel表格'],
  ['Y/N', '是/否'],
  ['Expired', '已过期'],
  ['Pending→—', '待实施显示为横线'],
  ['Non-goals', '本期不包含'],
  ['OpenSpec', '原型变更规格'],
  ['openspec', '原型变更规格'],
  ['ConsentFormVersionFormModal', '新增版本弹窗'],
  ['Create/Edit Modal', '新建与编辑弹窗'],
  ['Create/Edit', '新建与编辑'],
  ['Form Modal', '申请表单弹窗'],
  ['Download Consent Letter', '下载知情同意书'],
  ['DEFAULT_APPROVER_ROLE', '默认审批角色'],
  ['autoImplement', '自动实施'],
  ['consentForms', '知情同意书配置数据'],
  ['Preview/导出PDF', '预览PDF与导出PDF'],
  ['Preview PDF', '预览PDF'],
  ['Preview 以学生身份跳转', '以学生身份预览跳转'],
  ['Education Tab', '教育信息标签页'],
  ['Status Log', '状态日志'],
  ['Date Effective', '生效日期'],
  ['Changed By', '变更人'],
  ['Others', '其他信息'],
  ['(No create/edit form)', '无新建与编辑表单'],
  ['嵌入学籍异动申请', '位于学籍异动申请页面内'],
  ['内联审批表单', '页面内嵌审批表单'],
  ['三视图（待我审批→已提交→已处理历史）', '三个列表（待我审批、已提交、已处理历史）'],
  ['三视图', '三个列表视图'],
  ['页内 Tab', '页面内标签页'],
  ['各 Tab 业务字段', '各标签页业务字段'],
  ['各 Tab', '各标签页'],
  ['申请 Tab 同步刷新', '申请列表同步刷新'],
  ['切换页内 Tab【转专业】', '切换至【转专业】标签页'],
  ['【休学】Tab', '【休学】标签页'],
  ['【复学】Tab', '【复学】标签页'],
  ['【退学】Tab', '【退学】标签页'],
  ['→ 休学 Tab', '→ 休学标签页'],
  ['→ 复学 Tab', '→ 复学标签页'],
  ['→ 退学 Tab', '→ 退学标签页'],
  ['转专业 Tab ', '转专业标签页 '],
  ['休学 Tab ', '休学标签页 '],
  ['复学 Tab ', '复学标签页 '],
  ['退学 Tab ', '退学标签页 '],
  ['转专业 Tab', '转专业标签页'],
  ['休学 Tab', '休学标签页'],
  ['复学 Tab', '复学标签页'],
  ['退学 Tab', '退学标签页'],
  ['七 Tab', '七个标签页'],
  ['八 Tab', '八个标签页'],
  ['第八 Tab', '第八个标签页'],
  ['第 8 Tab', '第八个标签页'],
  ['含八 Tab', '含八个标签页'],
  ['未选国籍前七 Tab', '未选国籍前七个标签页为空'],
  ['DEF001', '休学异动类别'],
  ['family[]', '家庭成员列表'],
  ['行内 Edit 打开预填 Modal', '点击行内编辑打开已预填内容的弹窗'],
  ['行内 Edit', '行内编辑'],
  ['Modal 内校验并保存模板', '弹窗内校验并保存模板'],
  ['打开 Modal', '打开弹窗'],
  ['打开 Modal（', '打开弹窗（'],
  [' [审批] 打开 Modal', ' 点击「审批」打开审批意见弹窗'],
  [' [审批] Modal', ' 「审批」审批意见弹窗'],
  ['批量 Review', '批量审批'],
  ['历史 Recall', '已处理历史中撤回'],
  ['History 可 Recall', '已处理历史列表中可执行撤回'],
  ['详情后 [审批] Modal', '详情后点击「审批」打开审批意见弹窗'],
  ['Tab 顺序', '标签页顺序'],
  ['Tab 列表', '标签页列表'],
  ['Tab 额外', '标签页额外'],
  ['Tab 显示', '标签页显示'],
  ['Tab 同步', '标签页同步'],
  ['当前 Tab', '当前标签页'],
  ['筛选当前 Tab', '筛选当前标签页'],
  ['学籍异动审批：Tab', '学籍异动审批：标签页'],
  ['已处理历史 Tab', '已处理历史标签页'],
  ['待我审批 Tab', '待我审批标签页'],
  ['Status、Date Effective、Changed By、Remarks', '状态、生效日期、变更人、备注'],
  ['Save 校验', '保存时校验'],
  ['含学生/家长附件', '含学生与家长附件'],
  ['老师|学生', '老师或学生'],
  ['老师/学生', '老师或学生'],
  ['老师新建可 选择学生弹窗 选学生', '老师新建时可打开选择学生弹窗选取学生'],
  ['（老师入口）', ''],
  ['（学生入口）', ''],
  ['（审批流程竖向时间线 + 审批流程节点数据）', ''],
  ['（申请详情内容区 / 详情与导出共用的内容区域）', ''],
  ['（申请详情抽屉 / 异动申请详情抽屉）', ''],
  ['（学生档案详情抽屉（详情含八个标签页', '（学生档案详情抽屉（详情含八个标签页'],
  ['学生档案详情抽屉（详情含八 Tab', '学生档案详情抽屉（详情含八个标签页'],
  ['正文.1.4.1–4.4', '2.2.1.4.1至2.2.1.4.4'],
  ['2.2.1.4.1–2.2.1.4.4', '2.2.1.4.1至2.2.1.4.4'],
]

const COMPONENT_PAREN_RE = /[（(][A-Za-z][A-Za-z0-9]*(?:Modal|Drawer|View|Bar|Section|Switch|Trigger|Store|Body|Table|Action|Form)[A-Za-z0-9]*[）)]/g

function sanitizeText(text) {
  if (!text || !text.trim()) return text

  let t = text

  // 菜单标题：去除英文副标题与「已确认」
  if (/^2\.2\.1\.\d+\s/.test(t)) {
    t = t.replace(/（[^）]*）（已确认）$/, '')
    t = t.replace(/（已确认）$/, '')
  }

  // 删除版本对比括号段
  t = t.replace(/（V\d+\.\d+[^）]*）/g, '')
  t = t.replace(/\(V\d+\.\d+[^)]*\)/g, '')
  t = t.replace(/（V\d+\.\d+说明：[^）]*）/g, '')
  t = t.replace(/供 V\d+\.\d+[^。]*变更追溯。?/g, '')
  t = t.replace(/供历史变更追溯。?/g, '')
  t = t.replace(/已合并至[^。；]*[。；]?/g, '')
  t = t.replace(/已合并[^。；]*[。；]?/g, '')
  t = t.replace(/不再单独打开[^。；]*[。；]?/g, '')

  // 版本章节引用
  t = t.replace(/V\d+\.\d+\s*增量约定见\s*§[\d.、\s]+/g, '交互约定见正文各菜单说明')
  t = t.replace(/V\d+\.\d+–V\d+\.\d+\s*约定仍有效[^。]*。?/g, '')
  t = t.replace(/增量见\s*§[\d.、\s]+/g, '')
  t = t.replace(/§2\.\d/g, '正文')

  // 版本号裸引用（保留文档版本行）
  if (!t.startsWith('文档版本：')) {
    t = t.replace(/V2\.\d/g, '')
    t = t.replace(/V1\.\d/g, '')
  }

  // 去除组件英文名括号
  t = t.replace(COMPONENT_PAREN_RE, '')

  for (const [from, to] of TERM_REPLACEMENTS) {
    if (t.includes(from)) t = t.split(from).join(to)
  }

  // 嵌入页面残留
  t = t.replace(/嵌入对应\s*View/g, '内展示对应类型申请列表')
  t = t.replace(/对应 View/g, '对应申请列表')

  // 英文操作词（保留字段表英文名称列中的 Review/Recall/Edit 等）
  if (!/英文名称：/.test(t)) {
    t = t.replace(/\bModal\b/g, '弹窗')
    t = t.replace(/\bRecall\b/g, '撤回')
    if (!/功能按钮/.test(t)) t = t.replace(/\bReview\b/g, '审批')
    t = t.replace(/\bHistory\b/g, '已处理历史')
    t = t.replace(/\bPreview\b/g, '预览')
    t = t.replace(/\bSave\b/g, '保存')
  }
  if (!/英文名称：/.test(t) && !/字段中文名称/.test(t)) {
    t = t.replace(/\bEdit\b/g, '编辑')
  }

  // 方括号按钮文案
  t = t.replace(/\[审批\]/g, '「审批」')
  t = t.replace(/\[关闭\]/g, '「关闭」')
  t = t.replace(/\[撤回\]/g, '「撤回」')

  // 清理多余空格与标点
  t = t.replace(/；；+/g, '；')
  t = t.replace(/。。+/g, '。')
  t = t.replace(/\s{2,}/g, ' ')
  t = t.replace(/，\s*，/g, '，')
  t = t.replace(/：：+/g, '：')

  return t.trim()
}

function p(text, style = '') {
  const pPr = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''
  return `<w:p w:rsidR="00E664A3" w:rsidRDefault="00000000">${pPr}<w:r><w:rPr><w:rFonts w:ascii="宋体" w:hAnsi="宋体" w:cs="宋体" w:hint="eastAsia"/></w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`
}

function buildSection217Xml() {
  loadTemplateAssets()

  const listFields = [
    ['1', '序号', 'No.', '序号', '—', '—', '分页自动编号', '否', ''],
    [
      '2',
      '规则名称',
      'Rule Name',
      '文本',
      '—',
      '—',
      '只读；展示四条内置规则完整说明',
      '否',
      '见菜单简介',
    ],
    ['3', '规则值', 'Rule Value', '数字', '是', '非负整数', '行内可编辑保存', '否', '3'],
    ['4', '是否启用', 'Enabled', '是/否', '是', '—', '开关修改后立即保存', '否', '是'],
    ['5', '操作', 'Actions', '操作', '—', '—', '修改、保存、取消链接按钮', '否', ''],
  ]

  const btnEdit = functionButtonXml(1, '修改规则值', 'Edit Rule Value', {
    description: '在列表行内进入规则值编辑状态，输入数字后保存或取消。',
    interaction:
      '点击「修改」后，规则值列变为可编辑输入框，操作列显示「保存」「取消」链接；点击保存后退出编辑状态并更新展示；点击取消则恢复原值。',
    remarks: '仅规则值列可编辑；规则名称由系统固定展示，不可修改。',
    drillDown: '无下钻页面。',
  })

  const btnEnable = functionButtonXml(2, '是否启用', 'Enable Rule', {
    description: '切换单条规则是否启用。',
    interaction: '点击是/否开关后立即保存，无需二次确认；若当前行处于规则值编辑状态，切换开关会先取消编辑。',
    remarks: '四条规则可分别独立启用或停用。',
    drillDown: '无下钻页面。',
  })

  return [
    p('2.2.1.7 异动规则设置', '4'),
    p('菜单介绍', '5'),
    p('1、菜单内容简介', '7'),
    p(
      '异动规则设置用于维护学籍异动相关的全局业务规则。页面位于侧边栏「学籍异动」分组中，排在「知情同意书」之后。页面仅展示四条系统内置规则，规则名称只读；管理员可修改规则值与是否启用。页面不提供新增规则、删除规则与搜索功能。',
    ),
    p(
      '四条内置规则分别为：本地生长学期转专业申请周次上限、本地生短学期转专业申请周次上限、国际学生转专业距下学期开学月数阈值、中国学生转专业逾期是否仍允许提交。规则值修改采用行内「修改—保存/取消」方式；是否启用开关修改后立即保存。本期规则仅作配置展示与本地演示存储，尚未接入申请表单或审批流程的自动校验。',
    ),
    p('2、页面展示字段信息', '7'),
    p('列表页表格展示字段如下：'),
    buildFieldTable(listFields, { align: 'left' }),
    p('3、支持查询检索的字段信息', '7'),
    p('本页面不提供搜索区与筛选条件。'),
    p('4、数据前后流转关系(说明、前置条件、下游输出)', '7'),
    p(
      '1）说明：管理员在列表中维护四条内置规则的值与启用状态，数据保存在浏览器本地，刷新后仍保留演示配置。规则名称与业务含义固定，不可新增或删除规则行。',
    ),
    p('2）前置条件：用户已进入学籍管理应用并具备该菜单访问权限。'),
    p('3）下游输出：本期不向异动申请、审批或维护实施逻辑传递规则校验结果。'),
    p('5、业务流关系(操作流程)', '7'),
    p(
      '操作流程：进入【学籍管理】→【学籍异动】→【异动规则设置】→ 查看四条规则 → 点击「修改」调整规则值后保存或取消 → 或直接切换「是否启用」开关。',
    ),
    p('6、原型参考链接', '7'),
    p('原型路径：门户 → 学籍管理 → 学籍异动 → 异动规则设置。'),
    p('新增—字段信息表', '6'),
    p('本菜单无新增或编辑弹窗；规则值在列表行内直接修改，无需独立字段表。'),
    p('菜单功能清单', '6'),
    btnEdit,
    btnEnable,
  ].join('')
}

const HEADER_REPLACEMENTS = [
  ['文档版本：V2.3', '文档版本：V2.4'],
  [
    '说明：V2.3 在 V2.2 基础上继续对齐原型与 OpenSpec changes（截至 2026-07-09 晚）：详情抽屉改回「审批流程图在上 + 申请内容在下」（ApprovalTimeline，与课程申请一致）；管理端撤销收敛至审批历史 Tab；维护列表增加文号列与修改文号、行操作「导出 PDF」（查询为「预览 PDF」）；学生档案搜索拆为 5 个独立文本框；新增学籍类型列、详情导出学籍卡、知情同意书适用学生范围、异动规则设置菜单；审批列表移除最近审核时间列等。V2.0–V2.2 约定仍有效，增量见 §2.7、§2.8、§2.9。',
    '说明：本文档描述学籍管理模块当前原型交互与字段规则，覆盖学生基本信息、异动类别、知情同意书、异动规则设置、四种异动类型申请与审批、异动维护与查询等能力。详情抽屉采用审批流程图在上、申请内容在下的布局；管理端撤销仅出现在审批历史列表；维护页支持文号编制与导出PDF，查询页提供预览PDF；学生档案支持五个独立搜索框与学籍类型展示。',
  ],
  [
    'V2.0–V2.3 增量约定见 §2.6、§2.7、§2.8、§2.9（§2.5 仍有效）',
    '字段表、按钮清单与业务流以各二级菜单章节为准',
  ],
  [
    '学籍异动申请（老师）入口：StudentMovementApplicationView 页顶水平 Tab（转专业·休学·复学·退学，默认转专业），嵌入四 View；列表含学号/姓名搜索与列',
    '学籍异动申请（老师）入口位于「学籍异动申请（老师）」菜单：页面顶部为转专业、休学、复学、退学四个标签页，默认打开转专业；每个标签页内为对应类型的申请列表，老师端列表显示学号、姓名列并提供学号、姓名搜索',
  ],
  [
    '学籍异动申请（学生）入口：与老师端共用 Tab 壳层；搜索区无学号/姓名；列表隐藏学号、姓名列',
    '学籍异动申请（学生）入口位于「学籍异动申请（学生）」菜单：与老师端共用同一套四个标签页结构；学生端搜索区不显示学号、姓名条件，列表也不展示学号、姓名列',
  ],
  [
    '已落地：学生基本信息、异动类别、知情同意书、异动规则设置、学籍异动申请（老师/学生）、学籍异动审批、异动维护、异动查询。',
    '已落地：学生基本信息、异动类别、知情同意书、异动规则设置、学籍异动申请（老师）、学籍异动申请（学生）、学籍异动审批、学籍异动维护、学籍异动查询。',
  ],
  [
    '知情同意书配置行+版本快照；适用学生范围学籍管理Student Status Management学籍异动Student Status Change异动规则设置内置 3 条规则；规则值+启用学籍管理Student Status Management学籍异动Student Status Change学籍异动申请（老师）',
    '知情同意书配置与版本快照、适用学生范围；异动规则设置提供四条内置规则，可维护规则值与是否启用；学籍异动申请（老师）',
  ],
]

const FULL_XML_REPLACEMENTS = [
  ['内置 3 条规则', '四条内置规则'],
  ['三条内置规则', '四条内置规则'],
  ['三条规则', '四条规则'],
]

/** 将 V2.3 源稿中仍偏旧或含技术标识的正文，对齐为当前原型通俗描述 */
const CONTENT_REPLACEMENTS = [
  // 详情抽屉布局
  [
    '详情抽屉改为「申请内容在上 + 审批日志四列表格在下」',
    '详情抽屉采用审批流程图在上、申请内容在下的布局',
  ],
  [
    '申请详情在上、审批日志表在下',
    '审批流程图在上、申请详情在下',
  ],
  [
    '申请详情在上、审批日志四列表格在下',
    '审批流程图在上、申请详情在下',
  ],
  [
    '上方为异动申请详情（MovementDetailContent），下方为审批日志四列表格（MovementApprovalLogTable：Description / Action By / Action By Role / Created At）',
    '上方为竖向审批流程图，下方为异动申请详情；流程图展示阶段、处理人、状态标签、时间与意见',
  ],
  [
    '（V2.3 已合并）审批流转历史改在详情抽屉顶部以竖向流程图（ApprovalTimeline）展示，含阶段、处理人、状态徽章、时间与意见；申请字段在下方；Preview/Export PDF 与抽屉 WYSIWYG；不再单独打开 ApprovalLogModal。',
    '审批流转历史在详情抽屉顶部以竖向流程图展示，含阶段、处理人、状态标签、时间与意见；申请字段在下方；预览PDF与导出PDF与抽屉所见即所得一致；不再单独打开审批日志弹窗。',
  ],
  [
    '（V2.2 已合并）审批流转历史改在详情抽屉底部以四列表格（MovementApprovalLogTable）展示，列含 Description、Action By、Action By Role、Created At；Submitted 显示 Application Submitted；不再单独打开 ApprovalLogModal 或 ApprovalTimeline。',
    '审批流转历史在详情抽屉顶部以竖向流程图展示；不再单独打开审批日志弹窗。',
  ],
  [
    'MovementApprovalLogTable 四列表格（Description / Action By / Action By Role / Created At）置于申请详情下方；Submitted 显示 Application Submitted；Created At 格式 YYYY-MM-DD HH:mm:ss',
    '竖向审批流程图置于申请详情上方；节点含阶段、处理人、状态标签、时间与意见；详情与导出共用同一内容区域',
  ],
  [
    '顶栏固定，中间可滚动（申请详情在上、审批日志表在下），底栏场景按钮（Close/Review/Recall/Export PDF 等）',
    '顶栏固定，中间可滚动（流程图在上、申请详情在下），底栏按场景显示关闭、审批、撤回、导出PDF等按钮',
  ],
  [
    '顶栏固定，中间可滚动（申请详情在上、审批日志表在下），底栏场景按钮（Close/Review/Recall 等）；Cancel 保留在列表行',
    '顶栏固定，中间可滚动（流程图在上、申请详情在下），底栏按场景显示关闭、审批、撤回等按钮；撤销保留在列表行',
  ],
  [
    '·  描述：（V2.3）在详情抽屉顶部审批流程图查看完整流转历史；列表行内无独立「流转日志」按钮。',
    '·  描述：在详情抽屉顶部审批流程图查看完整流转历史；列表行内无独立「流转日志」按钮。',
  ],
  [
    '·  描述：（V2.2）在详情抽屉底部审批日志表格查看完整流转历史；列表行内无独立「流转日志」按钮。',
    '·  描述：在详情抽屉顶部审批流程图查看完整流转历史；列表行内无独立「流转日志」按钮。',
  ],
  [
    '·  描述：（V2.3）在详情抽屉顶部审批流程图查看审批流转历史；列表行内无独立「流转日志」按钮。',
    '·  描述：在详情抽屉顶部审批流程图查看审批流转历史；列表行内无独立「流转日志」按钮。',
  ],
  [
    '·  业务的事件交互：V2.3 行内仅「详情」按钮；点击后抽屉内上方流程图、下方申请详情。',
    '·  业务的事件交互：行内仅「详情」按钮；点击后抽屉内上方为审批流程图、下方为申请详情。',
  ],
  [
    '·  业务的事件交互：V2.3 点击「详情」打开 ApplicationDetailDrawer，审批流程图在上、申请详情在下。',
    '·  业务的事件交互：点击「详情」打开申请详情抽屉，审批流程图在上、申请详情在下。',
  ],
  [
    '·  描述：详情抽屉只读展示流程图+申请全文；待我审批时底栏 [审批] 打开 MovementApprovalModal。',
    '·  描述：详情抽屉只读展示流程图与申请全文；待我审批时底栏点击「审批」打开审批意见弹窗。',
  ],
  [
    '（V2.3 已合并至详情抽屉顶部审批流程图，无独立日志按钮）',
    '审批流转历史已合并至详情抽屉顶部流程图，列表无独立日志按钮',
  ],
  [
    '（V2.2 已合并至详情抽屉底部审批日志表，无独立日志按钮）',
    '审批流转历史已合并至详情抽屉顶部流程图，列表无独立日志按钮',
  ],
  [
    '详情抽屉含审批日志表',
    '详情抽屉含审批流程图',
  ],
  [
    '单一「详情」按钮；上方 ApprovalTimeline 流程图，下方 MovementDetailContent；管理端 Footer 可「导出 PDF」',
    '单一「详情」按钮；上方为审批流程图，下方为申请详情；管理端底部操作栏可导出PDF',
  ],

  // 撤销入口
  [
    '管理端查询/维护/审批列表增加撤销（In Progress）',
    '管理端撤销仅出现在学籍异动审批的已处理历史标签页',
  ],
  [
    '管理端撤销异动查询/维护/审批列表status===In Progress 时行内显示「撤销」/Cancel（tooltip+确认弹框）；不在详情抽屉底栏；学生端 Early Cancel 规则不变',
    '管理端撤销仅在学籍异动审批已处理历史标签页、状态为审批进行中时于行内显示「撤销」；查询、维护、申请列表无管理端撤销；学生端待审核且审批未开始前可自行取消，规则不变',
  ],
  [
    '查询/维护/审批三列表 In Progress 时显示「撤销」/Cancel（带 tooltip+确认）；学生端 Pending Review 且审批未开始仍可 Cancel',
    '仅学籍异动审批已处理历史标签页、审批进行中时显示「撤销」；学生端待审核且审批未开始前可自行取消',
  ],
  [
    'V2.3 行操作「详情」（含流程图）+「导出 PDF」/「预览 PDF」；维护另有「修改文号」；无独立流转日志按钮',
    '行操作含「详情」；维护页另有「修改文号」「导出PDF」，查询页为「预览PDF」；无独立流转日志按钮',
  ],

  // 维护/查询
  [
    '学籍异动维护：15 列宽表与查询一致；搜索学年学期/专业代码/状态/学号/姓名。工具栏实施、导出、删除（无修改异动编号）；行操作详情、流转日志（无 Edit）。详情脱敏。',
    '学籍异动维护：列表含文号列（位于学号前一列，未填显示NA）及十五个数据列；搜索区两行共九项条件。工具栏含实施、导出、删除。行操作含修改文号、详情、导出PDF。详情展示审批流程图与申请内容，护照等信息脱敏。',
  ],
  [
    '1）说明：维护页合并四类 status=Approved 记录为 15 列宽表（与查询列序一致）；状态 Badge、是否实施 Y/N、护照/IC 脱敏、异动日期 YYYY-MM-DD、生效日期 YYYY/MM。搜索：学年学期、专业代码、状态、学号、姓名。工具栏：实施、导出、删除（无修改异动编号）。行操作：详情、流转日志',
    '1）说明：维护页合并四种异动类型中状态为已通过的记录；列表在学号列前增加文号列，未填写时显示NA；共十五个数据列，列序与查询页基本一致（查询页无文号列）。状态以胶囊形标签展示；是否实施显示为是/否；护照与身份证号脱敏；异动日期格式为年-月-日，生效学期格式为年/月。搜索区两行九项条件。工具栏：实施、导出、删除。行操作：修改文号、详情、导出PDF',
  ],
  [
    '与「修改异动编号」；工具栏保留实施、导出、删除；行操作仅详情与流转日志',
    '不提供修改异动编号功能；工具栏保留实施、导出、删除；行操作含修改文号、详情、导出PDF',
  ],
  [
    '前缀列：序号→状态→审批环节→是否实施→学号→姓名→Intake→Programme→生效日期→…；Preview PDF；9 项搜索+更多/收起',
    '前缀列顺序：序号、状态、审批环节、是否实施、文号、学号、姓名、入学批次、专业、生效学期等；维护行操作为导出PDF，查询为预览PDF；搜索区九项条件支持更多与收起',
  ],
  [
    '学籍异动查询              只读；Preview PDF；列序与维护一致；9 项搜索+更多/收起',
    '学籍异动查询              只读；预览PDF；列序与维护一致（无文号列）；搜索区九项条件支持更多与收起',
  ],
  [
    '操作列 Preview PDF，与详情 Export PDF 同源',
    '维护行操作为导出PDF、查询行操作为预览PDF；与详情中的PDF预览弹窗内容同源',
  ],
  [
    '学籍异动查询只读；Preview PDF；异动类型筛选；详情抽屉含审批日志表',
    '学籍异动查询只读；预览PDF；支持异动类型筛选；详情抽屉含审批流程图',
  ],

  // 学生档案
  [
    '搜索区支持统一 keyword 模糊检索（学号/姓名/中文名/NRIC/电话 OR 匹配）及下列字段：',
    '搜索区第一行提供五个独立文本框，分别按学号、姓名、中文名、身份证号、手机号模糊检索（有值时同时满足），另支持下列字段：',
  ],
  [
    '填写 keyword 或下拉筛选后点击「查询」（带图标）或「重置」；折叠区含 Student Type、Nationality、Registration Time、Programme Level、Programme Structure、Expected Completion/Graduation Batch、Outstanding Fee、Student Pass Expiry 日期范围',
    '填写各文本框或下拉筛选后点击「查询」或「重置」；第一行为五个文本框及专业、入学批次、状态等；折叠区含学生类别、国籍、注册时间、专业层次、专业结构、预计完成/毕业批次、欠费、学生准证有效期日期范围等',
  ],
  [
    'keyword OR 匹配；主表补 Status/Nationality/Outstanding Fee；左侧冻结复选框/序号/学号/姓名；Programme Level 统一 Foundation/Undergraduate/Postgraduate',
    '五个文本框条件同时满足时过滤；主表含状态、学籍类型、国籍、欠费等列；左侧冻结复选框、序号、学号、姓名；专业层次统一为基础、本科、研究生',
  ],
  [
    '或行内编辑/详情/预览（以学生身份跳转学生端异动申请）查看',
    '或行内编辑、详情、以学生身份预览跳转学生端异动申请；详情底部提供导出学籍卡按钮',
  ],

  // 知情同意书
  [
    '配置行+版本快照；按异动类别×Student Type×学历层次',
    '配置行、版本快照与适用学生范围（第一年/第二年及以上）；按异动类别、学生类别与学历层次组合配置',
  ],
  [
    '配置行+版本快照；适用学生范围（第一年/第二年及以上）；按异动类别×Student Type×学历层次',
    '配置行、版本快照与适用学生范围（第一年/第二年及以上）；按异动类别、学生类别与学历层次组合配置',
  ],

  // 审批列表
  [
    '三 Tab（待我审批→已提交→历史）；inline 5 字段搜索（学年学期/专业代码/状态/学号/姓名）；增量列：申请日期、历史申请次序、Last Action Time；详情抽屉+Modal 审批',
    '三个标签页顺序为待我审批、已提交、已处理历史；搜索区五个字段同一行排列；列表含申请日期、历史申请次序列（已移除最近审核时间列）；已处理历史标签页支持管理端撤销；查看详情为抽屉加审批意见弹窗',
  ],
  [
    '历史申请次序、Last Action Time（表头 tooltip）；申请日期列；附件区「支持格式」hint 在按钮下方',
    '历史申请次序列（表头带悬停说明）、申请日期列；已移除最近审核时间列；附件区支持格式说明在按钮下方',
  ],
  [
    '历史申请次序（表头 tooltip）；申请日期列；已移除最近审核时间；附件区「支持格式」hint 在按钮下方',
    '历史申请次序列（表头带悬停说明）、申请日期列；已移除最近审核时间列；附件区支持格式说明在按钮下方',
  ],

  // 流转日志按钮合并说明
  [
    '（V2.3 说明：本按钮已合并至「详情」抽屉内顶部审批流程图，原型不再提供独立「流转日志/Approval Log」行内按钮；以下描述供历史变更追溯。）',
    '（审批流转历史已合并至详情抽屉顶部流程图，列表行内不再提供独立流转日志按钮。）',
  ],
  [
    '（V2.2 说明：本按钮已合并至「详情」抽屉内底部审批日志表，原型不再提供独立「流转日志/Approval Log」行内按钮；以下描述供历史变更追溯。）',
    '（审批流转历史已合并至详情抽屉顶部流程图，列表行内不再提供独立流转日志按钮。）',
  ],

  // 知情同意书适用学生范围（V2.3 源稿原文）
  [
    '知情同意书配置：按适用异动类别与 Student Type（Local/Chinese/International，中文「中国」）维护模板，(类别+类型) 唯一。含学生/家长附件 mock；四 Tab 申请 Form/Detail 与休学/退学家长区 resolveConsentTemplate 下载。',
    '知情同意书配置：按适用异动类别、学生类别与适用学生范围维护模板；异动类别与学生类别组合须唯一。适用学生范围可选第一年或第二年及以上，非必填，列表同步展示，未配置显示横线。含学生与家长附件演示数据；转专业、休学、复学、退学四个标签页内申请表单与详情及休学、退学家长区均可按异动类别与学生类别匹配并下载知情同意书。',
  ],
  [
    '含学生/家长附件 mock。四 Tab 申请 Form/Detail 及休学/退学家长区通过 resolveConsentTemplate(movementType, studentCategory) 提供 Download Consent Letter；未配置时提示。列表支持按异动类别、名称、Student Type 搜索；Create/Edit Modal 校验唯一性与必填附件。',
    '含学生与家长附件演示数据。转专业、休学、复学、退学四个标签页内申请表单与详情及休学、退学家长区均可按异动类别与学生类别匹配并下载知情同意书；未配置时提示。列表支持按异动类别、名称、学生类别搜索，并展示适用学生范围列；新建与编辑弹窗校验组合唯一性与必填附件。',
  ],
  [
    '下钻页面说明：下钻至「知情同意书表单弹窗」（ConsentFormFormModal）：居中弹窗含名称、适用异动类别、Student Type、Remark、学生/家长附件上传，底部取消与保存。',
    '下钻页面说明：下钻至「知情同意书表单弹窗」：居中弹窗含名称、适用异动类别、学生类别、适用学生范围（备注前下拉，选项为第一年或第二年及以上，非必填）、备注、学生与家长附件上传区，底部取消与保存。',
  ],
  [
    '·  业务的事件交互：Create 打开 ConsentFormFormModal 填写五字段后 Save；附件在后续「版本快照→新增版本」上传。',
    '·  业务的事件交互：点击新建打开知情同意书弹窗，填写名称、适用异动类别、学生类别、适用学生范围、备注等字段后保存；附件在后续版本快照中新增版本时上传。',
  ],
  [
    'Create 五字段无附件；Edit 仅名称/批注；操作「编辑|版本快照」；版本快照内按生效学年学期维护附件与 YnSwitch 互斥「应用」',
    '新建时填写五个字段（含适用学生范围）但不上传附件；编辑时可改名称、适用学生范围与备注；行操作含编辑与版本快照；版本快照内按生效学年学期维护附件与是/否开关互斥的应用状态',
  ],

  // 知情同意书适用学生范围
  [
    '知情同意书配置：按适用异动类别与 学生类别（本地生、中国学生、国际生，中文「中国」）维护模板，(类别+类型) 唯一。',
    '知情同意书配置：按适用异动类别、学生类别与适用学生范围维护模板；异动类别与学生类别组合须唯一。适用学生范围可选第一年或第二年及以上，非必填，列表同步展示，未配置显示横线。',
  ],
  [
    '下钻页面说明：下钻至「知情同意书表单弹窗」：居中弹窗含名称、适用异动类别、学生类别、Remark、学生/家长附件上传，底部取消与保存。',
    '下钻页面说明：下钻至「知情同意书表单弹窗」：居中弹窗含名称、适用异动类别、学生类别、适用学生范围（备注前下拉，选项为第一年或第二年及以上，非必填）、备注、学生与家长附件上传区，底部取消与保存。',
  ],
  [
    '· 业务的事件交互：Create 打开 新建知情同意书弹窗 填写五字段后 保存；附件在后续「版本快照→新增版本」上传。',
    '· 业务的事件交互：点击新建打开知情同意书弹窗，填写名称、适用异动类别、学生类别、适用学生范围、备注等字段后保存；附件在后续版本快照中新增版本时上传。',
  ],
  [
    '含学生与家长附件 演示数据。四个标签页内的申请表单与详情 及休学/退学家长区通过 按异动类别与学生类别匹配知情同意书模板(异动类别, 学生类别) 提供 下载知情同意书；未配置时提示。列表支持按异动类别、名称、学生类别 搜索；新建与编辑弹窗 校验唯一性与必填附件。',
    '含学生与家长附件演示数据。转专业、休学、复学、退学四个标签页内的申请表单与详情，以及休学、退学家长信息区，均可按异动类别与学生类别匹配并下载知情同意书；未配置时提示。列表支持按异动类别、名称、学生类别搜索，并展示适用学生范围列；新建与编辑弹窗校验组合唯一性与必填附件。',
  ],

  // 残留英文与重复文案修正
  [
    '第八个标签页 为 状态日志 状态日志',
    '第八个标签页为状态日志',
  ],
  [
    'Status、生效日期、变更人、Remarks',
    '状态、生效日期、变更人、备注',
  ],
  ['expandable 导航', '可展开导航'],
  ['form-grid', '表单双列网格'],
  ['WDR001 类别 reasons', '退学异动类别配置的原因列表'],
  ['休学异动类别 类别 reasons', '休学异动类别配置的原因列表'],
  ['Create ', '点击新建'],
  ['Remark', '备注'],
]

function removeVersionSections(xml) {
  const markers = [
    '2.6 V2.0 交互统一约定',
    '2.7 V2.1 交互统一约定',
    '2.8 V2.2 交互统一约定',
    '2.9 V2.3 交互统一约定',
  ]
  let start = -1
  for (const m of markers) {
    const idx = xml.indexOf(esc(m))
    if (idx !== -1 && (start === -1 || idx < start)) start = idx
  }
  if (start === -1) return xml
  const bodyEnd = xml.lastIndexOf('</w:body>')
  if (bodyEnd === -1 || start >= bodyEnd) return xml
  const paraStart = xml.lastIndexOf('<w:p ', start)
  return xml.slice(0, paraStart >= 0 ? paraStart : start) + xml.slice(bodyEnd)
}

function insertSection217(xml) {
  if (xml.includes('2.2.1.7 异动规则设置')) return xml
  const anchor = '2.2.1.4 学籍异动申请（老师）'
  const idx = xml.indexOf(esc(anchor))
  if (idx === -1) {
    console.warn('未找到插入锚点，跳过 2.2.1.7')
    return xml
  }
  const paraStart = xml.lastIndexOf('<w:p ', idx)
  return xml.slice(0, paraStart) + buildSection217Xml() + xml.slice(paraStart)
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

  for (const [from, to] of HEADER_REPLACEMENTS) {
    if (xml.includes(from)) xml = xml.split(from).join(to)
  }

  xml = removeVersionSections(xml)

  let contentCount = 0
  for (const [from, to] of CONTENT_REPLACEMENTS) {
    if (xml.includes(from)) {
      xml = xml.split(from).join(to)
      contentCount++
    }
  }
  console.log(`已应用正文对齐替换 ${contentCount} 处`)

  let nodeCount = 0
  xml = xml.replace(/<w:t([^>]*)>([^<]*)<\/w:t>/g, (full, attrs, content) => {
    const decoded = content.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    const sanitized = sanitizeText(decoded)
    if (sanitized !== decoded) nodeCount++
    return `<w:t${attrs}>${esc(sanitized)}</w:t>`
  })

  for (const [from, to] of FULL_XML_REPLACEMENTS) {
    if (xml.includes(from)) xml = xml.split(from).join(to)
  }

  xml = insertSection217(xml)

  zip.file('word/document.xml', xml)
  const out = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  fs.writeFileSync(TARGET, out)
  console.log(`已生成: ${TARGET}`)
  console.log(`document.xml: ${before} → ${xml.length}，通俗化节点约 ${nodeCount} 处`)

  const nodes = [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1])
  const full = nodes.join('')
  const bad = []
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]
    if (/（V2\.|已合并|四异动|四 View|MovementApplication|MovementAttachment|StudentProfileImport|DetailModal|MovementCategoryForm|movementType|movementStore|§2\.|openspec/i.test(n)) {
      bad.push(n.slice(0, 100))
    }
  }

  const checks = {
    文档版本V24: full.includes('文档版本：V2.4'),
    有异动规则设置章节: full.includes('2.2.1.7 异动规则设置'),
    四条内置规则: full.includes('四条内置规则') || full.includes('四条规则'),
    无V23括号: !/（V2\./.test(full),
    无已合并: !full.includes('已合并'),
    无组件名残留: bad.length === 0,
    无四异动: !full.includes('四异动'),
    审批流程在上: full.includes('审批流程') && (full.includes('在上') || full.includes('上方')),
  }
  console.log('\n--- 校验 ---')
  for (const [k, v] of Object.entries(checks)) console.log(k, v ? 'OK' : 'MISSING/FAIL')
  if (bad.length) {
    console.log('\n残留术语样例（前10条）：')
    bad.slice(0, 10).forEach((b) => console.log('-', b))
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
