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
系统应为四种异动类型展示单一分页表，共性列包括：Status、审批环节、是否实施、Student ID、Student Name、申请 Session、生效 Session、异动类别、异动原因。

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
- **则**流程在 AA HOD 之后、下游办公室环节之前包含 International Student Affairs Office

#### 场景：Local 复学跳过 ISAO
- **当**复学申请的学生类别为 Local
- **则**流程不要求 International Student Affairs Office

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
