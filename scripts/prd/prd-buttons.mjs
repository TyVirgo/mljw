/** 菜单功能清单按钮定义（纯中文描述，技术标识后置括号） */

const PROFILE_DRAWER_PAGE =
  '下钻至「学生档案表单抽屉」（StudentProfileFormDrawer）：右侧宽屏抽屉，顶栏为学生类别下拉选择，主体按七个页签切换展示分区表单（基本信息含照片区、学籍信息、联系方式、教育背景、家庭信息、住宿信息、其他信息），底部固定保存与取消按钮。'

const PROFILE_DETAIL_PAGE =
  '下钻至「学生档案只读详情抽屉」（StudentProfileDetailDrawer）：布局与新建/编辑抽屉相同，七个页签只读展示全部字段与学生照片，无编辑控件与底部操作按钮。'

const IMPORT_MODAL_PAGE =
  '下钻至「档案导入弹窗」（StudentProfileImportModal）：居中弹窗含标题栏与关闭按钮；正文分两步——第一步说明区与「下载导入模板」按钮，第二步文件上传区（选择文件按钮、已选文件名展示、移除链接），底部为取消与导入按钮；导入完成后在同弹窗内展示成功/失败摘要，失败时可下载错误报告。'

const EXPORT_MODAL_PAGE =
  '下钻至「档案导出弹窗」（ExportModal）：居中弹窗含标题栏；正文为左右穿梭框（待选字段列表与已选导出字段列表，支持全选与左右移动），下方为导出范围单选（当前页/全部结果/选中行），底部为取消与确认导出按钮。'

const CONFIRM_DIALOG_PAGE =
  '下钻至「确认对话框」（ConfirmDialog）：系统居中确认弹框，展示操作提示文案与取消、确认两个按钮，无其他表单字段。'

const MOVEMENT_FORM_PAGE = (moduleName) =>
  `下钻至「${moduleName}申请表单弹窗」：Section I 学号姓名同行只读灰底；老师新建 StudentSelectModal；转专业 Section VII disabled；附件与 MovementAttachmentReadonly 对齐。`

const MOVEMENT_DETAIL_PAGE = (moduleName) =>
  `下钻至「${moduleName}申请只读详情弹窗」（DetailModal）：与表单弹窗相同的分区结构，全部字段与附件只读展示（MovementAttachmentReadonly），不含审批表单与底部提交按钮，仅保留关闭按钮。`

const APPROVAL_LOG_PAGE =
  '下钻至「流转日志弹窗」（ApprovalLogModal）：居中弹窗含标题栏；正文为审批流转历史表格，列含审批环节、操作人、操作动作、日期时间与办理意见；无数据时展示空状态提示，底部仅关闭按钮。'

const BATCH_REVIEW_PAGE =
  '下钻至「批量审批弹窗」（MovementApprovalModal）：居中弹窗含标题栏与当前审批环节说明；正文含审批结果单选（通过/拒绝/需修改材料）、办理意见文本框与常用意见快捷插入，底部为取消与确认审批按钮；确认前可能弹出二次确认对话框。'

const REVIEW_VIEW_PAGE =
  '下钻至「审批详情全页视图」（MovementApprovalReviewView）：嵌入 DetailModal 只读；待我审批底部 [审批] 打开 MovementApprovalModal；History 可 Recall。'

function formRef(start, end, extra = '') {
  return `${PROFILE_DRAWER_PAGE}分区字段见「新增—字段信息表」；表单内操作按钮见本清单第${start}至第${end}项。${extra}`
}

function movementFormRef(moduleName, start, end) {
  return `${MOVEMENT_FORM_PAGE(moduleName)}分区字段见「新增—字段信息表」；表单内操作按钮见本清单第${start}至第${end}项。`
}

/** 学生基本信息 — 列表页按钮 */
const profileListButtons = [
  {
    nameZh: '查询',
    nameEn: 'Search',
    description: '按学号、学生姓名（含中文名）、学生类别组合筛选档案列表，支持模糊匹配。',
    interaction: '在搜索区填写条件后点击查询，列表回到第一页并展示筛选结果，同时清空行勾选状态。',
    remarks: '学生姓名同时匹配英文名与中文名字段；与重置按钮配对使用。',
    drillDown: '无下钻页面。',
  },
  {
    nameZh: '重置',
    nameEn: 'Reset',
    description: '清空搜索区全部条件，恢复展示全量学生档案列表。',
    interaction: '点击重置后搜索条件恢复初始值，列表回到第一页并清空勾选。',
    remarks: '不影响已打开的抽屉或弹窗。',
    drillDown: '无下钻页面。',
  },
  {
    nameZh: '新增',
    nameEn: 'Create',
    description:
      '创建新学生档案。打开右侧宽屏抽屉，顶栏先选学生类别，再按七个页签依次维护档案信息，校验通过后写入存储。',
    interaction: '点击新增打开新建抽屉（StudentProfileFormDrawer）；选择类别后逐页签填写；保存与取消见下钻说明。',
    remarks: '学号全局唯一；类别决定证件字段显隐与校验分支。',
    drillDown: null,
  },
  {
    nameZh: '删除',
    nameEn: 'Delete',
    description: '批量删除列表中勾选的一条或多条学生档案。',
    interaction: '勾选行后点击删除，在确认对话框（ConfirmDialog）确认后移除记录并刷新列表。',
    remarks: '未勾选时按钮禁用；演示环境暂不校验下游异动引用。',
    drillDown: `${CONFIRM_DIALOG_PAGE}文案提示即将删除所选学生档案条数，用户确认后执行删除。`,
  },
  {
    nameZh: '导入',
    nameEn: 'Import',
    description: '通过标准表格模板批量导入学生档案，支持下载模板与上传校验入库。',
    interaction: '点击导入打开导入弹窗（StudentProfileImportModal）；模板下载与文件上传见下钻说明。',
    remarks: '重复学号跳过并汇总提示；须使用系统标准列头映射。',
    drillDown: null,
  },
  {
    nameZh: '导出',
    nameEn: 'Export',
    description: '按所选字段集合与数据范围导出学生档案表格文件。',
    interaction: '点击导出打开导出弹窗（ExportModal），选择字段与范围后确认导出。',
    remarks: '支持当前页、全部结果、选中行三种范围。',
    drillDown: null,
  },
  {
    nameZh: '详情',
    nameEn: 'Details',
    description: '只读查看学生完整档案，与编辑抽屉相同的七个页签结构，不可修改。',
    interaction: '行内点击详情打开只读抽屉（StudentProfileDetailDrawer），浏览后关闭返回列表。',
    remarks: '纯只读，不含审批或导出操作。',
    drillDown: `${PROFILE_DETAIL_PAGE}字段分组与「新增—字段信息表」页签一致。`,
  },
  {
    nameZh: '编辑',
    nameEn: 'Edit',
    description: '修改已有学生档案，结构与新增一致，学号创建后不可变更。',
    interaction: '行内点击编辑打开编辑抽屉并预填数据；保存与取消见下钻说明。',
    remarks: '变更学生类别可能触发字段显隐切换。',
    drillDown: null,
  },
]

/** 学生基本信息 — 抽屉/弹窗内按钮 */
const profileFormButtons = [
  {
    nameZh: '保存',
    nameEn: 'Save',
    description: '在新建或编辑抽屉内校验并保存全部页签字段至学生档案存储（students）。',
    interaction: '填写各页签后点击保存，按类别分支校验必填项，通过后写入并关闭抽屉，列表刷新。',
    remarks: '本地生必填身份证号；中国学生/国际生按护照相关规则校验。',
    drillDown: '无下钻页面。',
  },
  {
    nameZh: '取消',
    nameEn: 'Cancel',
    description: '关闭新建或编辑抽屉，不保存未提交更改。',
    interaction: '点击取消或右上角关闭图标，返回列表页。',
    remarks: '不影响已有列表数据。',
    drillDown: '无下钻页面。',
  },
  {
    nameZh: '上传照片',
    nameEn: 'Upload Photo',
    description: '在基本信息页签上传学生照片，支持本地预览。',
    interaction: '在基本信息页签点击上传，选择图片文件（jpg/png，不超过2兆字节）后本地预览。',
    remarks: '演示环境为本地预览，无服务端上传。',
    drillDown:
      '下钻至浏览器系统「选择文件」对话框：点击基本信息页签内「上传」按钮后唤起本地文件选择器，限定图片格式（jpg/png）；选定文件后在同页签照片预览框内即时展示缩略图，校验不通过时在照片区下方显示错误提示，无独立业务弹窗页面。',
  },
  {
    nameZh: '下载导入模板',
    nameEn: 'Download Import Template',
    description: '在导入弹窗内下载标准导入模板表格。',
    interaction: '打开导入弹窗后点击下载模板，浏览器下载含列头与示例行的文件。',
    remarks: '列头须与系统字段映射一致。',
    drillDown: `${IMPORT_MODAL_PAGE}本按钮位于弹窗正文第一步说明卡片内，点击后直接触发浏览器下载标准表格模板文件，不打开新页面。`,
  },
  {
    nameZh: '选择导入文件',
    nameEn: 'Select Import File',
    description: '在导入弹窗内选择并上传已填写的表格文件，系统解析校验后批量入库。',
    interaction: '选择文件后确认导入，成功记录入库，失败行给出原因摘要。',
    remarks: '学号重复行跳过。',
    drillDown: `${IMPORT_MODAL_PAGE}本按钮位于弹窗正文第二步上传卡片内；点击「选择文件」唤起系统文件选择器（限定 xlsx/xls），选定后在同卡片展示文件名与移除链接，须再点击底部「导入」按钮完成解析入库。`,
  },
  {
    nameZh: '确认导出',
    nameEn: 'Confirm Export',
    description: '在导出弹窗内确认所选字段与范围，生成并下载表格文件。',
    interaction: '在导出弹窗穿梭框调整字段，选择导出范围后点击确认，触发文件下载。',
    remarks: '列头支持中英文国际化。',
    drillDown: `${EXPORT_MODAL_PAGE}本按钮位于弹窗底部，点击后按所选字段与范围生成表格并触发浏览器下载，弹窗关闭返回列表。`,
  },
]

export function buildProfileButtons() {
  const list = [...profileListButtons]
  const form = [...profileFormButtons]
  const formStart = list.length + 1
  const importStart = formStart + 2
  const importEnd = formStart + 3
  const exportBtn = formStart + 4
  list.find((b) => b.nameEn === 'Create').drillDown =
    formRef(formStart, formStart + 1) + `基本信息页签上传照片见第${formStart + 2}项。`
  list.find((b) => b.nameEn === 'Edit').drillDown = formRef(formStart, formStart + 1)
  list.find((b) => b.nameEn === 'Import').drillDown =
    `${IMPORT_MODAL_PAGE}弹窗内「下载导入模板」见本清单第${importStart}项；「选择导入文件」见第${importEnd}项。`
  list.find((b) => b.nameEn === 'Export').drillDown =
    `${EXPORT_MODAL_PAGE}弹窗内「确认导出」见本清单第${exportBtn}项。`
  return [...list, ...form]
}

/** 异动申请 — 列表页按钮 */
function movementListButtons(moduleName) {
  return [
    {
      nameZh: '查询',
      nameEn: 'Search',
      description: `${moduleName} Tab 双行搜索：老师入口首行含学号或姓名、专业代码、申请学年学期、状态；次行是否实施可收起；学生入口隐藏关键字。`,
      interaction: '填写条件后点击查询，列表回到第一页；Reset 清空。',
      remarks: 'MovementApplicationSearchBar；inline 布局。',
      drillDown: '无下钻页面。',
    },
    {
      nameZh: '重置',
      nameEn: 'Reset',
      description: '清空搜索关键字，恢复当前页签全量列表。',
      interaction: '点击重置后搜索框清空，列表回到第一页。',
      remarks: '与查询按钮配对。',
      drillDown: '无下钻页面。',
    },
    {
      nameZh: '新建申请',
      nameEn: 'New Application',
      description: `在${moduleName}页签创建申请。老师入口 Section I 行末「选择」打开 StudentSelectModal；学生入口无选学生按钮。`,
      interaction: '点击新建申请打开 Form Modal；分区填写后保存草稿或提交。',
      remarks: 'Section VII 转专业申请侧 disabled；转专业原因下拉来自类别配置。',
      drillDown: null,
    },
    {
      nameZh: '详情',
      nameEn: 'Details',
      description: `只读查看${moduleName}申请全文，含各分区字段与附件，不含审批操作与内嵌流转日志。`,
      interaction: '行内点击详情打开只读详情弹窗（DetailModal），浏览后关闭返回列表。',
      remarks: '审批须在异动审批模块完成。',
      drillDown: MOVEMENT_DETAIL_PAGE(moduleName),
    },
    {
      nameZh: '编辑',
      nameEn: 'Edit',
      description: `修改${moduleName}草稿或需补充材料的申请，仅草稿或需修改材料状态可编辑。`,
      interaction: '行内点击编辑打开表单弹窗并预填；保存草稿或再次提交见下钻说明。',
      remarks: '进行中且非需修改材料状态不可编辑；不可修改学号。',
      drillDown: null,
    },
    {
      nameZh: '删除',
      nameEn: 'Delete',
      description: `永久删除${moduleName}页签下的草稿申请，已提交记录不可删除。`,
      interaction: '行内点击删除，确认后从存储移除并刷新列表。',
      remarks: '仅草稿状态可删除。',
      drillDown: `${CONFIRM_DIALOG_PAGE}文案提示即将永久删除该草稿申请，确认后移除记录。`,
    },
    {
      nameZh: '撤销申请',
      nameEn: 'Cancel',
      description: `撤销已提交但尚未被审批人处理的${moduleName}申请。`,
      interaction: '行内点击撤销，确认后状态变为已撤销，并从待审批队列移除。',
      remarks: '仅待审核环节且未被处理时可撤销。',
      drillDown: `${CONFIRM_DIALOG_PAGE}文案提示即将撤销该已提交申请，确认后状态变更为已撤销。`,
    },
    {
      nameZh: '流转日志',
      nameEn: 'Approval Log',
      description: `查看${moduleName}申请从提交至当前状态的全部审批流转历史。`,
      interaction: '行内点击流转日志打开日志弹窗（ApprovalLogModal），表格展示环节、操作人、时间、结果与意见。',
      remarks: '各状态均可查看；日志只读。',
      drillDown: APPROVAL_LOG_PAGE,
    },
  ]
}

/** 异动申请 — 表单弹窗内按钮 */
function movementFormButtons(moduleName) {
  return [
    {
      nameZh: '保存草稿',
      nameEn: 'Save Draft',
      description: `在${moduleName}表单弹窗内暂存为草稿，不触发审批流程。`,
      interaction: '填写部分字段后点击保存草稿，校验学号等基础项后写入草稿状态并关闭弹窗。',
      remarks: '草稿可反复编辑或删除；不产生流转日志。',
      drillDown: '无下钻页面。',
    },
    {
      nameZh: '提交',
      nameEn: 'Submit',
      description: `在${moduleName}表单弹窗内正式提交申请，进入进行中与待审核审批流程。`,
      interaction: '填写完毕并勾选声明、上传附件后点击提交，校验通过后更新状态并进入审批队列。',
      remarks: '提交后不可删除，待审核前可撤销。',
      drillDown: '无下钻页面。',
    },
    {
      nameZh: '再次提交',
      nameEn: 'Resubmit',
      description: `审批退回需修改材料后，在编辑表单内重新提交${moduleName}申请。`,
      interaction: '需修改材料状态下编辑后点击再次提交，校验通过后恢复待审核并追加日志。',
      remarks: '须响应审批意见中的修改要求。',
      drillDown: '无下钻页面。',
    },
    {
      nameZh: '选择附件',
      nameEn: 'Select Attachment',
      description: `在${moduleName}表单支持性文件分区选择并上传附件文件。`,
      interaction: '点击选择文件，选取符合大小限制的文件后随表单一并保存或提交。',
      remarks: '单文件不超过5兆字节；演示环境本地记录文件名。',
      drillDown:
        '下钻至浏览器系统「选择文件」对话框：位于表单弹窗支持性文件分区内，点击「选择文件/上传附件」按钮唤起本地文件选择器；选定后在同分区展示已选文件名列表，可移除重选，无独立上传弹窗页面。',
    },
    {
      nameZh: '关闭',
      nameEn: 'Close',
      description: '关闭表单弹窗或详情弹窗，返回申请列表。',
      interaction: '点击关闭或弹窗右上角关闭图标返回列表。',
      remarks: '未保存草稿时关闭不写入数据。',
      drillDown: '无下钻页面。',
    },
  ]
}

export function buildMovementButtons(moduleName) {
  const list = movementListButtons(moduleName)
  const form = movementFormButtons(moduleName)
  const formStart = list.length + 1
  const formEnd = list.length + form.length
  const ref = movementFormRef(moduleName, formStart, formEnd)
  list.find((b) => b.nameEn === 'New Application').drillDown = ref
  list.find((b) => b.nameEn === 'Edit').drillDown = ref
  return [...list, ...form]
}

/** 异动审批按钮 */
const approvalListButtons = [
  {
    nameZh: '查询',
    nameEn: 'Search',
    description: '按学年学期、专业代码、状态、学号、学生姓名五字段 inline 筛选当前 Tab 列表。',
    interaction: '填写后 Search；Reset 清空。',
    remarks: '已移除 Current approver role 与异动原因搜索。',
    drillDown: '无下钻页面。',
  },
  {
    nameZh: '重置',
    nameEn: 'Reset',
    description: '清空搜索区五字段，恢复当前视图全量列表。',
    interaction: '点击重置清空条件并回到第一页。',
    remarks: '与查询配对；切换视图不自动重置。',
    drillDown: '无下钻页面。',
  },
  {
    nameZh: '审批',
    nameEn: 'Review',
    description: '在待我审批视图对勾选的同类型、同环节记录批量填写审批结果。',
    interaction: '勾选后点击审批打开审批弹窗（MovementApprovalModal），选择通过/拒绝/需修改材料并填写意见。',
    remarks: '拒绝与需修改材料须填写办理意见；转专业教务核定字段在查看详情时填写。',
    drillDown: null,
  },
  {
    nameZh: '导出',
    nameEn: 'Export',
    description: '将当前视图经搜索过滤后的审批列表通过 ExportModal 导出为 xlsx，支持字段选择与三档范围。',
    interaction: '点击导出打开 ExportModal，选择字段与范围（当前页/全部/选中行）后确认导出；无数据时提示。',
    remarks: '默认列含状态/环节/学号/姓名/申请学年学期/生效学期/异动类别/申请日期；是否实施为可选列且导出 Y/N。',
    drillDown: `${EXPORT_MODAL_PAGE}弹窗内「确认导出」见维护/查询模块同类说明。`,
  },
  {
    nameZh: '查看',
    nameEn: 'View',
    description: 'ReviewView 只读详情；待我审批时 [审批] 打开 MovementApprovalModal。',
    interaction: 'View → ReviewView → [审批] → Modal → 返回列表。',
    remarks: '无内联 Submit Decision。',
    drillDown: null,
  },
  {
    nameZh: '流转日志',
    nameEn: 'Approval Log',
    description: '查看该条审批记录的完整流转历史表格。',
    interaction: '行内点击流转日志打开日志弹窗，关闭返回列表。',
    remarks: '只读；复用申请侧同一日志组件。',
    drillDown: APPROVAL_LOG_PAGE,
  },
  {
    nameZh: '撤回',
    nameEn: 'Recall',
    description: '在已处理历史视图中对已通过且尚未被下游处理的决策执行撤回，恢复为待审核。',
    interaction: '进入查看详情后点击撤回，确认后状态回退并移回待我审批视图。',
    remarks: '仅已通过且流程允许撤回时可用。',
    drillDown: `${REVIEW_VIEW_PAGE}撤回按钮位于全页详情底部操作区；点击后弹出确认对话框（ConfirmDialog），确认后将决策回退为待审核。`,
  },
]

const approvalFormButtons = [
  {
    nameZh: '确认审批',
    nameEn: 'Confirm Review',
    description: 'MovementApprovalModal 内确认批量或单条审批（含转专业教务核定）。',
    interaction: '选择结果与 Comment → Confirm → 写回 store。',
    remarks: 'Reject/Update Required 须 Comment。',
    drillDown: `${BATCH_REVIEW_PAGE}本按钮位于弹窗底部。`,
  },
]

export function buildApprovalButtons() {
  const list = [...approvalListButtons]
  const form = [...approvalFormButtons]
  const confirmReviewIdx = list.length + 1
  const recallIdx = list.findIndex((b) => b.nameEn === 'Recall') + 1
  list.find((b) => b.nameEn === 'Review').drillDown =
    `${BATCH_REVIEW_PAGE}弹窗内「确认审批」见本清单第${confirmReviewIdx}项。`
  list.find((b) => b.nameEn === 'View').drillDown =
    `${REVIEW_VIEW_PAGE}「确认审批」通过底部 [审批] 打开 Modal，见第${confirmReviewIdx}项；Recall 见第${recallIdx}项。`
  return [...list, ...form]
}

const CATEGORY_FORM_PAGE =
  '下钻至「异动类别表单弹窗」（MovementCategoryFormModal）：居中弹窗含双列基础字段区、实施行为三开关（开关右侧同行 hint 说明）、底部取消与保存按钮。'

const CATEGORY_REASON_PAGE =
  '下钻至「设置原因弹窗」（MovementCategoryReasonModal）：居中弹窗含原因列表表格（勾选、序号、原因名称、编辑）、分页器，工具栏含新增与删除；新增/编辑原因打开小弹窗填写原因名称。'

const MAINTENANCE_EDIT_PAGE =
  '下钻至「异动维护编辑弹窗」（MovementMaintenanceEditModal）：居中弹窗维护异动编号、备注、CGPA、预计毕业时间；转专业记录额外展示新学院/新专业字段，底部取消与保存。'

const MAINTENANCE_NUMBER_PAGE =
  '下钻至「修改异动编号弹窗」（MovementMaintenanceNumberModal）：居中弹窗列出勾选行学号、姓名与异动编号输入框，底部取消与保存。'

/** 异动类别配置按钮 */
export function buildCategoryButtons() {
  return [
    {
      nameZh: '查询',
      nameEn: 'Search',
      description: '按类别名称、类别编码、学籍状态组合筛选异动类别列表。',
      interaction: '填写条件后点击查询，列表回到第一页并展示匹配结果。',
      remarks: '与重置配对。',
      drillDown: '无下钻页面。',
    },
    {
      nameZh: '重置',
      nameEn: 'Reset',
      description: '清空搜索条件，恢复全量类别列表。',
      interaction: '点击重置后条件清空，列表回到第一页。',
      remarks: '—',
      drillDown: '无下钻页面。',
    },
    {
      nameZh: '新增',
      nameEn: 'Create',
      description: '创建异动类别行（categoryCode 唯一），四行双列表单含三实施开关。',
      interaction: '点击新增打开 MovementCategoryFormModal，保存写入列表。',
      remarks: '无 Student Type 维度；Category 全量下拉。',
      drillDown: CATEGORY_FORM_PAGE,
    },
    {
      nameZh: '编辑',
      nameEn: 'Edit',
      description: '修改单条类别配置，Student Type 只读不可改。',
      interaction: '行内点击编辑打开预填表单弹窗，保存更新该行。',
      remarks: '三实施开关按行独立配置。',
      drillDown: CATEGORY_FORM_PAGE,
    },
    {
      nameZh: '删除',
      nameEn: 'Delete',
      description: '批量删除勾选的类别配置行。',
      interaction: '勾选后点击删除，确认对话框确认后移除记录。',
      remarks: '演示环境不校验下游引用。',
      drillDown: `${CONFIRM_DIALOG_PAGE}提示即将删除所选类别行数。`,
    },
    {
      nameZh: '设置原因',
      nameEn: 'Set Reason',
      description: '为当前类别行维护异动原因列表。',
      interaction: '行内点击设置原因打开原因弹窗，可新增/编辑/删除原因。',
      remarks: '原因 scoped 于当前类别行。',
      drillDown: CATEGORY_REASON_PAGE,
    },
    {
      nameZh: '保存',
      nameEn: 'Save',
      description: '在类别表单弹窗内校验并保存基础字段与三实施开关。',
      interaction: '填写完毕点击保存，校验通过后关闭弹窗并刷新列表。',
      remarks: 'Cancel 关闭不保存。',
      drillDown: '无下钻页面。',
    },
    {
      nameZh: '新增原因',
      nameEn: 'Create Reason',
      description: '在设置原因弹窗内为当前类别新增一条异动原因。',
      interaction: '点击新增打开小弹窗填写原因名称后保存。',
      remarks: '原因名称必填。',
      drillDown: `${CATEGORY_REASON_PAGE}小弹窗仅含原因名称输入框与取消/保存。`,
    },
  ]
}

/** 学籍异动维护按钮 */
export function buildMaintenanceButtons() {
  const exportModalRef = `${EXPORT_MODAL_PAGE}弹窗内「确认导出」生成 xlsx 文件。`
  return [
    {
      nameZh: '查询',
      nameEn: 'Search',
      description: '按学年学期、专业代码、状态、学号、学生姓名筛选 Approved 列表。',
      interaction: '填写条件后点击查询，列表回到第一页。',
      remarks: '已移除异动原因搜索。',
      drillDown: '无下钻页面。',
    },
    {
      nameZh: '重置',
      nameEn: 'Reset',
      description: '清空搜索条件，恢复全量维护列表。',
      interaction: '点击重置清空条件并回到第一页。',
      remarks: '—',
      drillDown: '无下钻页面。',
    },
    {
      nameZh: '实施',
      nameEn: 'Implement',
      description: '将勾选的待实施（Pending）记录批量标记为已实施（Implemented）。',
      interaction: '勾选 Pending 行后点击实施，确认对话框确认后写回 store 并按类别配置回写档案。',
      remarks: '已 Implemented 行不可再次实施；自动实施行按钮不可用。',
      drillDown: `${CONFIRM_DIALOG_PAGE}提示即将标记 N 条记录为已实施。`,
    },
    {
      nameZh: '导出',
      nameEn: 'Export',
      description: 'ExportModal 导出维护列表 xlsx。',
      interaction: '选择字段与范围后确认下载。',
      remarks: '默认 15 列+9 可选。',
      drillDown: exportModalRef,
    },
    {
      nameZh: '删除',
      nameEn: 'Delete',
      description: '批量删除勾选 Approved 记录。',
      interaction: '勾选后删除，确认后移除。',
      remarks: '物理删除 mock。',
      drillDown: `${CONFIRM_DIALOG_PAGE}提示即将删除所选维护记录条数。`,
    },
    {
      nameZh: '详情',
      nameEn: 'Details',
      description: 'ReviewView 只读详情，敏感字段脱敏，无审批区。',
      interaction: '行内 Details → readonly ReviewView。',
      remarks: '无 Edit 行操作。',
      drillDown: `${REVIEW_VIEW_PAGE}mode=readonly。`,
    },
    {
      nameZh: '流转日志',
      nameEn: 'Approval Log',
      description: '查看该条记录的完整审批流转历史。',
      interaction: '行内点击流转日志打开 ApprovalLogModal。',
      remarks: '只读。',
      drillDown: APPROVAL_LOG_PAGE,
    },
    {
      nameZh: '确认导出',
      nameEn: 'Confirm Export',
      description: '在导出弹窗内确认字段与范围，生成 xlsx。',
      interaction: '选择字段与当前页/全部/选中行范围后点击确认导出。',
      remarks: '列头支持 i18n。',
      drillDown: exportModalRef,
    },
  ]
}

/** 学籍异动查询按钮 */
export function buildQueryButtons() {
  const exportModalRef = `${EXPORT_MODAL_PAGE}弹窗内「确认导出」生成 xlsx 文件。`
  return [
    {
      nameZh: '查询',
      nameEn: 'Search',
      description: '双行搜索：首行学年学期/专业代码/状态/异动类型，次行学号/姓名可收起。',
      interaction: '填写条件后点击查询，列表回到第一页。',
      remarks: '次行默认展开，可点击收起隐藏。',
      drillDown: '无下钻页面。',
    },
    {
      nameZh: '重置',
      nameEn: 'Reset',
      description: '清空全部搜索字段，恢复全量查询列表。',
      interaction: '点击重置清空条件并回到第一页。',
      remarks: '—',
      drillDown: '无下钻页面。',
    },
    {
      nameZh: '收起/展开',
      nameEn: 'Collapse/Expand',
      description: '切换次行搜索区（学号、学生姓名）的显示与隐藏。',
      interaction: '点击收起或更多按钮切换 searchExpanded 状态。',
      remarks: '默认展开次行。',
      drillDown: '无下钻页面。',
    },
    {
      nameZh: '导出',
      nameEn: 'Export',
      description: '通过 ExportModal 导出查询结果为 xlsx，支持字段选择与三档范围。',
      interaction: '点击导出打开弹窗，选择字段与范围后确认下载。',
      remarks: '无数据时 alert 提示。',
      drillDown: exportModalRef,
    },
    {
      nameZh: '详情',
      nameEn: 'Details',
      description: '只读查看异动申请全文，无 Edit 与审批操作。',
      interaction: '行内点击详情进入 ReviewView readonly 模式。',
      remarks: '—',
      drillDown: `${REVIEW_VIEW_PAGE}mode=readonly。`,
    },
    {
      nameZh: '流转日志',
      nameEn: 'Approval Log',
      description: '查看审批流转历史表格。',
      interaction: '行内点击流转日志打开 ApprovalLogModal。',
      remarks: '—',
      drillDown: APPROVAL_LOG_PAGE,
    },
    {
      nameZh: '确认导出',
      nameEn: 'Confirm Export',
      description: '在导出弹窗确认后生成 movement-query-日期.xlsx。',
      interaction: '选择字段与范围后点击确认导出触发下载。',
      remarks: '与维护页共用 exportMovementQueryExcel 逻辑。',
      drillDown: exportModalRef,
    },
  ]
}

const CONSENT_FORM_MODAL =
  '下钻至「知情同意书表单弹窗」（ConsentFormFormModal）：居中弹窗含名称、适用异动类别、Student Type、Remark、学生/家长附件上传，底部取消与保存。'

const CONSENT_VIEW_MODAL =
  '下钻至「知情同意书查看弹窗」（ConsentFormViewModal）：只读展示模板字段与附件文件名。'

/** 知情同意书配置按钮 */
export function buildConsentButtons() {
  return [
    {
      nameZh: '查询',
      nameEn: 'Search',
      description: '按适用异动类别、知情同意书名称、Student Type 筛选列表。',
      interaction: '填写后 Search；Reset 清空。',
      remarks: '—',
      drillDown: '无下钻页面。',
    },
    {
      nameZh: '重置',
      nameEn: 'Reset',
      description: '清空搜索条件。',
      interaction: 'Reset 恢复全量列表。',
      remarks: '—',
      drillDown: '无下钻页面。',
    },
    {
      nameZh: '新增',
      nameEn: 'Create',
      description: '创建知情同意书模板，(movementType+studentType) 须唯一。',
      interaction: 'Create 打开 ConsentFormFormModal，上传附件后 Save。',
      remarks: '学生知情同意书必填。',
      drillDown: CONSENT_FORM_MODAL,
    },
    {
      nameZh: '编辑',
      nameEn: 'Edit',
      description: '修改已有模板与附件。',
      interaction: '行内 Edit 打开预填 Modal。',
      remarks: '唯一性校验排除当前行。',
      drillDown: CONSENT_FORM_MODAL,
    },
    {
      nameZh: '查看',
      nameEn: 'View',
      description: '只读查看模板详情。',
      interaction: '行内 View 打开 ConsentFormViewModal。',
      remarks: '—',
      drillDown: CONSENT_VIEW_MODAL,
    },
    {
      nameZh: '删除',
      nameEn: 'Delete',
      description: '批量删除勾选模板。',
      interaction: '勾选 Delete → ConfirmDialog → 移除。',
      remarks: '—',
      drillDown: `${CONFIRM_DIALOG_PAGE}提示删除条数。`,
    },
    {
      nameZh: '保存',
      nameEn: 'Save',
      description: 'Modal 内校验并保存模板。',
      interaction: 'Save 校验唯一性与必填附件后写入 consentForms。',
      remarks: '—',
      drillDown: '无下钻页面。',
    },
  ]
}
