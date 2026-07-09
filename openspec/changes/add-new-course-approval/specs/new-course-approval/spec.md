## 新增需求

### 需求：新课程审批列表页
系统应在菜单 **New Course Approval** 提供面向审批人的列表页，展示已提交的课程申请，不含 Temporary saved 草稿。

#### 场景：默认列表加载
- **当** 用户导航至 New Course Approval
- **则** 系统展示分页表格，列包括：No.、Status、Approval Stage、Course Code、Course Name、Offering、Course Classification、Credit、Applicant、Application Date and Time 和 Actions
- **且** Temporary saved 申请不得出现在列表中

#### 场景：Status 徽章样式
- **当** 记录在审批列表中展示
- **则** status 徽章采用实底背景、白字（与 Course Application 列表样式一致）

#### 场景：Actions 列固定
- **当** 表格内容横向溢出
- **则** 滚动时 Actions 列固定在右侧

### 需求：搜索与筛选审批队列
系统应支持按 Course Code、Course Name、Offering 和 Course Classification 搜索审批队列。

#### 场景：基础搜索布局
- **当** 用户查看搜索区域
- **则** Course Code、Course Name 和 Offering 位于第一行，Search 和 Reset 按钮右对齐于同一行
- **且** Course Classification 位于第二行
- **且** 筛选标签右对齐，使冒号垂直对齐

#### 场景：搜索筛选结果
- **当** 用户输入筛选条件并点击 Search
- **则** 列表仅显示匹配的已提交申请，并重置到第 1 页

#### 场景：重置筛选
- **当** 用户点击 Reset
- **则** 清空全部搜索字段并恢复完整审批队列

### 需求：审批工具栏操作
系统应在审批列表页提供工具栏操作 **Approval** 和 **Export**。

#### 场景：Approval 须先选中
- **当** 用户未选中符合审批条件的行即点击 Approval
- **则** 系统不打开审批对话框（按钮禁用或无操作并提示）

#### 场景：Approval 为选中行打开弹框
- **当** 用户选中一条可审批的 In Progress 申请并点击 Approval
- **则** 系统为该申请打开 Approval 弹框

#### 场景：批量审批
- **当** 用户选中两条或以上处于同一审批阶段的可审批 In Progress 申请并点击 Approval
- **则** 系统打开一次 Approval 弹框
- **且** 确认后，相同的 Action 与 Comments 应用于每条选中申请

#### 场景：批量审批须同一阶段
- **当** 用户选中处于不同审批阶段的申请
- **则** Approval 工具栏操作禁用或提示选中项须处于同一审批阶段

#### 场景：Export 审批列表
- **当** 用户点击 Export 并确认字段选择
- **则** 系统下载筛选后审批队列数据的 Excel 文件

### 需求：审批人行操作
系统应为每行提供 Details 和 Approval Log 操作；审批人不得有 Edit 或 Delete 行操作。

#### 场景：查看申请详情
- **当** 用户点击行的 Details
- **则** 系统打开只读三步申请视图，展示 General Information、CLO 和 SLT 数据

#### 场景：查看审批日志
- **当** 用户点击行的 Approval Log
- **则** 系统展示该申请的按时间顺序审批历史

### 需求：Approval 弹框
系统应提供与原型一致的 Approval 弹框，用于记录审批人决定。

#### 场景：弹框标题与上下文
- **当** Approval 弹框打开
- **则** 标题为「Approval」（或本地化「审核」）
- **且** 说明文本包含当前审批阶段（如 Current HoD/HoP Review）

#### 场景：Action 选择
- **当** 用户查看 Action 字段
- **则** 系统提供恰好三个单选选项：Approved、Rejected 和 Update Required
- **且** 本地化标签包括 通过 / 拒绝 / 驳回

#### 场景：Comments 字段
- **当** 用户查看 Comments 字段
- **则** 系统提供 textarea，限制 100 字符，并显示实时计数（如 0/100）
- **且** 提供 Common Comments 控件，可从 3–5 条静态模板预设列表插入文本

#### 场景：Common comments 预设
- **当** 用户点击 Common Comments 并选择预设模板
- **则** 预设文本插入 Comments textarea（遵守 100 字符限制）

#### 场景：Cancel 关闭弹框
- **当** 用户点击 Cancel
- **则** 弹框关闭，不修改申请数据

#### 场景：Confirm 须选择 action
- **当** 用户未选择 Action 即点击 Confirm
- **则** 系统阻止提交并提示用户选择审批结果

### 需求：审批决定 — Approved
系统应在审批人选择 Approved 时推进工作流。

#### 场景：在 HoD/HoP Review 批准
- **当** 审批人在 HoD/HoP Review 阶段确认 Approved
- **则** 状态保持 In Progress，approvalStage 变为 Senate Review
- **且** 向 approvalLog 追加条目，含 actor、action Approved、date/time 和 comments

#### 场景：在 Senate Review 最终批准
- **当** 审批人在 Senate Review 阶段确认 Approved
- **则** 状态变为 Approved，approvalStage 变为 Approved
- **且** 若 Course Code 尚未存在，申请数据归档至 Course Information 作为正式课程记录
- **且** 追加 approvalLog 条目

### 需求：审批决定 — Rejected
系统应在审批人选择 Rejected 时记录终态拒绝。

#### 场景：拒绝申请
- **当** 审批人确认 Rejected
- **则** 状态变为 Rejected
- **且** 向 approvalLog 追加含 comments 的条目
- **且** 申请仍以只读形式保留在审批列表中（仅 Details 和 Approval Log）

### 需求：审批决定 — Update Required
系统应在审批人选择 Update Required 时将申请退回申请人。

#### 场景：退回草稿
- **当** 审批人确认 Update Required
- **则** 状态变为 Temporary saved，approvalStage 变为 --
- **且** 向 approvalLog 追加条目
- **且** 申请从 New Course Approval 队列中移除
- **且** 申请人可在 Course Application 中编辑并重新提交

### 需求：数据源同步
系统应将审批队列与 Course Application 已提交记录同步。

#### 场景：已提交申请出现在审批队列
- **当** 申请人在 Course Application 中提交 Temporary saved 申请
- **则** 该申请以 In Progress 状态出现在 New Course Approval

#### 场景：退回草稿从审批队列消失
- **当** 审批人通过 Update Required 退回申请
- **则** 该申请不再出现在 New Course Approval，直至重新提交

### 需求：应用注册
系统应将 New Course Approval 注册为可从 Course Info 子菜单访问的已开发页面。

#### 场景：菜单访问
- **当** 用户在侧边栏点击 New Course Approval
- **则** 加载 Course Approval 视图，而非 Under Construction
