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
  ['8', '日期', 'Date', '日期时间', '—', '—', 'submittedAt', '否', '01 Nov 2023'],
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
  ['9', '日期', 'Date', '日期时间', '—', '—', 'submittedAt', '否', '01 Nov 2023'],
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
  ['1', '状态', 'Status', '枚举', '—', '—', 'Draft 不在队列', '是', 'In Progress'],
  ['2', '审批环节', 'Approval Stage', '文本', '—', '—', 'workflow 节点', '否', 'Pending Review'],
  ['3', '是否实施', 'Implemented', '枚举', '—', '—', 'Pending/Yes/No', '是', 'Pending'],
  ['4', '学号', 'Student ID', '文本', '—', '—', '—', '否', ''],
  ['5', '学生姓名', 'Student Name', '文本', '—', '—', '—', '否', ''],
  ['6', '申请学期', 'Application Session', '文本', '—', '—', 'intake 等', '否', '2023/09'],
  ['7', '生效学期', 'Effective Session', '文本', '—', '—', '按类型映射', '否', '2025/09'],
  ['8', '异动类别', 'Movement Category', '枚举', '—', '—', '四异动', '是', 'Deferment'],
  ['9', '异动原因', 'Movement Reason', '文本', '—', '—', '摘要', '否', ''],
]

export const approvalSearchFields = [
  ['1', '学年学期', 'Academic Session', '文本', '否', '模糊', 'applicationSession', '否', ''],
  ['2', '异动原因', 'Movement Reason', '文本', '否', '模糊', '—', '否', ''],
  ['3', '状态', 'Status', '下拉', '否', '—', '6 态', '是', ''],
  ['4', '学号', 'Student ID', '文本', '否', '模糊', '—', '否', ''],
  ['5', '学生姓名', 'Student Name', '文本', '否', '模糊', '—', '否', ''],
]

export const profileDataFlow = {
  explanation:
    '列表页支持新增、删除、修改、查询、导入、导出、查看详情等操作。Create/Edit 在右侧 Drawer 中按七个 Tab 依次维护【Basic Info → Enrollment → Contact → Education → Family → Accommodation → Others】，前端按 Student Category（Local/China/International）分支校验必填项与字段显隐，校验通过后写入 students Mock 存储；列表列由 normalizeStudent 从完整档案对象派生展示。Details 以相同七 Tab 结构只读渲染，不可修改。Import 解析 Excel 模板，校验学号全局唯一、Category 必填及 Local/China/International 分支规则后批量入库，重复学号跳过并汇总提示。Export 通过穿梭框选择导出字段与三档范围（当前页/全部/选中）生成 Excel 文件。Delete 批量移除勾选记录并刷新分页与勾选状态。Student ID 作为 master 键供四类异动申请联动读取学生快照。当前为纯前端 Mock，无后端接口；任一写操作成功后列表与分页即时刷新。',
  preconditions:
    '基础数据 Programme、Intake、Faculty 等已在系统或 Mock 中预置；新建档案须先选择 Student Category 并满足对应分支校验（如 Local 必填 IC No.，China/International 必填 Passport No. 等）。Import 须使用标准 Excel 模板且列头与系统字段映射一致。异动申请前对应 Student ID 须已在学生基本信息中存在。',
  downstream:
    '学生基本信息作为四类学籍异动申请的 master 数据源，申请 Form 中 Student ID 选择后自动带出姓名、专业、批次等快照。审批模块 Approved 后回写档案（学籍状态、专业、批次等）为后续扩展点。Export 结果供教务线下核对与归档。',
}

export const movementAppDataFlow = {
  explanation:
    '学籍异动申请页按四 Tab（转专业/休学/复学/退学）各自维护列表与 Form Modal，四类数据分别存入 movementStore 四个 ref（programmeTransfers、deferments、resumptions、withdrawals），与审批模块共享同一 store，审批写回后申请 Tab 列表同步更新。Save Draft 将 status 置为 Draft 并保留在对应 Tab 列表；Submit 校验 Section 必填、声明勾选与附件规则后，将 status 置为 In Progress、approvalStage 置为 Pending Review，并追加首条 approvalLog。Details 打开 DetailModal 以 Section 结构只读展示申请全文与附件，不含审批操作区与内嵌流转日志。Edit 仅对 Draft 或 Update Required 记录开放，预填 Form 后可 Save Draft 或 Resubmit。Delete 仅允许 Draft。Cancel 在 Pending Review 阶段将 status 置为 Cancelled。Approval Log 独立 Modal 以表格展示完整 approvalLog。系统约束同一 studentId 在同一异动类型下仅允许存在一条非终态（非 Approved/Rejected/Cancelled/Expired）申请。操作成功后当前 Tab 列表、Tab 计数与审批队列均即时刷新。',
  preconditions:
    'Student ID 须存在于学生基本信息档案；Submit 须满足各 Section 必填、声明勾选与附件上传规则；同一异动类型下该 studentId 无其他进行中的非终态申请。转专业 Submit 须勾选 Section III 声明并上传 Section IV 附件；Dean/HoP 终审阶段 Section VII 教务核定字段由审批人在审批页填写而非申请侧。',
  downstream:
    'status 为 In Progress 且 approvalStage 非终态的记录进入【学籍异动审批】统一队列，按 Pending Review 角色分桶至 Submitted/Pending/History Tab。终态记录（Approved/Rejected/Cancelled/Expired）在申请侧归档展示；approvalLog 在申请与审批两侧共用只读展示。Approved 后 implemented 字段默认 Pending，后续可扩展回写 Student Profile 学籍状态与专业信息。',
}

export const defermentDataFlow = {
  explanation:
    '休学 Tab 列表展示 DEF 编号前缀的申请记录，数据存入 deferments ref。Form Modal 含 Section I（学生信息联动）、Section II（休学期间与原因）、Section III（家长联系信息）及 Documents 附件区。Save Draft/Submit/Cancel/Resubmit 逻辑与转专业一致，International 学生审批 workflow 含 ISAO 节点。Details 只读展示各 Section 与 MovementAttachmentReadonly 附件，无审批区。操作写回 deferments 并触发 mergeMovementApprovalQueue 刷新审批列表。',
  preconditions:
    'Student ID 有效且学籍状态允许休学申请；Submit 须填写休学期间、主要原因、详细原因、家长信息与附件。',
  downstream:
    'In Progress 休学申请进入审批队列；Approved 后学生档案学籍状态可更新为 Deferred（后续扩展）；复学申请可引用已批准休学学期。',
}

export const resumptionDataFlow = {
  explanation:
    '复学 Tab 列表展示 RES 编号前缀记录，数据存入 resumptions ref。Form Modal 含 Section I 学生联动、Section II 休学/复学学期选择、Section III 双声明勾选及 Documents。Submit 校验声明与附件后进入 Pending Review。Details 只读；Edit/Delete/Cancel 规则同其他异动类型。写回 resumptions 并同步审批队列。',
  preconditions:
    'Student ID 有效；通常须存在已批准休学记录；Submit 须勾选双声明并上传附件。',
  downstream:
    'Approved 复学申请可驱动档案学籍状态恢复 Active 及复学批次更新（后续扩展）；与休学记录形成配对流转。',
}

export const withdrawalDataFlow = {
  explanation:
    '退学 Tab 列表展示 WDR 编号前缀记录，数据存入 withdrawals ref。Form Modal 含 Section I 学生信息、Section II 最后在校日期与原因（International 显示 ISAO Note 提示）、Section III 家长信息及 Documents。六态生命周期与共享 movementStore 同步机制同其他异动。Details 只读无审批；Cancel 仅限 Pending Review 前。',
  preconditions:
    'Student ID 有效；Submit 须填写最后在校日期、主要原因、详细原因、家长信息与附件。',
  downstream:
    'Approved 退学申请可更新档案学籍状态为 Withdrawn（后续扩展）；审批 History 可 Recall 上一笔 Approved 决策。',
}

export const defermentBusinessFlow =
  '进入【学籍管理】→【学籍异动】→【异动申请】→ 切换 Tab【休学】→ 查看列表 → 可选 Search 按学号/姓名筛选 → 点击 New Application 弹出 Form Modal 填写 Section I–III 与附件 → Save Draft 暂存或 Submit 提交 → 列表刷新显示 In Progress → 点击 Details 进入只读 DetailModal 查看全文 → 点击 Approval Log 查看流转记录 → Draft 可 Edit/Delete，Pending Review 前可 Cancel，Update Required 可 Edit 后 Resubmit。'

export const resumptionBusinessFlow =
  '进入【异动申请】Tab【复学】→ Search 筛选 → New Application → Section I 选 Student ID 联动 → Section II 选休学/复学学期 → Section III 勾选双声明 → 上传 Documents → Save Draft 或 Submit → Details 只读查看 → Approval Log 查看审批历史 → 终态记录归档展示。'

export const withdrawalBusinessFlow =
  '进入【异动申请】Tab【退学】→ Search 筛选 → New Application → Section I 联动学生 → Section II 填写离校信息与原因（International 见 ISAO 提示）→ Section III 家长信息 → Documents → Submit → Details/Approval Log → 与审批模块职责分离，审批在【异动审批】完成。'

export const approvalDataFlow = {
  explanation:
    '审批页 merge 四 store 中所有非 Draft 记录，按 classifyApprovalBucket 与 DEFAULT_APPROVER_ROLE（Pending Review）分桶至 Submitted（已提交待他人处理）、Pending（当前角色待审）、History（已处理历史）三个 Tab。列表统一展示 Status、Approval Stage、Implemented、学号、姓名、申请/生效学期、异动类别与原因等字段。搜索区五字段（学年学期、异动原因、状态、学号、姓名）标签与输入框同行布局，Search 过滤当前 Tab 列表，Reset 清空恢复。Pending Tab 支持勾选多条同 sourceKey 且同 approvalStage 的记录批量 Review，打开 MovementApprovalModal 选择 Approved/Rejected/Update Required 并填写 Comment，applyMovementDecision 写回对应 store 的 status、approvalStage、implemented 与 approvalLog。View 跳转 MovementApprovalReviewView 全页嵌入 DetailModal 只读区；Pending 模式下底部展示审批表单（含转专业 Dean/HoP 的 Section VII 教务核定字段）；History 模式下 Approved 记录可 Recall 撤回至 Pending。Export 将当前筛选结果导出 CSV；无数据时 alert 提示。任一写回操作后申请 Tab 与审批 Tab 计数同步刷新。',
  preconditions:
    'Draft 状态记录不在审批队列中；批量 Review 须勾选记录同属一种异动类型（sourceKey）且 approvalStage 一致；Rejected/Update Required 须填写 Comment；转专业 Dean/HoP 节点须在 View/Review 中填写 Section VII 教务核定新专业与批次。',
  downstream:
    'Approved/Rejected/Update Required 决策驱动申请侧 status 与 approvalStage 变更；approvalLog 永久保留供 Audit；Approved 且 implemented=Pending 的记录待后续实施回写 Student Profile；Recall 将 History 中 Approved 决策撤回并恢复 Pending Review 待审状态。',
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
    description: '将当前 Tab 经搜索过滤后的审批列表导出为 CSV 文件。',
    interaction: '点击 Export → 若无数据则 alert 提示 → 否则生成 CSV 并触发浏览器下载。',
    remarks: '导出列含列表主要字段；文件名含 Tab 标识。',
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

export const movementSearchField = [['1', '学号或姓名', 'Student ID or Name', '文本', '否', '模糊', '单关键字', '否', '']]
