# 学籍管理-异动审批 规格（合并）

## 说明

以下为各历史 delta spec 原文按来源拼接并做术语中文化处理。整理正式需求文档时，应按场景重写为「用户故事 / 验收标准」，消除重复与过时条目。

## 来源 `add-movement-admin-cancel` / 能力 `movement-approval-app`

## 新增需求

### 需求：管理端列表撤销 In Progress 异动申请
系统应在异动查询、维护与审批列表中，对状态为 In Progress 的记录提供 Cancel（撤销）操作；与学生端 Early Cancel 规则并存，不修改 add-*-app 中学生撤销场景。

#### 场景：In Progress 显示撤销
- **当** 管理端用户查看 In Progress 记录的列表 Actions
- **则** 显示「撤销」/ Cancel 链接按钮，并附带说明性 tooltip

#### 场景：非 In Progress 不显示撤销
- **当** 记录为 Draft、Update Required 或终态
- **则** 管理端列表不提供 Cancel

#### 场景：确认后归档
- **当** 管理端用户点击 Cancel 并在确认弹框中确认
- **则** 申请变为 Cancelled、归档，approvalLog 记录 AC 撤销

#### 场景：入口仅限列表
- **当** 用户从管理端打开申请详情抽屉
- **则** 抽屉 Footer 不提供 Cancel（Cancel 仅在列表 Actions）

## 来源 `add-movement-approval-app` / 能力 `movement-approval-app`

## 新增需求

### 需求：学籍异动审批页已注册且可访问
系统应将学籍异动审批页（`sr-movement-approval`）注册为已开发的学籍页面，并从侧边栏「学籍异动」分组下渲染。

#### 场景：导航至审批页
- **当**用户从侧边栏打开学籍异动审批
- **则**系统展示异动审批工作台，而非建设中占位页

### 需求：审批列表使用三个按角色分桶的 Tab
系统应提供三个 Tab，从当前 mock 审批角色视角对申请分桶：Submitted、Pending、History。

#### 场景：Submitted Tab
- **当**用户选择 Submitted Tab
- **则**列表展示 `status === 'In Progress'`、当前流程环节不是当前角色活跃环节、且当前角色在本轮提交周期内尚未审批过的申请

#### 场景：Pending Tab
- **当**用户选择 Pending Tab
- **则**列表展示 `status === 'In Progress'` 且当前审批环节与当前角色活跃环节匹配的申请

#### 场景：History Tab
- **当**用户选择 History Tab
- **则**列表展示当前角色在本轮已审批过的申请、学生 Cancelled 的申请，或当前角色曾参与且已终态的申请

### 需求：统一审批表仅展示共性列
系统应为四种异动类型展示单一分页表，共性列包括：Status、审批环节、是否实施、学生ID、学生Name、申请 Session、生效 Session、异动类别、异动原因。

#### 场景：异动类别列
- **当**一行代表转专业、休学、复学或退学
- **则**异动类别列展示本地化的异动类型标签

#### 场景：类型特有字段不在表格中
- **当**用户查看审批列表
- **则**类型特有的申请字段不作为表格列展示，仅可通过 View 查看

### 需求：查看行为随 Tab 上下文变化
系统应在 Submitted 与 History Tab 以只读申请内容打开 View；在 Pending Tab 以只读申请内容加审批控件打开 View。

#### 场景：从 Submitted 查看
- **当**用户在 Submitted 行点击 View
- **则**系统打开只读申请详情，无审批操作

#### 场景：从 Pending 查看
- **当**用户在 Pending 行点击 View
- **则**系统打开审批详情，含只读申请区块及 Action、Comment、Submit 控件

#### 场景：转专业 Section VII 仅在审批时可用
- **当**用户在 Pending 对转专业申请执行终审审批
- **则**审批详情中可填写 Section VII 教务字段，申请侧只读详情中不可见

### 需求：仅 Pending Tab 支持批量审批
系统应仅在 Pending Tab 允许对共享相同异动类型与审批环节的行批量 Approve。

#### 场景：Submitted 上禁用审批
- **当**用户位于 Submitted 或 History Tab
- **则**批量 Approve 隐藏或禁用

#### 场景：批量审批校验
- **当**用户勾选不同异动类型或不同审批环节的行并点击 Approve
- **则**系统阻止批量审批并展示校验提示

### 需求：列表可访问审批日志
系统应在所有 Tab 的每一行通过共享 `ApprovalLogModal` 提供 Approval log。

#### 场景：打开审批日志
- **当**用户在任意行点击 Approval log
- **则**系统打开 `ApprovalLogModal`，展示环节、审批人、操作、日期与备注历史

### 需求：History Tab 在允许时支持撤回
系统应在当前角色最后一次 Approved 已推进流程且下一环节尚未有任何 log 记录时，对 History 项支持 Recall。

#### 场景：撤回成功
- **当**用户撤回符合条件的 History 项
- **则**申请回到当前角色的 Pending，审批环节回退至该角色环节

#### 场景：已取消申请禁止撤回
- **当**申请状态为 Cancelled
- **则**不提供 Recall

### 需求：学籍异动审批流程按类型与学生类别推进
系统应按休学、复学、退学、转专业的流程定义推进审批环节，含设计定义的 International/China 专属节点（如 ISAO）。

#### 场景：国际休学包含 ISAO
- **当**休学申请的学生类别为 China 或 International
- **则**流程在 AA HOD 之后、下游办公室环节之前包含 International 学生Affairs Office

#### 场景：Local 复学跳过 ISAO
- **当**复学申请的学生类别为 Local
- **则**流程不要求 International 学生Affairs Office

## 修改需求

### 需求：学籍模块分离申请与审批
系统应将学生申请 CRUD 保留在学籍异动申请，审批决策保留在学籍异动审批，不在申请详情弹框内嵌审批控件。

#### 场景：申请详情保持只读
- **当**用户从申请模块打开 Details
- **则**不展示内联审批表单

#### 场景：审批更新共享 mock 数据
- **当**审批人从审批模块提交决策
- **则**共享 data store 中对应异动记录的 status、approvalStage、approvalLog 更新，两个模块的列表与日志均可见

### 需求：学籍异动审批通过 ExportModal 导出
系统应通过共享 `ExportModal` 组件将审批列表结果导出为 Excel，与异动查询、维护模块一致。

#### 场景：打开导出弹窗
- **当**用户在审批页点击 Export 且存在过滤结果
- **则**系统打开 `ExportModal`，可选导出字段与审批列表列一致

#### 场景：按范围导出 xlsx
- **当**用户确认导出，范围为当前页、全部结果或选中行
- **则**系统下载包含所选行与所选字段的 xlsx 文件

#### 场景：导出默认字段与列表列一致
- **当**用户在审批页打开 ExportModal
- **则**默认勾选字段包含 status、审批环节、学生标识、Session、异动类别、申请日期
- **且**implemented 为可选字段，默认不勾选

#### 场景：无数据时阻止导出
- **当**用户在无过滤结果时点击 Export
- **则**系统展示无数据提示，不打开导出弹窗

#### 场景：首版导出不做敏感字段脱敏
- **当**用户导出审批结果
- **则**导出不对 Passport/IC 做脱敏，因审批列表不含这些列

## 来源 `add-movement-approval-app` / 能力 `student-records-app`

## 修改需求

### 需求：学籍侧边栏包含已开发的异动审批入口
系统应将学籍异动审批与 学生Basic Information、学籍异动申请一并视为已开发页面。

#### 场景：已开发页面集合
- **当**学籍应用加载
- **则**`studentRecordsDevelopedPages` 包含 `sr-movement-approval`

#### 场景：审批页面包屑
- **当**用户位于学籍异动审批页
- **则**面包屑展示学籍异动分组与学籍异动审批叶子标签

## 来源 `add-movement-approval-list-columns-and-documents-hint` / 能力 `movement-approval-app`

## 新增需求

### 需求：异动审批列表显示历史申请序号

异动审批主表应在异动类别列之后显示该学生各异动类型的历史申请序号，表头附带 tooltip 说明该字段含义。

#### 场景：所有异动类型序号从 1 起算
- **当** 审批列表中出现任意非 Draft 异动申请
- **则** 序号列显示该学生该类型所有非 Draft 申请按提交时间排序后的 1 基序号

### 需求：异动审批列表显示最近审批操作时间

异动审批主表应显示最近一次审批人操作时间戳，表头附带 tooltip 说明该字段及 em dash 规则。

#### 场景：最近操作来自审批日志
- **当** 申请在审批日志中存在审批人操作记录
- **则** Last Action Time 显示最新一条 Approved、Rejected 或 Update Required 记录，格式为 `YYYY-MM-DD HH:mm:ss`

#### 场景：尚无审批操作
- **当** 申请在审批日志中无任何审批人操作记录
- **则** Last Action Time 显示 em dash

### 需求：文件选择器下方显示附件格式提示

异动文档上传行应在选择文件控件下方另起一行，以 hint 样式展示支持的文件格式说明。

## 来源 `add-movement-approval-log-parallel-branches` / 能力 `movement-approval-app`

## 修改需求

### 需求：审批日志按并行会签语义渲染

当异动流程存在会签逻辑组时，审批日志时间轴以分支开始 / 分支卡片 / 分支汇聚呈现，而非仅串行列表。

#### 场景：会签组折叠展示

- **当** 单据 workflow 含 parallelGroup 且时间轴渲染到该组
- **则** 展示「分支开始，并行审批」、组内各部门节点、以及汇聚提示

#### 场景：Demo 含混态分支

- **当** 用户打开含会签进行中的演示休学详情
- **则** 可在审批日志中看到通过 / 待审 / 需修改等并存的分支状态

## 来源 `inline-movement-approval-search-fields` / 能力 `movement-approval-app`

## 修改需求

### 需求：审批搜索区采用响应式字段布局
系统应展示五个搜索字段——Academic Session、异动原因、Status、学生ID、学生Name——于单一响应式搜索区，无「更多/收起」展开控件。每个搜索字段的标签与输入控件应在同一水平行展示，标签不得堆叠在控件上方。

#### 场景：全部搜索字段可见
- **当**用户打开学籍异动审批列表页
- **则**五个搜索字段均可见，无需用户展开额外筛选项

#### 场景：单字段内联标签与控件
- **当**用户查看审批页任意搜索字段
- **则**字段标签与其 input 或 select 控件在同一行，标签不在控件上方堆叠

#### 场景：字段组自适应换行
- **当**视口宽度变化
- **则**完整搜索字段组可换至新行，但每组内标签与控件始终同行

#### 场景：搜索操作对齐
- **当**搜索字段展示时
- **则**Search 与 Reset 在宽视口下位于搜索字段区右侧；窄视口字段组换行时仍可访问

#### 场景：与列表页搜索样式一致
- **当**渲染异动审批搜索栏
- **则**使用共享 `list-page-search.css` 布局约定（内联 label+control、统一间距与控件宽度），与本应用其他审批/列表页一致

## 来源 `refine-movement-admin-cancel-to-approval-history` / 能力 `movement-application`

## 修改需求

### 需求：管理端撤销入口

系统应仅在学籍异动审批历史 Tab 列表行为 In Progress 申请提供 AC 撤销操作。

#### 场景：审批历史 Tab 显示撤销
- **当** AC 在学籍异动审批历史 Tab 查看 In Progress 记录
- **则** 列表操作列提供带 tooltip 的撤销操作

#### 场景：申请管理端与维护无撤销
- **当** 用户在学籍异动申请（管理端）或学籍异动维护列表查看记录
- **则** 不显示撤销操作

#### 场景：审批其他 Tab 与查询无撤销
- **当** 用户在审批已提交/待我审批 Tab 或异动查询列表查看记录
- **则** 不显示撤销操作

#### 场景：撤销仅在列表行
- **当** AC 在审批历史 Tab 打开申请详情抽屉
- **则** 详情 footer 不增加撤销按钮（列表行已有）

## 来源 `refine-movement-admin-cancel-to-approval-history` / 能力 `movement-approval-app`

## 修改需求

### 需求：管理端列表撤销 In Progress 异动申请

#### 场景：审批历史 Tab 列表撤销
- **当** AC 在审批历史 Tab 对 In Progress 申请执行撤销并确认
- **则** 申请变为 Cancelled、归档，approvalLog 记录 AC 撤销

#### 场景：非历史 Tab 不显示撤销
- **当** 用户查看审批已提交或待我审批 Tab
- **则** 不显示撤销操作

## 来源 `refine-movement-admin-detail-export` / 能力 `movement-application`

## 修改需求

### 需求：异动详情抽屉布局

所有异动申请详情抽屉（Query、Maintenance、Approval、管理员Application、学生Application）应先展示申请详情，最后展示 Approval Log 表格。抽屉不应使用纵向审批时间线组件。

#### 场景：详情内容先于审批日志
- **当** 用户打开任意异动申请详情抽屉
- **则** 申请字段与附件显示在 Approval Log 区块上方

#### 场景：审批日志为四列表格
- **当** 抽屉展示审批历史
- **则** 表格列为 Description、Action By、Action By Role、Created At，按日志顺序排列

#### 场景：Submitted 操作描述
- **当** 审批日志条目的 action 为 Submitted
- **则** Description 显示 Application Submitted

#### 场景：Created At 格式
- **当** 审批日志条目有日期/时间值
- **则** Created At 显示为 `YYYY-MM-DD HH:mm:ss`

### 需求：详情抽屉中的附件演示与导出

详情抽屉应在无已上传文件时展示演示附件，并为每个附件提供 Export 操作，命名包含文档类型与异动类型后缀（Programme Transfer、Deferment、Resumption、Withdrawal）。

#### 场景：无上传时显示演示附件
- **当** 为无已上传附件元数据的记录打开详情抽屉
- **则** 适用文档字段显示演示附件文件

#### 场景：附件导出文件名
- **当** 用户从详情抽屉导出附件
- **则** 下载名称遵循 `{archiveNo}. {studentId} {NAME}_ {DocType}_{MovementType}.ext`，未 Approved 时使用 NA

### 需求：仅管理端申请支持 PDF 导出

仅 Movement Application (Admin) 详情抽屉（`applicantMode === 'teacher'`）应在页脚显示 Export PDF 操作。Query、Maintenance、Approval 与 学生Application 抽屉不应显示 PDF 导出。

#### 场景：管理端申请显示 PDF 导出
- **当** 教职工从 Movement Application (Admin) 打开详情抽屉
- **则** 页脚提供 Export PDF 按钮

#### 场景：其他入口隐藏 PDF 导出
- **当** 用户从 Query、Maintenance、Approval 或 学生Application 打开详情抽屉
- **则** 不显示 Export PDF 按钮

#### 场景：PDF 包含附件与审批日志
- **当** 教职工从 Movement Application (Admin) 导出 PDF
- **则** 生成的 PDF 包含申请详情、附件列表及 Approval Log 表格

#### 场景：PDF 文件名归档编号
- **当** 记录状态为 Approved
- **则** PDF 文件名使用稳定的数字归档前缀；否则前缀为 NA

#### 场景：转专业命名后缀
- **当** 为转专业导出 PDF 或附件
- **则** 异动类型后缀使用 Programme Transfer

### 需求：详情视图隐藏同意书模板下载

异动申请详情视图（抽屉与详情弹框）不应显示 Download Consent Letter 模板按钮。该操作仅保留在新增/编辑申请表单中。

#### 场景：详情抽屉隐藏同意书模板下载
- **当** 用户打开异动申请详情抽屉
- **则** 文档区块不显示 Download Consent Letter 按钮

#### 场景：创建表单保留同意书模板下载
- **当** 用户在表单弹框中创建或编辑异动申请
- **则** 适用文档字段仍提供 Download Consent Letter 按钮

### 需求：详情声明勾选框与创建表单一致

详情视图应以与创建表单相同的已勾选视觉样式（蓝色勾选外观）渲染学生声明勾选框，同时保持不可交互。

#### 场景：只读声明显示蓝色已勾选状态
- **当** 详情视图展示已同意声明的记录
- **则** 勾选框显示为已勾选，样式与创建表单相同的蓝色风格

### 需求：管理端详情抽屉页脚按钮顺序

显示 Export PDF 时，其应位于 Close 按钮左侧。

#### 场景：Export PDF 在 Close 之前
- **当** 管理端申请详情抽屉页脚显示 Export PDF
- **则** Export PDF 位于 Close 之前

## 来源 `refine-movement-approval-search-ui` / 能力 `movement-approval-app`

## 修改需求

### 需求：统一审批表仅展示公共列
系统应为四种异动类型展示单一分页表格。所有 Tab 的公共列应为：状态、审批阶段、学号、姓名、申请学期、生效学期、异动类别与申请日期。「是否实施」列仅出现在历史 Tab，且显示 Y 或 N。异动原因不得作为表格列出现。

#### 场景：异动类别列
- 当某行代表转专业、休学、复学或退学时，则「异动类别」列显示本地化的异动类型标签

#### 场景：类型专属字段不在表格中
- 当用户查看审批列表时，则类型专属申请字段（含异动原因）不作为表格列展示，仅可通过「查看」访问

### 需求：审批列表使用三个角色感知 Tab
系统应提供三个 Tab，从当前审批角色视角对申请分类：已提交、待我审批与历史。审批角色应由系统默认值决定（v1：`Pending Review`），且不得在审批列表页以页面级选择器暴露。

#### 场景：已提交 Tab
- 当用户选择「已提交」Tab 时，则列表显示进行中且当前工作流阶段不是当前角色活跃阶段、且当前角色在本轮提交中尚未操作的申请

#### 场景：待我审批 Tab
- 当用户选择「待我审批」Tab 时，则列表显示进行中且当前审批阶段与当前角色活跃阶段匹配的申请

#### 场景：历史 Tab
- 当用户选择「历史」Tab 时，则列表显示当前角色在本轮已操作过的申请、学生取消的申请，或该角色参与过的终态结果

#### 场景：列表页无角色选择器
- 当用户查看异动审批列表页时，则系统不显示 Current approver role 下拉或等效的角色切换控件

### 需求：审批搜索区采用响应式字段布局
系统应在单一响应式搜索区展示五个搜索字段：学年学期、专业代码、状态、学号与学生姓名，不使用「更多/收起」展开控件。不得显示「异动原因」搜索字段。

#### 场景：全部搜索字段可见
- 当用户打开异动审批列表页时，则五个搜索字段均可见，无需展开额外筛选

#### 场景：专业代码搜索紧邻学年学期
- 当用户查看审批搜索区时，则「专业代码」输入框紧接在「学年学期」输入框之后

#### 场景：无异动原因搜索
- 当用户查看审批搜索区时，则系统不显示「异动原因」搜索输入框

#### 场景：按专业代码筛选
- 当用户输入专业代码关键字并点击「查询」时，则列表仅显示解析出的专业代码与关键字匹配（substring）的行

#### 场景：字段自适应换行
- 当视口宽度变化时，则搜索字段通过响应式 grid 或 flex-wrap 重新排列，标签与输入保持可读且无横向溢出

#### 场景：搜索操作对齐
- 当搜索字段展示时，则在宽视口下「查询」与「重置」对齐于搜索字段区域右侧；窄视口字段换行时仍保持可访问

### 需求：审批 Tab 顺序且仅待我审批显示角标
系统应按顺序展示审批 Tab：待我审批、已提交、历史。仅「待我审批」Tab 应显示数字角标。

#### 场景：Tab 顺序
- 当用户查看异动审批列表页时，则 Tab 从左到右依次为待我审批、已提交、历史

#### 场景：仅待我审批显示角标
- 当用户查看 Tab 栏时，则仅「待我审批」Tab 显示数量角标；「已提交」与「历史」Tab 不显示数字角标

#### 场景：状态 badge 可见
- 当用户在任意 Tab 查看「状态」列时，则状态标签使用与异动申请列表相同的本地化申请状态文案（不含 Draft），且 badge 样式可见

#### 场景：申请日期格式化
- 当某行代表转专业、休学、复学或退学时，则「申请日期」使用该异动类型申请列表页的相同列表日期格式化函数

#### 场景：是否实施列仅历史 Tab
- 当用户选择「待我审批」或「已提交」Tab 时，则不显示「是否实施」列

#### 场景：历史 Tab 是否实施 Y/N
- 当用户选择「历史」Tab 时，则「是否实施」列在记录实施状态为 Implemented 时显示 Y，其余值（含待实施的 Approved 记录）显示 N

### 需求：待我审批查看通过 footer 与 Modal 审批
系统应以只读申请详情打开「待我审批」Tab 的「查看」，详情内容下方不得内联展示审批表单。查看待我审批申请时，详情 footer 应按顺序显示「审批」与「关闭」（「审批」紧挨在「关闭」之前）。点击「审批」应打开与列表批量 Review 相同的 `MovementApprovalModal`（含 Action、Comments、确认流程）。「已提交」与「历史」查看的详情 footer 仅显示「关闭」（历史 Tab 可在详情 footer 外保留现有 Recall 控件）。

#### 场景：从已提交 Tab 查看
- 当用户点击「已提交」行的「查看」时，则系统打开只读申请详情，详情 footer 无「审批」按钮

#### 场景：从待我审批查看且无内联审批
- 当用户点击「待我审批」行的「查看」时，则系统打开只读申请详情，且详情面板下方不渲染内联审批区

#### 场景：从详情 footer 审批
- 当用户在待我审批申请的详情 footer 点击「审批」时，则系统打开 `MovementApprovalModal`，展示当前审批阶段且目标数量为 1

#### 场景：Modal 与列表批量 Review 一致
- 当用户从详情 footer 打开的 `MovementApprovalModal` 提交决策时，则弹框内容与确认流程与在待我审批列表选中一行后点击 Review 一致

#### 场景：详情审批提交后
- 当用户从详情 footer 弹框确认审批决策时，则系统通过异动审批引擎应用决策并返回审批列表

## 移除需求

### 需求：待我审批查看页内联审批区
**原因**：产品设计将审批控件从详情面板下方内联区移至 footer 触发的 `MovementApprovalModal`，与课程审批模式对齐。
**迁移**：从 `MovementApprovalReviewView` 移除 `approval-section`；footer「审批」接入现有 `MovementApprovalModal`。

### 需求：审批搜索与表格中的异动原因
**原因**：产品从审批列表工作区移除异动原因；原因详情仍可通过「查看」访问。
**迁移**：移除搜索字段与表格列；从 CSV 导出表头移除。

### 需求：待我审批与已提交 Tab 的是否实施列
**原因**：实施仅在审批工作流完成后适用；待我审批与已提交项尚不符合实施展示条件。
**迁移**：仅在历史 Tab 激活时显示「是否实施」列。

### 需求：审批页 mock 审批角色选择器
**原因**：产品设计不再包含页内角色下拉；审批上下文在实现认证前通过系统默认值隐式确定。
**迁移**：移除 UI 绑定；引擎调用仍保留 `DEFAULT_APPROVER_ROLE`。

## 来源 `refine-movement-approval-stage-department-labels` / 能力 `movement-approval-app`

## 修改需求

### 需求：审批阶段展示具体部门名称

异动审批列表「审批阶段」与审批时间轴节点标题不得以「Pending Review」作为业务文案，应展示对应部门名称。

#### 场景：待我审批列表显示部门名

- **当** 单据当前内部阶段为 Pending Review
- **则** 审批阶段列显示 Degree Academic Coordinator（中文：学位教务协调员）

#### 场景：时间轴当前节点标题为部门名

- **当** 时间轴渲染待审节点且内部 stage 为 Pending Review
- **则** 节点标题为对应部门名，状态徽章仍可为「待审批」

## 来源 `refine-movement-cancel-entry-points` / 能力 `movement-application`

## 修改需求

### 需求：管理端撤销入口

系统应在 Movement Application (Admin) 列表与 Movement Maintenance 列表中，为 In Progress 申请提供 AC 撤销（撤销）操作。Query 与 Approval 列表不应显示撤销操作。

#### 场景：管理端申请撤销 tooltip 与原型一致
- **当** AC 悬停 Movement Application (Admin) 上的撤销 tooltip
- **则** tooltip 恰好显示两项：AC 可在何处撤销 In Progress 申请，以及确认后将终止流程并通知相关部门

#### 场景：管理端申请列表显示撤销
- **当** AC 在 Movement Application (Admin) 查看四类异动中任一 In Progress 记录
- **则** 提供带 tooltip 的 Revoke（撤销）操作

#### 场景：维护列表显示撤销
- **当** AC 在 Movement Maintenance 查看 In Progress 记录
- **则** 提供带 tooltip 的 Revoke（撤销）操作

#### 场景：查询与审批列表撤销只读
- **当** 用户查看 Movement Query 或 Movement Approval 列表
- **则** 不显示 Revoke 操作

### 需求：学生审批前撤回

在学生异动申请页面，系统应允许学生在审批尚未开始前，对处于 Pending Review 的 In Progress 申请执行撤回（取消），并提供 tooltip 说明与 AC 撤销的区别。

#### 场景：学生看到取消操作及 tooltip
- **当** 学生在学生申请列表查看其符合条件的申请
- **则** 显示带说明性 tooltip 的 Cancel（取消）操作

#### 场景：学生取消 tooltip 文案与产品措辞一致
- **当** 学生打开取消 tooltip
- **则** 标题为「取消说明」，三项内容为：(1) 审批流程尚未启动前，学生可在审核开始前取消；(2) 此 Cancel 与 Movement Application (Admin) 上的 Revoke 不同；(3) 若已在审核中或需 AC 终止，请联系 AC 在 Movement Maintenance 执行撤销

#### 场景：管理端申请使用撤销而非学生取消
- **当** 教职工在 Movement Application (Admin) 页面处理 In Progress 记录
- **则** 显示 Revoke（撤销）而非学生 Cancel（取消）

## 来源 `refine-movement-detail-approval-timeline` / 能力 `movement-application-details`

## 修改需求

### 需求：异动详情审批日志流程图展示

所有异动申请详情入口（学生端四类申请、审批、查询、维护、管理端申请）应使用竖向审批流程图展示审批历史，不使用四列表格。布局顺序为：流程图在上，申请内容在下。

#### 场景：流程图在上、申请在下
- **当** 用户打开任意异动申请详情抽屉
- **则** 顶部展示 `ApprovalTimeline` 流程图，其下展示申请字段、附件与声明等内容

#### 场景：流程图节点含进度状态
- **当** 抽屉展示审批历史
- **则** 流程图按工作流阶段展示已完成、待审批、未到等节点状态，数据来自 `approvalLog` 与 `approvalStage`

#### 场景：详情不使用审批日志表格
- **当** 用户查看异动申请详情
- **则** 不展示 Description / Action By / Action By Role / Created At 四列表格

### 需求：PDF 与详情 WYSIWYG

Preview PDF 与 Export PDF 生成的内容应与详情抽屉所见布局一致。

#### 场景：Preview PDF 含流程图
- **当** 用户在维护或查询列表点击 Preview PDF
- **则** 生成的 PDF 顶部为审批流程图，下方为申请详情，与抽屉一致

#### 场景：Export PDF 含流程图
- **当** 用户在管理端申请详情抽屉导出 PDF
- **则** 生成的 PDF 包含流程图与申请详情，不含审批日志表格

## 来源 `remove-movement-approval-last-action-time-column` / 能力 `movement-approval-app`

## 修改需求

### 需求：异动审批列表移除最近审核时间列

异动审批主表（待我审批、历史 Tab）不应显示「最近审核时间」列。

#### 场景：待办 Tab 无最近审核时间列
- **当** 用户查看待我审批列表
- **则** 表格不含「最近审核时间」列，申请次数之后直接为申请日期

#### 场景：历史 Tab 无最近审核时间列
- **当** 用户查看历史列表
- **则** 表格同样不含「最近审核时间」列

#### 场景：导出不含最近审核时间
- **当** 用户从审批列表导出 Excel
- **则** 可选导出字段中不包含最近审核时间

## 移除需求

### 需求：异动审批列表显示最近审批操作时间

**移除**：该列已从产品图示中删除。

## 来源 `restore-movement-approval-last-action-time-column` / 能力 `movement-approval-app`

## 修改需求

### 需求：异动审批列表显示最近审核时间列

异动审批主表在「申请次序」右侧展示「最近审核时间」。

#### 场景：申请次序右侧为最近审核时间

- **当** 用户查看待我审批或历史列表
- **则** 列顺序为申请次序 → 最近审核时间 → 申请日期

#### 场景：待我审批为首节点时展示提交时间

- **当** 单据停在 Pending Review 且日志仅有 Submitted
- **则** 最近审核时间展示该提交时间（不为 —）

#### 场景：前一节点为会签多分支取最晚时间

- **当** 当前节点的前一逻辑节点为会签组
- **则** 展示该组各分支审批操作中的最新时间

#### 场景：导出含最近审核时间

- **当** 用户从审批列表导出 Excel
- **则** 可选导出字段包含最近审核时间

## 移除需求

### 需求：异动审批列表移除最近审核时间列

**移除**：该列已恢复，且语义为前一逻辑节点操作时间。
