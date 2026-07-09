## 新增需求

### 需求：复学列表页展示复学历史
系统应展示分页的 Resumption History 表格，列包括：Application ID、Student ID、Name、Programme、Original Intake、Resume Intake、Status、Date 和 Actions。

#### 场景：默认列表加载
- **当** 用户在 Student Records 侧边栏导航至 Resumption
- **则** 系统展示 Resumption 页面，包含 Resumption History 表格及至少一条 mock 示例记录

#### 场景：六种核心状态的 Status 徽章展示
- **当** 记录状态为 Draft、In Progress、Update Required、Approved、Rejected 或 Cancelled
- **则** 系统以只读徽章展示状态，样式与转专业、休学徽章对齐且区分明显

#### 场景：列表操作遵循状态规则
- **当** 用户查看 Draft 记录
- **则** Actions 列显示 Details、Edit、Delete 和 Workflow Log
- **当** 用户查看处于 Pending Review 阶段且符合取消条件的 In Progress 记录
- **则** Actions 列显示 Details、Cancel 和 Workflow Log
- **当** 用户查看已超过 Pending Review 或审批日志中已有审批决定的 In Progress 记录
- **则** Actions 列仅显示 Details 和 Workflow Log
- **当** 用户查看 Update Required 记录
- **则** Actions 列显示 Details、Edit 和 Workflow Log
- **当** 用户查看 Cancelled、Rejected 或 Approved 记录
- **则** Actions 列仅显示 Details 和 Workflow Log

### 需求：搜索复学申请
系统应支持通过 Student ID 或 Name 搜索申请；搜索栏位于列表页卡片第一行。

#### 场景：搜索栏为第一行且无页面标题
- **当** 用户导航至 Resumption
- **则** 列表卡片不显示大号页内标题
- **且** 卡片第一行为搜索栏，Search 和 Reset 操作右对齐

#### 场景：搜索字段标签与输入含义一致
- **当** 用户查看搜索栏
- **则** 标签描述可搜索内容（如「Student ID or Name:」），后接文本输入框

#### 场景：按学号或姓名搜索
- **当** 用户输入关键词并点击 Search
- **则** 列表仅显示匹配记录，并重置到第 1 页

#### 场景：重置搜索
- **当** 用户清空关键词并点击 Reset
- **则** 恢复完整列表

### 需求：创建与编辑复学申请并支持草稿
系统应允许用户通过多区块表单弹框创建与编辑复学申请，支持 Save Draft 与 Submit 工作流。

#### 场景：打开创建表单
- **当** 用户点击「+ New Resumption」
- **则** 系统打开 Resumption Application 表单弹框，包含 Section I–II、Supporting Documents、声明、说明，以及页脚操作 Close、Save Draft 和 Submit

#### 场景：保存草稿
- **当** 用户在新建或编辑申请上点击 Save Draft
- **则** 申请以 Draft 状态保存，出现在列表中，并提供 Edit 和 Delete 操作

#### 场景：提交申请
- **当** 用户完成所有提交必填字段（含两项声明与附件）并点击 Submit
- **则** 申请状态变为 In Progress，审批阶段为 Pending Review

#### 场景：每名学生仅一条有效申请
- **当** 用户尝试为已有 Draft、In Progress 或 Update Required 复学申请的学生提交
- **则** 系统阻止提交并显示校验提示

### 需求：复学表单区块与原型一致
系统应渲染与 StudentSys 原型对齐的申请表单区块与字段。

#### 场景：Section I 学生信息
- **当** 用户在表单中查看 Section I
- **则** 系统展示 Student ID（必填，可搜索选择）、Date of Application（只读，当前日期）、Name、Original Intake、Programme、Programme Level、NRIC/Passport No. 和 Nationality

#### 场景：Student ID 自动填充
- **当** 用户从学生档案数据中选择 Student ID
- **则** 系统从关联学生档案自动填充 Section I 和 Section II 联系字段

#### 场景：Section II 复学详情
- **当** 用户在表单中查看 Section II
- **则** 系统展示 Personal Email、Phone Number、Deferment Semester（必填）和 Resumption Semester（必填）

#### 场景：Supporting Documents 区块
- **当** 用户在表单中查看 Supporting Documents
- **则** 系统展示必填附件上传（mock），标签提示医疗 clearance 或 payment receipt，格式提示 PDF/JPG/PNG/DOCX 最大 5MB，并提供 Download Consent Letter 操作

#### 场景：声明勾选框
- **当** 用户查看声明区域
- **则** 系统展示两项必填勾选框：信息正确性与最长修业年限确认

#### 场景：复学说明提示
- **当** 用户在页脚按钮前查看表单
- **则** 系统显示蓝色说明提示：复学须视专业名额及结清欠费情况而定

### 需求：复学表单校验
系统应按表单模式（draft 与 submit/resubmit）校验必填字段。

#### 场景：草稿校验
- **当** 用户点击 Save Draft
- **则** 系统仅要求 Student ID，允许在未填写声明或附件时保存

#### 场景：提交校验
- **当** 用户未填写 Student ID、deferment semester、resumption semester、附件或任一声明勾选框即点击 Submit 或 Resubmit
- **则** 系统阻止提交并显示行内校验提示

### 需求：审核开始前取消进行中申请
系统应允许学生仅在 Pending Review 阶段且尚未记录任何审批决定时，取消 In Progress 申请。

#### 场景：在 Pending Review 取消
- **当** 用户点击处于 Pending Review 且审批日志中无审批决定的 In Progress 申请的 Cancel
- **则** 申请状态变为 Cancelled、归档，并以只读形式保留在历史中

#### 场景：审核开始后不可取消
- **当** In Progress 申请已超过 Pending Review 或审批日志中已有审批决定
- **则** 不显示 Cancel 操作

#### 场景：取消不删除记录
- **当** 用户取消申请
- **则** 记录未从 Resumption History 中物理删除

### 需求：Update Required 允许编辑并重新提交
系统应允许对 Update Required 状态申请进行编辑并重新提交。

#### 场景：编辑需更新申请
- **当** 用户点击 Update Required 记录的 Edit
- **则** 系统打开表单弹框，现有数据可编辑

#### 场景：更新后重新提交
- **当** 用户保存修改并重新提交 Update Required 申请
- **则** 状态变为 In Progress，审批阶段为 Pending Review

### 需求：终态为只读
系统应将 Approved、Rejected 和 Cancelled 视为终态已归档，详情只读。

#### 场景：查看终态详情
- **当** 用户点击 Approved、Rejected 或 Cancelled 申请的 Details
- **则** 系统以只读模式展示所有区块，无审批或编辑操作

#### 场景：In Progress 允许审批
- **当** 申请状态为 In Progress
- **则** 在用户具备审批权限时，Details 中提供审批操作

### 需求：复学审批工作流
系统应实现由审批操作驱动的 mock 多阶段审批工作流，而非手动选择状态。

#### 场景：批准并推进阶段
- **当** 管理员在 In Progress 申请的非最终阶段批准
- **则** 申请推进至下一审批阶段，状态保持 In Progress

#### 场景：最终批准
- **当** 管理员在最终阶段批准
- **则** 申请状态变为 Approved 并归档

#### 场景：需更新决定
- **当** 管理员选择 Update Required 并填写评论
- **则** 申请状态变为 Update Required，允许编辑并重新提交

#### 场景：拒绝申请
- **当** 管理员选择 Rejected 并填写评论
- **则** 申请状态变为 Rejected、归档，工作流终止

#### 场景：拒绝须填写评论
- **当** 管理员选择 Rejected 但未填写评论
- **则** 系统阻止该决定并显示校验提示

### 需求：复学列表提供工作流日志操作
系统应在每条复学申请行上提供 Workflow Log 操作，与状态无关。

#### 场景：工作流日志打开独立弹框
- **当** 用户点击复学行的 Workflow Log
- **则** 系统打开 ApprovalLogModal，以表格形式展示审批日志条目
- **且** 弹框副标题显示 application ID、student ID 和 student name
- **且** 详情弹框内不包含行内审批日志区块

#### 场景：无提交记录的 Draft 工作流日志
- **当** 用户点击无日志条目的 Draft 申请的 Workflow Log
- **则** 弹框打开并显示无数据提示

### 需求：复学详情弹框不内嵌审批日志
系统不得在 ResumptionDetailModal 内展示审批日志时间线。

#### 场景：详情弹框无日志区块
- **当** 用户打开任意复学申请的 Details
- **则** 详情弹框仅展示申请区块及进行中审批控件
- **且** 不展示行内审批日志列表

### 需求：复学状态演示 mock 数据
系统应提供覆盖 Draft、In Progress、Cancelled、Update Required、Rejected 和 Approved 的 mock 复学记录，每状态至少两条。

#### 场景：Draft 状态示例
- **当** 用户加载含 mock 数据的 Resumption History
- **则** 至少存在两条 Draft 记录，并提供 Edit 和 Delete 操作

#### 场景：In Progress 状态示例
- **当** 用户加载含 mock 数据的 Resumption History
- **则** 至少存在两条 In Progress 记录，其中一条为 Pending Review 且可 Cancel，另一条已超过 Pending Review 且不可 Cancel

#### 场景：Cancelled、Update Required、Rejected、Approved 示例
- **当** 用户加载含 mock 数据的 Resumption History
- **则** Cancelled、Update Required、Rejected 和 Approved 各状态至少存在两条记录

### 需求：复学页面支持双语 i18n
系统应通过 `resumption.*` i18n 命名空间，为 Resumption 页面全部 UI 文案（含六种状态徽章与工作流操作）提供完整中英文翻译。

#### 场景：英文语言区域
- **当** 用户将应用语言设为 English
- **则** Resumption 列表、表单、详情、状态徽章、声明与说明均显示 `en.js` 中的英文文案

#### 场景：中文语言区域
- **当** 用户将应用语言设为 Chinese
- **则** Resumption 列表、表单、详情、状态徽章、声明与说明均显示 `zh.js` 中的中文文案

### 需求：复学页面注册于学籍应用
系统应在 Student Records Application 中将 Resumption 注册为已开发页面。

#### 场景：侧边栏导航
- **当** 用户在侧边栏选择 Resumption
- **则** 系统展示 ResumptionView，而非施工中页面
