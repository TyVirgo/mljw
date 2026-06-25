import {
  toFieldRows,
  profileFormFieldEntries,
  transferFormFieldEntries,
  defermentFormFieldEntries,
  resumptionFormFieldEntries,
  withdrawalFormFieldEntries,
  approvalFormFieldEntries,
} from './prd-fields.mjs'

export const profileListFields = [
  ['1', '序号', 'No.', '序号', '—', '—', '分页自动编号', '否', ''],
  ['2', '学号', 'Student ID', '文本', '是', '唯一；最大 20 字符', '主键；Import 重复跳过', '否', 'XMUM2309001'],
  ['3', '学生姓名', 'Student Name', '文本', '是', '最大 100 字符', '列表与表单 fullName 映射', '否', 'Tan Wei Ming'],
  ['4', '中文名', 'Chinese Name', '文本', '否', '最大 50 字符', 'Basic Info Tab', '否', '陈小明'],
  ['5', '学生类别', 'Student Type', '枚举', '是', '必选', 'Local / China / International', '是', 'Local'],
  ['6', '性别', 'Gender', '枚举', '否', '—', '代码集 Gender', '是', 'Male'],
  ['7', '专业代码', 'Programme Code', '文本', '否', '最大 20 字符', 'Enrollment Tab', '否', 'SE'],
  ['8', '专业', 'Programme', '文本', '否', '最大 100 字符', '基础数据 Programme', '否', 'Bachelor of Software Engineering'],
  ['9', '入学批次', 'Intake', '文本', '否', '—', '格式 YYYY/MM', '否', '2023/09'],
  ['10', '学籍状态', 'Student Status', '枚举', '否', '—', 'Active / Deferred / Withdrawn', '是', 'Active'],
]

export const profileFormFields = toFieldRows(profileFormFieldEntries)

export const profileSearchFields = [
  ['1', '学号', 'Student ID', '文本', '否', '模糊匹配', '—', '否', ''],
  ['2', '学生姓名', 'Student Name', '文本', '否', '模糊匹配', '—', '否', ''],
  ['3', '学生类别', 'Student Type', '下拉', '否', '—', 'Local/China/International', '是', ''],
]

export const transferListFields = [
  ['1', '申请编号', 'Application ID', '文本', '—', '—', 'TRFxxx', '否', 'TRF001'],
  ['2', '学号', 'Student ID', '文本', '是', '须存在档案', '联动 students', '否', 'XMUM2309001'],
  ['3', '姓名', 'Name', '文本', '—', '—', '联动', '否', ''],
  ['4', '类型', 'Type', '文本', '—', '—', 'Programme Transfer', '否', ''],
  ['5', '原专业', 'Old Programme', '文本', '—', '—', 'currentProgramme', '否', ''],
  ['6', '新专业', 'New Programme', '文本', '—', '—', 'adminNewProgramme 优先', '否', ''],
  ['7', '状态', 'Status', '枚举', '—', '—', '7 态含 Expired', '是', 'In Progress'],
  ['8', '日期', 'Date', '日期', '—', '—', 'submittedAt；YYYY-MM-DD', '否', '2025-09-20'],
]

export const transferFormFields = toFieldRows(transferFormFieldEntries)

export const defermentListFields = [
  ['1', '申请编号', 'Application ID', '文本', '—', '—', 'DEF 前缀', '否', 'DEF001'],
  ['2', '学号', 'Student ID', '文本', '是', '须存在档案', '列表列', '否', 'XMUM2309001'],
  ['3', '姓名', 'Name', '文本', '—', '—', '列表列', '否', ''],
  ['4', '入学批次', 'Intake', '文本', '—', '—', '列表列', '否', '2023/09'],
  ['5', '专业', 'Programme', '文本', '—', '—', '列表列', '否', ''],
  ['6', '休学期间', 'Deferment Period', '文本', '—', '—', 'YYYY/MM', '否', '2025/09'],
  ['7', '原因', 'Reason', '文本', '—', '—', 'mainReason 摘要', '是', 'Health Issue'],
  ['8', '状态', 'Status', '枚举', '—', '—', '6 态生命周期', '是', 'In Progress'],
  ['9', '日期', 'Date', '日期', '—', '—', 'submittedAt；YYYY-MM-DD', '否', '2025-09-20'],
]

export const defermentFormFields = toFieldRows(defermentFormFieldEntries)

export const resumptionListFields = [
  ['1', '申请编号', 'Application ID', '文本', '—', '—', 'RESxxx', '否', ''],
  ['2', '学号', 'Student ID', '文本', '是', '—', '—', '否', ''],
  ['3', '原入学批次', 'Original Intake', '文本', '—', '—', '—', '否', ''],
  ['4', '复学批次', 'Resume Intake', '文本', '—', '—', 'resumptionSemester', '否', ''],
  ['5', '状态', 'Status', '枚举', '—', '—', '6 态', '是', ''],
]

export const resumptionFormFields = toFieldRows(resumptionFormFieldEntries)

export const withdrawalListFields = [
  ['1', '申请编号', 'Application ID', '文本', '—', '—', 'WDRxxx', '否', ''],
  ['2', '学号', 'Student ID', '文本', '是', '—', '—', '否', ''],
  ['3', '退学原因', 'Reason', '文本', '—', '—', 'mainReason 摘要', '是', ''],
  ['4', '状态', 'Status', '枚举', '—', '—', '6 态', '是', ''],
]

export const withdrawalFormFields = toFieldRows(withdrawalFormFieldEntries)

export const approvalListFields = [
  ['1', '状态', 'Status', '枚举', '—', '—', 'pill Badge；Draft 不在队列', '是', 'In Progress'],
  ['2', '审批环节', 'Approval Stage', '文本', '—', '—', 'workflow 节点', '否', 'Pending Review'],
  ['3', '是否实施', 'Implemented', '枚举', '—', '—', '仅已处理历史 Tab 显示；Y/N（Implemented→Y）', '是', 'N'],
  ['4', '学号', 'Student ID', '文本', '—', '—', '—', '否', ''],
  ['5', '学生姓名', 'Student Name', '文本', '—', '—', '—', '否', ''],
  ['6', '申请学年学期', 'Application Academic Session', '文本', '—', '—', 'applicationSession；YYYY/MM', '否', '2023/09'],
  ['7', '生效学期', 'Effective Session', '文本', '—', '—', 'formatEffectiveSession；YYYY/MM', '否', '2025/09'],
  ['8', '异动类别', 'Movement Category', '枚举', '—', '—', '四异动', '是', 'Deferment'],
  ['9', '申请日期', 'Application Date', '日期', '—', '—', 'YYYY-MM-DD', '否', '2025-09-20'],
]

export const approvalSearchFields = [
  ['1', '学年学期', 'Academic Session', '文本', '否', '模糊', 'applicationSession', '否', ''],
  ['2', '专业代码', 'Programme Code', '文本', '否', '模糊', 'programmeCode', '否', ''],
  ['3', '状态', 'Status', '下拉', '否', '—', '6 态', '是', ''],
  ['4', '学号', 'Student ID', '文本', '否', '模糊', '—', '否', ''],
  ['5', '学生姓名', 'Student Name', '文本', '否', '模糊', '—', '否', ''],
]

export const profileDataFlow = {
  explanation:
    '列表页支持新增、删除、修改、查询、导入、导出、查看详情等操作。新建与编辑在右侧抽屉（StudentProfileFormDrawer）中按七个页签依次维护档案信息，前端按学生类别（本地生/中国学生/国际生）分支校验必填项与字段显隐，校验通过后写入学生档案存储（students）；列表列由规范化函数从完整档案对象派生展示。详情以相同七页签结构只读渲染。导入解析标准表格模板，校验学号全局唯一与类别分支规则后批量入库，重复学号跳过并汇总提示。导出通过穿梭框选择字段与三档范围生成表格文件。删除批量移除勾选记录并刷新分页。学号作为主编码供四类异动申请联动读取学生快照。当前为纯前端演示，无后端接口；任一写操作成功后列表即时刷新。',
  preconditions:
    '基础数据专业、入学批次、学院等已在系统或演示数据中预置；新建档案须先选择学生类别并满足对应分支校验（如本地生必填身份证号，中国学生/国际生按护照规则）。导入须使用标准模板且列头与系统字段映射一致。异动申请前对应学号须已存在于学生基本信息中。',
  downstream:
    '学生基本信息作为四类学籍异动申请的主数据源，申请表单选择学号后自动带出姓名、专业、批次等快照。审批模块通过后回写档案（学籍状态、专业、批次等）为后续扩展点。导出结果供教务线下核对与归档。',
}

export const movementAppDataFlow = {
  explanation:
    '学籍异动申请通过侧边栏「学籍异动申请（老师）」与「学籍异动申请（学生）」两个入口进入同一 Tab 壳层（StudentMovementApplicationView），页顶水平 Tab 切换转专业/休学/复学/退学（默认休学），各 Tab 嵌入对应 View 维护列表与表单弹窗。四类数据分别存入 movementStore 四个集合，与审批模块共享存储。搜索区双行布局（MovementApplicationSearchBar）：老师入口首行含学号或姓名关键字、专业代码、申请学年学期、状态（含 Draft）；学生入口隐藏关键字；次行（可收起）为是否实施（全部/待实施/已实施/—）。老师入口列表展示学号、姓名列；学生入口隐藏两列。Section I 学号与姓名同行，老师新建时行末「选择」打开 StudentSelectModal；只读联动字段灰底。Section I 末「申请学年学期」（applicationSession）只读 YYYY/MM：选学生后写入 enrollment.intake；新建未选学生为空。转专业 Section VII 教务核定三字段申请侧 disabled 置灰。转专业原因改为下拉，选项来自 PT001 类别 reasons，存 reasonId。休学/退学主要原因下拉来自对应类别配置。列表日期 YYYY-MM-DD；生效学期列 YYYY/MM。详情纯只读无审批区；流转日志独立弹窗。',
  preconditions:
    '学号须存在于学生基本信息；提交须满足各分区必填、声明与附件；同一异动类型下该学号无其他非终态申请。知情同意书模板按 movementType+studentType 解析下载（resolveConsentTemplate）。',
  downstream:
    '非 Draft 记录进入学籍异动审批三视图（待我审批→已提交→已处理历史）；审批写回后申请 Tab 同步刷新。',
}

export const defermentDataFlow = {
  explanation:
    '休学页签列表展示以休学编号前缀标识的申请记录，数据存入休学集合（deferments）。表单弹窗含第一分区学生信息联动、第二分区休学期间与原因、第三分区家长联系信息及支持性文件附件区。保存草稿/提交/撤销/再次提交逻辑与转专业一致，国际生审批流程含国际学生事务办公室节点。详情只读展示各分区与附件只读组件，无审批区。操作写回休学集合并触发审批队列合并刷新。',
  preconditions: '学号有效且学籍状态允许休学申请；提交须填写休学期间、主要原因、详细原因、家长信息与附件。',
  downstream: '进行中的休学申请进入审批队列；通过后可更新档案学籍状态为休学（后续扩展）；复学申请可引用已批准休学学期。',
}

export const resumptionDataFlow = {
  explanation:
    '复学页签列表展示以复学编号前缀标识的记录，数据存入复学集合（resumptions）。表单弹窗含学生联动、休学/复学学期选择、双声明勾选及支持性文件。提交校验声明与附件后进入待审核。详情只读；编辑/删除/撤销规则同其他异动类型。写回复学集合并同步审批队列。',
  preconditions: '学号有效；通常须存在已批准休学记录；提交须勾选双声明并上传附件。',
  downstream: '通过的复学申请可驱动档案学籍状态恢复在读及复学批次更新（后续扩展）；与休学记录形成配对流转。',
}

export const withdrawalDataFlow = {
  explanation:
    '退学页签列表展示以退学编号前缀标识的记录，数据存入退学集合（withdrawals）。表单弹窗含学生信息、离校日期与原因（国际生显示国际学生事务办公室提示）、家长信息及支持性文件。六态生命周期与共享异动存储同步机制同其他异动。详情只读无审批；撤销仅限待审核前。',
  preconditions: '学号有效；提交须填写最后在校日期、主要原因、详细原因、家长信息与附件。',
  downstream: '通过的退学申请可更新档案学籍状态为退学（后续扩展）；已处理历史可撤回上一笔通过决策。',
}

export const profileBusinessFlow =
  '进入【学籍管理】→【学籍管理】→【学生基本信息】→ 填写搜索条件后查询或重置 → 点击新增打开七页签抽屉填写并保存 → 或行内编辑/详情查看 → 勾选后批量删除 → 导入下载模板并上传文件 → 导出选择字段与范围 → 列表自动刷新。'

export const transferBusinessFlow =
  '进入【学籍异动】→【学籍异动申请（老师|学生）】→ 切换页内 Tab【转专业】→ 双行搜索查询或重置 → 老师入口可关键字筛选学号/姓名 → 新建申请（老师可选学生）→ 保存草稿或提交 → 详情只读 → 流转日志 → 审批在【学籍异动审批】完成。'

export const defermentBusinessFlow =
  '进入【学籍异动】→【学籍异动申请（老师|学生）】→ 切换【休学】Tab → 搜索筛选 → 新建申请 → 保存草稿或提交 → 详情/流转日志 → 草稿可编辑/删除，待审核前可撤销。'

export const resumptionBusinessFlow =
  '进入【学籍异动申请】→【复学】Tab → 搜索筛选 → 新建申请 → 选择休学/复学学期 → 提交 → 详情/流转日志。'

export const withdrawalBusinessFlow =
  '进入【学籍异动申请】→【退学】Tab → 搜索筛选 → 新建申请 → 提交 → 详情/流转日志 → 审批在【学籍异动审批】完成。'

export const approvalDataFlow = {
  explanation:
    '审批页合并四类异动非 Draft 记录，按 DEFAULT_APPROVER_ROLE（Pending Review）分桶至待我审批、已提交、已处理历史三视图（Tab 顺序：待我审批→已提交→历史；仅待我审批显示角标）。搜索五字段标签与输入框同行（list-page-search.css）：学年学期、专业代码、状态、学号、学生姓名。列表展示状态 Badge、审批环节、学号、姓名、申请/生效学期（YYYY/MM）、异动类别、申请日期（YYYY-MM-DD）；已处理历史 Tab 额外显示是否实施 Y/N 列；不含异动原因列。待我审批支持批量审批（MovementApprovalModal）；查看进入 MovementApprovalReviewView 嵌入只读 DetailModal，底部 [审批] 打开 Modal（无内联审批表单）。导出 ExportModal xlsx；流转日志日期 YYYY-MM-DD。',
  preconditions:
    'Draft 不在队列；批量审批须同 sourceKey 且同 approvalStage；转专业 Dean/HoP 教务核定在 MovementApprovalModal 填写。',
  downstream:
    '决策写回申请存储与流转日志；autoImplement 决定初始实施状态；Recall 恢复待审核。',
}

export function movementAppButtons(moduleName) {
  return [
    {
      nameZh: '查询',
      nameEn: 'Search',
      description: `${moduleName}申请列表页顶部搜索区支持按学号或姓名关键字筛选当前 Tab 下的全部申请记录，筛选结果即时作用于列表与分页。`,
      interaction:
        '用户在搜索框输入 Student ID 或 Name 关键字 → 点击 Search 按钮 → 系统将 appliedSearch 更新并回到第 1 页 → 列表仅展示匹配记录；点击 Reset 清空搜索条件并恢复全量列表，同时清空行勾选状态。',
      remarks: '搜索为前端模糊匹配；与 Tab 切换独立，切换 Tab 后搜索条件保留直至 Reset。',
    },
    {
      nameZh: '新建申请',
      nameEn: 'New Application',
      description: `在${moduleName} Tab 列表页创建一条新的学籍异动申请。Form Modal 按 Section 分区组织：Section I 选择 Student ID 后自动联动姓名、NRIC/护照、现专业等只读字段；后续 Section 填写业务字段、声明与附件。`,
      interaction:
        '点击 New Application → 弹出 Form Modal → Section I 选择/输入 Student ID 触发联动 → 依次填写 Section II–III（及 Documents）→ 底部点击 Save Draft 暂存为 Draft 状态，或点击 Submit 校验通过后提交为 In Progress 并进入 Pending Review 审批环节 → 关闭 Modal 后列表自动刷新显示新记录。',
      remarks: '同一 studentId 在同一异动类型下仅允许一条非终态申请；Submit 须满足必填、声明勾选与附件规则；Form 内不提供审批操作。',
    },
    {
      nameZh: '详情',
      nameEn: 'Details',
      description: `以只读方式查看${moduleName}申请的完整内容，按与 Form 相同的 Section 结构展示全部字段与附件，不含审批表单与内嵌流转日志。`,
      interaction:
        '在列表行点击 Details → 打开 DetailModal（或 Detail 视图）→ 逐 Section 只读浏览申请全文 → MovementAttachmentReadonly 展示已上传附件 → 点击 Close 关闭返回列表。',
      remarks: 'Details 为纯只读，不提供 Approve/Reject 操作；审批须在【学籍异动审批】模块完成；不展示 approvalStage 编辑控件。',
    },
    {
      nameZh: '编辑',
      nameEn: 'Edit',
      description: `修改${moduleName}草稿或需补充材料的申请。仅 status 为 Draft 或 Update Required 的记录显示 Edit 按钮；In Progress 且非 Update Required 时不可编辑。`,
      interaction:
        '点击 Edit → Form Modal 以当前记录数据预填各 Section → 修改字段后 Save Draft 保持 Draft，或 Resubmit（Update Required 场景）校验后重新提交为 In Progress → 关闭 Modal 列表刷新。',
      remarks: 'Edit 不可修改 Student ID；Resubmit 会追加 approvalLog 记录；已进入后续审批节点的 In Progress 记录不可 Edit。',
    },
    {
      nameZh: '删除',
      nameEn: 'Delete',
      description: `永久删除${moduleName} Tab 下的 Draft 草稿申请，已提交记录不可删除。`,
      interaction: '列表行点击 Delete → 弹出 Confirm 确认框 → 确认后从对应 store ref 移除记录 → 列表与 Tab 计数刷新。',
      remarks: '仅 Draft 状态可 Delete；In Progress 及终态记录须使用 Cancel 或等待审批结果。',
    },
    {
      nameZh: '撤销申请',
      nameEn: 'Cancel',
      description: `撤销已提交但尚未进入后续审批节点的${moduleName}申请，将 status 变更为 Cancelled。`,
      interaction:
        '列表行点击 Cancel → Confirm 确认 → status 置为 Cancelled，approvalStage 清空或置终态 → 记录从审批 Pending 队列移除 → 列表刷新。',
      remarks: '仅 Pending Review 阶段且尚未被审批人处理时可 Cancel；已进入 Dean/HoP 等后续节点后不可撤销。',
    },
    {
      nameZh: '流转日志',
      nameEn: 'Approval Log',
      description: `查看${moduleName}申请从提交至当前状态的全部审批流转历史，含操作人、时间、决策与 Comment。`,
      interaction:
        '列表行点击 Approval Log → 打开 ApprovalLogModal → 表格展示 approvalLog 各条记录（时间、操作、审批环节、结果、备注）→ 点击 Close 关闭。',
      remarks: '各 status 均可查看 Log；Log 为只读；与 Details 分离，Details 不含内嵌 Log 区域。',
    },
    {
      nameZh: '保存草稿',
      nameEn: 'Save Draft',
      description: `在 Form Modal 内暂存${moduleName}申请为 Draft，不触发审批流程。`,
      interaction: 'Form Modal 内填写部分字段 → 点击 Save Draft → 校验基础格式（非 Submit 全量校验）→ status=Draft 写入 store → 关闭 Modal 列表显示 Draft 记录。',
      remarks: 'Draft 可反复 Edit/Delete；不生成 approvalLog；不进入审批队列。',
    },
    {
      nameZh: '提交',
      nameEn: 'Submit',
      description: `在 Form Modal 内正式提交${moduleName}申请，进入 In Progress 与 Pending Review 审批流程。`,
      interaction:
        'Form 填写完毕 → 点击 Submit → 前端校验 Section 必填、声明与附件 → 通过后 status=In Progress、approvalStage=Pending Review → 追加首条 approvalLog → 关闭 Modal → 申请 Tab 与审批队列同步刷新。',
      remarks: 'Submit 后不可 Delete，仅 Pending Review 前可 Cancel；同 studentId 并发非终态申请会被拦截。',
    },
    {
      nameZh: '再次提交',
      nameEn: 'Resubmit',
      description: `审批退回 Update Required 后，学生/教务修改材料并重新提交${moduleName}申请。`,
      interaction:
        'Update Required 记录点击 Edit → 修改 Form 字段 → 点击 Resubmit → 校验通过 → status 恢复 In Progress、approvalStage 回到 Pending Review → 追加 log → 重新进入审批队列。',
      remarks: 'Resubmit 须响应审批 Comment 中要求的修改项；仅 Update Required 状态可用。',
    },
  ]
}

export const profileButtons = [
  {
    nameZh: '查询',
    nameEn: 'Search',
    description:
      '按学号、学生姓名（含中文名）、学生类别三个条件组合筛选学生档案列表，支持模糊匹配。',
    interaction:
      '搜索区填写 Student ID / Student Name / Student Type → 点击 Search → appliedSearch 更新、回到第 1 页、清空勾选 → 列表展示筛选结果。',
    remarks: 'Student Name 同时匹配 name 与 nameCn 字段；与 Reset 配对使用。',
  },
  {
    nameZh: '重置',
    nameEn: 'Reset',
    description: '清空搜索区全部条件，恢复展示全量学生档案列表。',
    interaction: '点击 Reset → searchForm 与 appliedSearch 恢复空值 → 回到第 1 页 → 清空 selectedIds。',
    remarks: '不影响已打开 Drawer/Modal。',
  },
  {
    nameZh: '新增',
    nameEn: 'Create',
    description:
      '创建新学生档案。右侧 Drawer 分七个 Tab：Basic Info（含 Category 与证件分支）、Enrollment、Contact、Education、Family、Accommodation、Others，校验通过后写入 students 存储。',
    interaction:
      '点击 Create → 打开 StudentProfileFormDrawer（create 模式）→ 先选 Student Category 决定字段显隐 → 逐 Tab 填写 → 点击 Save 校验并入库 → Drawer 关闭 → 列表刷新显示新记录。',
    remarks: 'Category 决定 Local/China/International 校验规则；Photo 支持 jpg/png base64 预览；学号全局唯一。',
  },
  {
    nameZh: '删除',
    nameEn: 'Delete',
    description: '批量删除列表中勾选的一条或多条学生档案记录。',
    interaction:
      '勾选列表行 checkbox（可全选当前页）→ 点击 Delete → ConfirmDialog 确认 → 从 students 移除 → 刷新列表与勾选状态。',
    remarks: '未勾选时 Delete 按钮禁用；当前 Mock 不校验下游异动引用。',
  },
  {
    nameZh: '导入',
    nameEn: 'Import',
    description: '通过 Excel 模板批量导入学生档案，支持下载标准模板与上传校验入库。',
    interaction:
      '点击 Import → 打开 StudentProfileImportModal → 下载模板 → 填写后上传 Excel → 系统解析校验学号唯一与 Category 分支规则 → 成功记录入库、重复学号跳过 → 关闭 Modal 列表刷新并展示导入摘要。',
    remarks: '须使用系统提供的 export 字段映射模板；失败行给出错误原因。',
  },
  {
    nameZh: '导出',
    nameEn: 'Export',
    description: '按用户选择的字段集合与数据范围导出学生档案 Excel 文件。',
    interaction:
      '点击 Export → 打开 ExportModal 穿梭框选择字段 → 选择范围（当前页/全部/选中）→ Confirm → 调用 exportStudentProfilesToExcel 生成并下载 .xlsx。',
    remarks: '字段列表来自 studentProfileExportFields；支持 i18n 列头。',
  },
  {
    nameZh: '详情',
    nameEn: 'Details',
    description:
      '只读查看学生完整档案，与 Form Drawer 相同的七 Tab 结构展示全部字段与照片，不可编辑。',
    interaction:
      '列表行点击 Details → 打开 StudentProfileDetailDrawer → 切换 Basic Info / Enrollment / Contact / Education / Family / Accommodation / Others Tab 浏览 → Close 关闭返回列表。',
    remarks: '纯只读；不提供 Export PDF（后续可扩展）。',
  },
  {
    nameZh: '编辑',
    nameEn: 'Edit',
    description: '修改已有学生档案，Drawer 结构与新增一致，学号字段只读不可改。',
    interaction:
      '列表行点击 Edit → StudentProfileFormDrawer（edit 模式）预填七 Tab 数据 → 修改后 Save → 校验入库 → Drawer 关闭列表刷新。',
    remarks: 'Student ID 创建后不可变更；Category 变更可能触发字段显隐切换。',
  },
  {
    nameZh: '保存',
    nameEn: 'Save',
    description: '在 Create/Edit Drawer 内校验并保存学生档案全部七 Tab 字段至 students 存储。',
    interaction:
      'Form Drawer 内逐 Tab 填写 → 点击 Save → validateStudentForm 按 Category 分支校验 → 通过后写入/更新记录 → Drawer 关闭 → 列表刷新。',
    remarks: 'Local 必填 IC No.；China/Intl 校验护照相关字段显隐；学号全局唯一。',
  },
  {
    nameZh: '取消',
    nameEn: 'Cancel',
    description: '关闭 Create/Edit Drawer 不保存未提交更改。',
    interaction: 'Drawer 内点击 Cancel 或右上角 × → 关闭 Drawer 返回列表，不写入数据。',
    remarks: '不影响列表已有数据。',
  },
]

export const approvalButtons = [
  {
    nameZh: '查询',
    nameEn: 'Search',
    description:
      '审批列表页搜索区支持学年学期、异动原因、状态、学号、学生姓名五字段组合筛选，标签与输入框同一行展示（inline 布局）。',
    interaction:
      '填写搜索字段 → Search → appliedSearch 更新、回到第 1 页 → 当前 Tab（Submitted/Pending/History）列表按条件过滤；Reset 清空全部条件恢复 Tab 全量数据。',
    remarks: '搜索作用于当前 activeTab 桶内数据；不跨 Tab 联合搜索。',
  },
  {
    nameZh: '重置',
    nameEn: 'Reset',
    description: '清空审批搜索区五字段，恢复当前 Tab 全量列表。',
    interaction: '点击 Reset → searchForm/appliedSearch 清空 → 第 1 页 → 清空 selectedKeys。',
    remarks: '与 Search 配对；切换 Tab 不自动 Reset。',
  },
  {
    nameZh: '审批',
    nameEn: 'Review',
    description:
      'Pending Tab 下对勾选的一条或多条待审记录进行批量审批决策，须同属一种异动类型且 approvalStage 一致。',
    interaction:
      'Pending Tab 勾选行 → 点击 Review → 打开 MovementApprovalModal → 选择 Approved / Rejected / Update Required → 填写 Comment（Reject/Update Required 必填）→ Confirm → applyMovementDecision 写回 store → Modal 关闭 → 列表与申请 Tab 同步刷新。',
    remarks: 'canBatchApproveSelection 校验 sourceKey 与 stage 一致性；转专业 Dean/HoP 节点须先 View 填写 Section VII。',
  },
    {
      nameZh: '导出',
      nameEn: 'Export',
      description: '将当前 Tab 经搜索过滤后的审批列表通过 ExportModal 导出为 xlsx 文件，支持字段选择与三档范围。',
      interaction: '点击 Export → 打开 ExportModal 穿梭框选择字段与范围（当前页/全部/选中行）→ 确认导出 → 若无数据则 alert 提示 → 否则生成 xlsx 并下载。',
      remarks: '默认列含状态/环节/学号/姓名/申请学年学期/生效学期/异动类别/申请日期；是否实施为可选列且导出 Y/N；日期列 YYYY-MM-DD。',
    },
  {
    nameZh: '查看',
    nameEn: 'View',
    description:
      '进入全页审批详情视图 MovementApprovalReviewView，嵌入对应异动类型的 DetailModal 只读区；Pending 模式下底部含审批操作表单，History 模式下 Approved 记录可 Recall。',
    interaction:
      '列表行点击 View → viewMode 切换为 review → ReviewView 展示 Section 只读内容 + 附件 → Pending 时填写审批结果与 Comment（及转专业 Section VII）→ Submit 决策或 Close 返回列表；History 且 Approved 时显示 Recall 按钮。',
    remarks: 'View 为审批专属入口，与申请侧 Details 分离；Recall 仅当后续节点未处理时可执行。',
  },
  {
    nameZh: '流转日志',
    nameEn: 'Approval Log',
    description: '查看该审批记录的完整 approvalLog 流转历史表格。',
    interaction: '列表行点击 Approval Log → ApprovalLogModal 展示 log 表格 → Close 返回列表。',
    remarks: '各 Tab 均可查看；Log 只读；复用申请侧同一组件。',
  },
  {
    nameZh: '撤回',
    nameEn: 'Recall',
    description: 'History Tab 中对已 Approved 且尚未被下游节点处理的决策执行撤回，恢复为 Pending Review 待审状态。',
    interaction:
      'History Tab → View 进入 ReviewView → 点击 Recall → Confirm 确认 → status/stage 回退 → 追加 Recall log → 记录移回 Pending Tab。',
    remarks: '仅 Approved 且 workflow 允许 Recall 时可用；Reject 不可 Recall。',
  },
]

export const movementSearchField = [['1', '学号或姓名', 'Student ID or Name', '文本', '否', '模糊', '仅老师入口首行', '否', '']]

/** 异动申请搜索（老师/学生双入口；次行是否实施可收起） */
export const movementApplicationSearchFields = [
  ['1', '学号或姓名', 'Student ID or Name', '文本', '否', '模糊', '仅老师入口首行', '否', ''],
  ['2', '专业代码', 'Programme Code', '文本', '否', '模糊', '首行', '否', 'SE'],
  ['3', '申请学年学期', 'Application Academic Session', '文本', '否', '模糊', '首行；YYYY/MM', '否', '2023/09'],
  ['4', '审批状态', 'Status', '下拉', '否', '—', '首行；含 Draft', '是', ''],
  ['5', '是否实施', 'Implemented', '下拉', '否', '—', '次行可收起；全部/待实施/已实施/—', '是', ''],
]

/** 维护/查询列表共用 15 个数据列（不含勾选与操作列；横向滚动，Actions sticky） */
export const movementWideListFields = [
  ['1', '序号', 'No.', '序号', '—', '—', '分页自动编号', '否', ''],
  ['2', '状态', 'Status', '枚举', '—', '—', 'pill Badge；查询全态含 Expired；维护仅 Approved', '是', 'Approved'],
  ['3', '审批环节', 'Approval Stage', '文本', '—', '—', 'workflow 节点', '否', '已通过'],
  ['4', '是否实施', 'Implemented', '枚举', '—', '—', '列表与导出显示 Y/N（Pending→—）', '是', 'N'],
  ['5', '学号', 'Student ID', '文本', '—', '—', '—', '否', 'XMUM2309001'],
  ['6', '学生姓名', 'Student Name', '文本', '—', '—', '—', '否', 'Tan Wei Ming'],
  ['7', '异动日期', 'Movement Date', '日期', '—', '—', 'movementDate；YYYY-MM-DD', '否', '2025-09-29'],
  ['8', 'Passport/IC', 'Passport Number / IC', '文本', '—', '—', '列表脱敏 maskPassportIc', '否', '900***001'],
  ['9', '学生类型', 'Student Type', '枚举', '—', '—', 'Local/Chinese/International；中文「中国」', '是', 'Local'],
  ['10', 'Intake', 'Intake', '文本', '—', '—', '入学批次；YYYY/MM', '否', '2024/02'],
  ['11', '申请学年学期', 'Application Academic Session', '文本', '—', '—', 'applicationSession；YYYY/MM', '否', '2024/02'],
  ['12', '生效学期', 'Effective Session', '文本', '—', '—', '按类型映射；YYYY/MM', '否', '2025/09'],
  ['13', '异动类别', 'Movement Category', '枚举', '—', '—', '四异动类型', '是', '休学'],
  ['14', '异动原因', 'Movement Reason', '文本', '—', '—', '摘要', '否', ''],
  ['15', '预计毕业时间', 'Expected Graduation Time', '文本', '—', '—', '维护字段；非 Approved 多为 —', '否', ''],
]

/** 查询/维护导出可选扩展列（默认未勾选，维护页导出亦可选） */
export const movementQueryOptionalExportFields = [
  ['1', '现学院', 'Current School', '文本', '—', '—', '导出可选', '否', ''],
  ['2', '现专业代码', 'Current Programme Code', '文本', '—', '—', '导出可选', '否', ''],
  ['3', '新学院', 'New School', '文本', '—', '—', '导出可选；转专业适用', '否', ''],
  ['4', '新专业代码', 'New Programme Code', '文本', '—', '—', '导出可选', '否', ''],
  ['5', '新专业名称', 'New Programme Name', '文本', '—', '—', '导出可选', '否', ''],
  ['6', '英文名', 'English Name', '文本', '—', '—', '导出可选', '否', ''],
  ['7', 'CGPA', 'CGPA', '文本', '—', '—', '导出可选', '否', ''],
  ['8', '异动编号', 'Movement Number', '文本', '—', '—', '导出可选', '否', 'MV2025001'],
  ['9', '备注', 'Remark', '文本', '—', '—', '导出可选', '否', ''],
]

export const categoryListFields = [
  ['1', '序号', 'No.', '序号', '—', '—', '分页自动编号', '否', ''],
  ['2', '类别编码', 'Category Code', '文本', '是', '全局唯一', 'PT001/DEF001/WDR001/RES001', '否', 'PT001'],
  ['3', '类别名称', 'Category Name', '文本', '是', '—', '—', '否', 'Programme Transfer'],
  ['4', '学籍状态', 'Student Status', '枚举', '是', '—', 'Offered–Expel 轨道', '是', 'Active'],
  ['5', '类别', 'Category', '枚举', '是', '全量 trackCategory', 'Normal/Programme Transfer 等', '是', 'Programme Transfer'],
]

export const categorySearchFields = [
  ['1', '类别名称', 'Category Name', '下拉', '否', '—', '预置选项', '否', ''],
  ['2', '类别编码', 'Category Code', '文本', '否', '模糊', '—', '否', ''],
  ['3', '学籍状态', 'Student Status', '下拉', '否', '—', '—', '是', ''],
]

export const movementMaintenanceSearchFields = [
  ['1', '学年学期', 'Academic Session', '文本', '否', '模糊', 'applicationSession', '否', ''],
  ['2', '专业代码', 'Programme Code', '文本', '否', '模糊', 'programmeCode', '否', ''],
  ['3', '状态', 'Status', '下拉', '否', '—', '维护页固定 Approved', '是', 'Approved'],
  ['4', '学号', 'Student ID', '文本', '否', '模糊', '—', '否', ''],
  ['5', '学生姓名', 'Student Name', '文本', '否', '模糊', '—', '否', ''],
]

export const movementQuerySearchFields = [
  ['1', '学年学期', 'Academic Session', '文本', '否', '模糊', '首行', '否', ''],
  ['2', '专业代码', 'Programme Code', '文本', '否', '模糊', '首行', '否', ''],
  ['3', '状态', 'Status', '下拉', '否', '—', '首行；非 Draft 全态', '是', ''],
  ['4', '异动类型', 'Movement Type', '下拉', '否', '—', '首行；全部/转专业/休学/复学/退学', '是', ''],
  ['5', '学号', 'Student ID', '文本', '否', '模糊', '次行（可收起）', '否', ''],
  ['6', '学生姓名', 'Student Name', '文本', '否', '模糊', '次行（可收起）', '否', ''],
]

export const consentListFields = [
  ['1', '序号', 'No.', '序号', '—', '—', '分页自动编号', '否', ''],
  ['2', '知情同意书名称', 'Consent Form Name', '文本', '是', '—', '—', '否', 'Deferment Consent - Local'],
  ['3', '适用异动类别', 'Applicable Movement Type', '枚举', '是', '—', '四 Tab', '是', 'Deferment'],
  ['4', 'Student Type', 'Student Type', '枚举', '是', '—', 'Local/Chinese/International', '是', 'Local'],
  ['5', 'Remark', 'Remark', '文本', '否', '—', '—', '否', ''],
]

export const consentSearchFields = [
  ['1', '适用异动类别', 'Applicable Movement Type', '下拉', '否', '—', '四 Tab 枚举', '是', ''],
  ['2', '知情同意书名称', 'Consent Form Name', '文本', '否', '模糊', '—', '否', ''],
  ['3', 'Student Type', 'Student Type', '下拉', '否', '—', 'Local/Chinese/International', '是', ''],
]

export const categoryDataFlow = {
  explanation:
    '异动类别配置页提供分页列表与搜索，支持新增、编辑、删除及设置原因。每行以 categoryCode 全局唯一标识（演示 4 行：PT001/DEF001/WDR001/RES001）。表单双列四行布局：编码/名称、学籍状态/类别（类别下拉为全量 trackCategoryOptions，不与学籍状态联动）、两对实施开关（修改学籍状态/修改学籍类型/是否自动实施/允许学生申请），hint 置于开关右侧。resolveMovementCategoryConfig(sourceKey) 仅按 categoryCode lookup。reasons[] 为四异动申请原因单一数据源：转专业/休学/退学存 reasonId，展示 resolveReasonLabel；复学 RES001 本阶段不同步申请原因下拉。Set Reason 弹窗维护原因列表。',
  preconditions: '类别编码须唯一；原因名称非空。',
  downstream:
    '审批 autoImplement/modify 开关供引擎与维护实施读取；申请 Form 主要原因/转专业原因下拉消费 reasons。',
}

export const consentDataFlow = {
  explanation:
    '知情同意书配置页维护 (适用异动类别 + Student Type) 唯一模板行，含学生/家长附件 mock。四 Tab 申请 Form/Detail 及休学/退学家长区通过 resolveConsentTemplate(movementType, studentCategory) 提供 Download Consent Letter；未配置时提示。列表支持按异动类别、名称、Student Type 搜索；Create/Edit Modal 校验唯一性与必填附件。',
  preconditions: '(movementType, studentType) 组合不可重复；学生知情同意书必填。',
  downstream: '四类异动申请表单与详情只读附件区消费模板下载链接。',
}

export const maintenanceDataFlow = {
  explanation:
    '维护页合并四类 status=Approved 记录为 15 列宽表（与查询列序一致）；状态 Badge、是否实施 Y/N、护照/IC 脱敏、异动日期 YYYY-MM-DD、生效学期 YYYY/MM。搜索：学年学期、专业代码、状态、学号、姓名。工具栏：实施、导出、删除（无修改异动编号）。行操作：详情、流转日志（无 Edit）。Details 脱敏（maskSensitiveFields）。Export ExportModal 默认 15 列+9 可选。',
  preconditions: '仅 Approved 进入列表；autoImplement 已通过记录为 Implemented。',
  downstream: '实施按 modify 开关 mock 回写档案；删除后查询同步消失。',
}

export const queryDataFlow = {
  explanation:
    '查询页合并四类非 Draft 记录，15 列宽表与维护一致（无 sortable）。搜索双行：首行学年学期/专业代码/状态/异动类型，次行学号/姓名可收起。工具栏仅导出；行操作详情（脱敏）与流转日志。Export ExportModal 默认 15 列+9 可选。',
  preconditions: 'Draft 不在范围。',
  downstream: '导出 xlsx 供教务核对；只读无写回。',
}

export const categoryBusinessFlow =
  '进入【学籍异动】→【异动类别】→ 查询或重置 → 新增/编辑四行表单与实施开关 → 设置原因 → 列表分页。'

export const consentBusinessFlow =
  '进入【学籍异动】→【知情同意书】→ 按异动类别/名称/Student Type 查询 → 新增或编辑模板与附件 → 行内查看/编辑 → 批量删除。'

export const maintenanceBusinessFlow =
  '进入【学籍异动】→【学籍异动维护】→ 搜索查询或重置 → 勾选待实施记录实施 → 详情/流转日志 → 导出 xlsx → 删除。'

export const queryBusinessFlow =
  '进入【学籍异动】→【学籍异动查询】→ 首行学年学期/专业代码/状态/异动类型，次行学号/姓名（可收起）→ 查询 → 详情/流转日志 → 导出 xlsx。'
