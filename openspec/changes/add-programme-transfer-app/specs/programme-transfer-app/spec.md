## 新增需求

### 需求：转专业列表页展示申请历史
系统应展示分页的转专业申请历史表格，列包括：Application ID、Student ID、Name、Type、Old Programme、New Programme、Status、Date 和 Actions。

#### 场景：默认列表加载
- **当** 用户在 Student Records 侧边栏导航至 Programme Transfer
- **则** 系统展示 Programme Transfer Application 页面，包含 Application History 表格及至少一条 mock 示例记录

#### 场景：Type 列取值
- **当** 列表中展示一条转专业记录
- **则** Type 列显示「Programme Transfer」（已本地化）

#### 场景：Status 徽章展示
- **当** 记录状态为 Draft、In Progress、Update Required、Approved、Rejected、Cancelled 或 Expired
- **则** 系统以只读徽章展示状态，样式区分明显（非可编辑下拉框）

### 需求：搜索转专业申请
系统应支持通过单一关键词字段按 Student ID 或 Name 搜索申请。

#### 场景：按学号搜索
- **当** 用户输入学号关键词并点击 Search
- **则** 列表仅显示匹配记录，并重置到第 1 页

#### 场景：按姓名搜索
- **当** 用户输入学生姓名关键词并点击 Search
- **则** 列表显示学生姓名匹配该关键词的记录

#### 场景：重置搜索
- **当** 用户清空关键词后再次搜索或使用 reset
- **则** 恢复当前 active/archived 标签下的完整筛选列表

### 需求：筛选进行中与已归档申请
系统应提供筛选，将进行中申请与已归档申请分开查看。

#### 场景：进行中筛选
- **当** 用户选择进行中筛选标签
- **则** 列表仅显示未归档记录（Draft、In Progress、Update Required）

#### 场景：已归档筛选
- **当** 用户选择已归档筛选标签
- **则** 列表仅显示已归档状态记录（Approved、Rejected、Cancelled、Expired）

### 需求：新建转专业申请
系统应允许用户通过「+ New Application」操作打开多区块表单弹框，创建新的转专业申请。

#### 场景：打开创建表单
- **当** 用户点击「+ New Application」
- **则** 系统打开 Programme Transfer Application 表单弹框，包含 Notes、Section I–IV，以及页脚操作 Cancel、Save Draft 和 Submit

#### 场景：保存草稿
- **当** 用户填写草稿必填字段并点击 Save Draft
- **则** 申请以 Draft 状态保存，并出现在进行中列表

#### 场景：提交申请
- **当** 用户完成所有提交必填字段（含声明与附件）并点击 Submit
- **则** 申请状态变为 In Progress，审批阶段为 Pending Review，除允许取消的情形外申请人不可编辑

#### 场景：每名学生仅一条有效申请
- **当** 用户尝试为已有非终态申请的学生创建或提交申请
- **则** 系统阻止该操作并显示校验提示

### 需求：转专业表单区块与原型一致
系统应渲染与 StudentSys 原型对齐的申请表单，包含下列区块与字段。

#### 场景：Section I 学生信息
- **当** 用户在表单中查看 Section I
- **则** 系统展示 Student ID（必填，可搜索选择）、Full Name、NRIC/Passport No.、Nationality、Email、Contact No. 和 Student Visa Expiry Date

#### 场景：Student ID 自动填充
- **当** 用户从学生档案数据中选择 Student ID
- **则** 系统自动填充 Section I 字段，以及 Section II 的 current programme、intake 和 school

#### 场景：Section II 转专业信息
- **当** 用户在表单中查看 Section II
- **则** 系统展示 Current Programme、Current Intake、Current School、New Programme (1st Choice, required)、New Programme (2nd Choice, optional)、Start Semester of New Programme（必填）和 Reasons to Transfer（必填多行文本）

#### 场景：Section III 声明
- **当** 用户查看 Section III
- **则** 系统展示声明文本及必填勾选框「I agree to the declaration」

#### 场景：Section IV 支持材料
- **当** 用户查看 Section IV
- **则** 系统展示必填附件上传（mock：文件名与大小），格式提示 PDF、JPG、PNG、DOCX，最大 5MB，并提供 Download Consent Letter 操作

#### 场景：Section VII 教务字段
- **当** 管理员在 Academic Affairs 审批阶段编辑
- **则** 系统展示 Section VII 字段 New Programme、New Intake 和 Date，仅供教务办公室使用

### 需求：编辑与删除草稿申请
系统应仅允许对 Draft 状态申请进行完整编辑与删除。

#### 场景：编辑草稿
- **当** 用户点击 Draft 申请的 Edit
- **则** 系统打开预填表单弹框，允许 Save Draft 或 Submit

#### 场景：删除草稿
- **当** 用户点击 Draft 申请的 Delete 并确认
- **则** 申请从列表中移除

#### 场景：非草稿不可删除
- **当** 用户查看列表中的非 Draft 申请
- **则** 不提供 Delete 操作

### 需求：审批开始前取消申请
系统应允许申请人在 Pending Review 阶段的 In Progress 申请上取消申请。

#### 场景：取消待审核申请
- **当** 用户点击 In Progress 且审批阶段为 Pending Review 的申请的 Cancel 并确认
- **则** 申请状态变为 Cancelled，进入归档，且不可编辑或重新提交

#### 场景：审批开始后不可取消
- **当** 申请审批阶段已超过 Pending Review
- **则** 不提供 Cancel 操作

### 需求：Update Required 允许编辑并重新提交
系统应允许对 Update Required 状态申请进行编辑并重新提交。

#### 场景：编辑需更新申请
- **当** 用户点击 Update Required 申请的 Edit
- **则** 系统打开表单弹框，可编辑所有申请人区块

#### 场景：更新后重新提交
- **当** 用户保存修改并在数据有效时点击 Resubmit
- **则** 申请恢复为 In Progress，审批阶段为 Pending Review，并在审批日志中追加一条重新提交记录

### 需求：终态为只读已归档
系统应将 Approved、Rejected、Cancelled 和 Expired 视为终态已归档，详情只读。

#### 场景：查看已通过详情
- **当** 用户点击 Approved 申请的 Details
- **则** 系统以只读模式展示所有区块及 Section VII 取值，无编辑或重新提交操作

#### 场景：Rejected 为终态
- **当** 申请在任一审批节点被 Rejected
- **则** 申请归档，不可编辑或重新提交

#### 场景：Expired 为终态
- **当** Draft 或 Update Required 申请超过申请截止日期（mock）
- **则** 系统可将其转为 Expired、归档，并禁止编辑或重新提交

### 需求：转专业审批工作流
系统应实现由审批操作驱动的 mock 多阶段审批工作流，而非手动选择状态。

#### 场景：审批阶段推进
- **当** 管理员在非最终阶段批准 In Progress 申请
- **则** 审批阶段按 Pending Review → Academic Affairs → Dean/HoP 推进，状态保持 In Progress

#### 场景：最终批准
- **当** 管理员在最终阶段批准且 Section VII 已填写完成
- **则** 申请状态变为 Approved、归档，并在审批日志中记录该决定

#### 场景：需更新决定
- **当** 管理员选择 Update Required 并填写评论
- **则** 申请状态变为 Update Required，退回申请人编辑

#### 场景：拒绝决定
- **当** 管理员选择 Rejected 并填写评论
- **则** 申请状态变为 Rejected、归档，工作流终止

#### 场景：详情中的审批日志
- **当** 用户打开已提交申请的 Details
- **则** 系统展示审批日志，包含 stage、actor、action、date/time 和 comment 条目

### 需求：提交时转专业表单校验
系统应在 Submit 或 Resubmit 前校验必填字段。

#### 场景：缺少必填字段
- **当** 用户未填写 Student ID、第一志愿专业、开学学期、转专业理由、声明或附件即点击 Submit
- **则** 系统阻止提交并显示行内校验提示

#### 场景：附件格式提示
- **当** 用户在 mock 上传器中选择附件文件
- **则** 系统仅存储文件元数据并显示所选文件名

### 需求：转专业页面注册于学籍应用
系统应在 Student Records Application 中将 Programme Transfer 注册为已开发页面。

#### 场景：侧边栏导航
- **当** 用户在 Student Records 侧边栏选择 Programme Transfer
- **则** 系统展示 ProgrammeTransferView，而非施工中页面

#### 场景：面包屑
- **当** 用户位于 Programme Transfer 页面
- **则** 面包屑显示 Student Status Management > Programme Transfer（已本地化）

## 修改需求

### 需求：搜索转专业申请
系统应支持通过 Student ID 或 Name 搜索申请；搜索栏位于列表页卡片第一行，采用字段标签后接输入控件的布局。

#### 场景：搜索栏为第一行且无页面标题
- **当** 用户导航至 Programme Transfer
- **则** 列表卡片不显示「Programme Transfer Application」等大号页内标题
- **且** 卡片第一行为搜索栏，含 Search 和 Reset 操作

#### 场景：搜索字段标签与输入含义一致
- **当** 用户查看搜索栏
- **则** 标签描述可搜索内容（如「Student ID or Name:」），文本输入与操作按钮位于同一行

#### 场景：按学号搜索
- **当** 用户输入学号关键词并点击 Search
- **则** 列表仅显示匹配记录，并重置到第 1 页

#### 场景：按姓名搜索
- **当** 用户输入学生姓名关键词并点击 Search
- **则** 列表显示学生姓名匹配该关键词的记录

#### 场景：重置搜索
- **当** 用户清空关键词并点击 Reset
- **则** 恢复当前 active/archived 标签下的完整筛选列表

### 需求：转专业表单区块与原型一致
系统应渲染与 StudentSys 原型对齐的申请表单区块，创建与编辑表单均包含 Section VII。

#### 场景：Section I 学生信息
- **当** 用户在表单中查看 Section I
- **则** 系统展示 Student ID（必填，可搜索选择）、Full Name、NRIC/Passport No.、Nationality、Email、Contact No. 和 Student Visa Expiry Date

#### 场景：Student ID 自动填充
- **当** 用户从学生档案数据中选择 Student ID
- **则** 系统自动填充 Section I 字段，以及 Section II 的 current programme、intake 和 school

#### 场景：Section II 转专业信息
- **当** 用户在表单中查看 Section II
- **则** 系统展示 Current Programme、Current Intake、Current School、New Programme (1st Choice, required)、New Programme (2nd Choice, optional)、Start Semester of New Programme（必填）和 Reasons to Transfer（必填多行文本）

#### 场景：Section III 声明
- **当** 用户查看 Section III
- **则** 系统展示声明文本及必填勾选框「I agree to the declaration」

#### 场景：Section IV 支持材料
- **当** 用户查看 Section IV
- **则** 系统展示必填附件上传（mock：文件名与大小），格式提示 PDF、JPG、PNG、DOCX，最大 5MB，并提供 Download Consent Letter 操作

#### 场景：创建表单可见 Section VII
- **当** 用户通过「+ New Application」打开创建申请表单
- **则** 系统在 Section IV 之后展示 Section VII，灰色区块标题为「FOR ACADEMIC AFFAIRS OFFICE USE ONLY」
- **且** 字段 New Programme (Select Programme)、New Intake (Select Intake) 和 Date (Please Select) 与原型布局一致

#### 场景：表单中 Section VII 布局
- **当** 用户在创建或编辑表单中查看 Section VII
- **则** New Programme 与 New Intake 位于第一行，Date 位于 New Programme 下方第二行

#### 场景：详情审批中的 Section VII 教务字段
- **当** 管理员在 Details 的 Academic Affairs 审批阶段编辑
- **则** 系统允许编辑 Section VII 字段 New Programme、New Intake 和 Date，仅供教务办公室使用

## 新增需求

### 需求：转专业 mock 数据覆盖各核心状态且每状态至少两条
系统应为各核心业务状态提供至少两条 mock 转专业记录：Draft、In Progress、Cancelled、Update Required、Rejected 和 Approved。

#### 场景：两条 Draft 示例
- **当** 用户加载 Programme Transfer Application History 列表
- **则** 至少两条记录状态为 Draft，且每条均支持 Edit 和 Delete 操作

#### 场景：两条 In Progress 示例及取消资格
- **当** 用户查看 In Progress 记录
- **则** 至少存在两条记录
- **且** 至少一条审批阶段为 Pending Review 并显示 Cancel 操作
- **且** 至少一条审批阶段已超过 Pending Review 且不显示 Cancel 操作

#### 场景：两条 Cancelled 示例为只读
- **当** 用户查看 Cancelled 记录
- **则** 至少存在两条已归档 Cancelled 记录
- **且** 均不显示 Edit、Delete 或 Resubmit 操作

#### 场景：两条 Update Required 示例允许重新提交
- **当** 用户查看 Update Required 记录
- **则** 至少存在两条记录，且每条均显示 Edit 操作以支持重新提交流程

#### 场景：两条 Rejected 示例为终态
- **当** 用户查看 Rejected 记录
- **则** 至少存在两条来自不同审批阶段的已归档 Rejected 记录
- **且** 均不允许 Edit 或 Resubmit

#### 场景：两条 Approved 示例为终态
- **当** 用户查看 Approved 记录
- **则** 至少存在两条已归档 Approved 记录，适用时 Section VII 取值已填充

### 需求：Cancelled 状态保留记录不删除
系统应将已取消申请转为 Cancelled 只读归档状态，且不从历史中移除记录。

#### 场景：取消不删除记录
- **当** 用户在 Pending Review 阶段取消 In Progress 申请
- **则** 记录仍保留在 Application History 中，状态为 Cancelled
- **且** 记录未从列表中物理删除

### 需求：转专业列表提供工作流日志操作
系统应在每条转专业申请行上提供 Workflow Log 操作，与状态无关。

#### 场景：工作流日志打开独立弹框
- **当** 用户点击转专业行的 Workflow Log
- **则** 系统打开 ApprovalLogModal，以表格形式展示审批日志条目
- **且** 详情弹框内不包含行内审批日志区块

#### 场景：无提交记录的 Draft 工作流日志
- **当** 用户点击无日志条目的 Draft 申请的 Workflow Log
- **则** 系统打开弹框并显示无数据提示
