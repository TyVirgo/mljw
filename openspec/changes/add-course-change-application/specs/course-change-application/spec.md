## 新增需求

### 需求：课程变更申请列表页
系统应在菜单 **Course Change Application** 提供列表页，用于管理针对 Course Information 中已批准课程的修订请求。

#### 场景：默认列表加载
- **当** 用户导航至 Course Change Application
- **则** 系统展示分页表格，列包括：No.、Status、Approval Stage、Course Name、Offering、Course Classification、Credit、Applicant、Application Date and Time 和 Actions

#### 场景：Status 徽章样式
- **当** 记录在列表中展示
- **则** status 徽章采用实底背景、白字，与 Course Application 列表样式一致

#### 场景：Actions 列固定与行布局
- **当** 表格内容横向溢出
- **则** Actions 列固定在右侧
- **且** 行内容采用足够行高与 `white-space: nowrap` 以保证可读性

### 需求：搜索与筛选变更申请
系统应支持按 Course Code、Course Name、Offering 和 Course Classification 搜索变更申请。

#### 场景：基础搜索布局
- **当** 用户查看搜索区域
- **则** Course Code、Course Name 和 Offering 位于第一行，Search 和 Reset 按钮右对齐于同一行
- **且** Course Classification 位于第二行
- **且** 筛选标签右对齐，使冒号垂直对齐

#### 场景：搜索筛选结果
- **当** 用户输入筛选条件并点击 Search
- **则** 列表仅显示匹配记录，并重置到第 1 页

#### 场景：重置筛选
- **当** 用户点击 Reset
- **则** 清空全部搜索字段并恢复完整列表

#### 场景：More 展开可选筛选
- **当** 用户点击 More
- **则** 可展示 Status、Applicant 等额外筛选，行为与 Course Application 列表一致

### 需求：工具栏操作
系统应在变更申请列表页提供工具栏操作 **Create**、**Delete**、**Export**、**Submit** 和 **Withdraw**。

#### 场景：Create 打开向导
- **当** 用户点击 Create
- **则** 系统以 create 模式打开四步变更申请向导

#### 场景：Delete 草稿申请
- **当** 用户选中一条或多条 Temporary saved 记录并点击 Delete
- **则** 系统显示确认对话框
- **且** 确认后仅移除可删除的草稿记录

#### 场景：Export 列表
- **当** 用户点击 Export 并确认字段选择
- **则** 系统下载筛选后变更申请数据的 Excel 文件

#### 场景：Submit 草稿须二次确认
- **当** 用户选中 Temporary saved 记录并点击 Submit
- **则** 系统显示 Submit Confirmation 二次确认对话框
- **且** 确认后状态变为 In Progress，审批阶段设为 HoD/HoP Review
- **且** 向 approvalLog 追加条目

#### 场景：Withdraw 进行中申请
- **当** 用户选中 In Progress 记录并点击 Withdraw
- **则** 系统显示确认对话框
- **且** 确认后状态变为 Temporary saved，审批阶段设为 `--`
- **且** 向 approvalLog 追加条目

#### 场景：不符合条件的选中禁用 Submit 与 Withdraw
- **当** 用户选中的记录不符合 Submit 或 Withdraw 条件
- **则** 对应工具栏操作禁用或显示适当提示

### 需求：按状态提供行操作
系统应根据申请状态提供行操作。

#### 场景：Edit 草稿
- **当** 用户点击 Temporary saved 行的 Edit
- **则** 系统以 edit 模式打开四步向导

#### 场景：非草稿查看 Details
- **当** 用户点击 In Progress、Approved 或 Rejected 行的 Details
- **则** 系统打开只读四步详情视图

#### 场景：Approval log
- **当** 用户点击至少提交过一次行的 Approval Log
- **则** 系统展示该变更申请的按时间顺序审批历史

#### 场景：Rejected 记录为只读终态
- **当** 变更申请状态为 Rejected
- **则** 不提供 Edit、Submit 和 Withdraw
- **且** 仅显示 Details 和 Approval Log
- **且** 不可重新提交；用户须新建变更申请以请求进一步变更

### 需求：Course Code 不可变
系统不得允许在变更申请中修改 Course Code。

#### 场景：向导中 Course Code 只读
- **当** 用户查看或编辑 Basic Information 步骤
- **则** Course Code 以只读形式展示
- **且** 其值始终与所选 baseline course 一致

#### 场景：校验强制 baseline course code
- **当** 用户保存或提交变更申请
- **则** 若 courseCode 与 baseline snapshot 的 courseCode 不一致，系统拒绝该操作

### 需求：Baseline 课程选择
系统要求在完成变更申请前，从 Course Information 选择一条已批准的 baseline 课程。

#### 场景：步骤 1 选择 baseline 课程
- **当** 用户在 Change Description 步骤点击 Choose
- **则** 系统打开课程选择对话框，列出 Course Information 中的课程
- **且** 用户恰好选择一门课程

#### 场景：从 baseline 自动填充
- **当** 用户确认 baseline 课程选择
- **则** 系统将 baseline 的一般信息、CLO 和 SLT 数据复制到变更申请
- **且** 存储 baseline snapshot 供后续对比与回写

#### 场景：首次保存后 baseline 锁定
- **当** 用户已保存变更申请草稿
- **则** 不得更换 baseline 课程，除非新建申请

### 需求：四步变更向导
系统应提供四步向导：Change Description、Basic Information、Course Learning Outcome (CLO) 和 Student Learning Time (SLT)。

#### 场景：Stepper 导航
- **当** 用户查看向导 stepper
- **则** 步骤可点击，在 detail 模式直接跳转，或在 edit 模式通过校验后跳转
- **且** 仅当前步骤以蓝色高亮

#### 场景：向导页眉操作
- **当** 用户处于 create 或 edit 模式
- **则** 页眉提供 Back（含离开确认）、Cancel、Previous、Next 和 Save
- **且** Save 可在任一步骤将申请持久化为 Temporary saved

#### 场景：Next 时步骤校验
- **当** 用户点击 Next
- **则** 系统在前进前校验当前步骤
- **且** 步骤 1 要求 baseline 课程与 change description 选择
- **且** 步骤 2 要求 basic information 字段有效
- **且** 步骤 3 要求至少一条 CLO

### 需求：Change description 标注
系统应允许在步骤 1 将各变更组件标记为 Major Changes 或 Minor / No Changes。

#### 场景：Main components
- **当** 用户在 Change Description 步骤查看 MAIN COMPONENTS
- **则** 系统列出 Course Name、Credit Value、Course Classification 和 CLO
- **且** 每行可选择 Major Changes 或 Minor / No Changes

#### 场景：Other components
- **当** 用户在 Change Description 步骤查看 OTHER COMPONENTS
- **则** 系统列出 Synopsis、Pre-requisite / co-requisite、Teaching Methods、Course Content、Assessment Methods 和 References
- **且** 每行可选择 Major Changes 或 Minor / No Changes

#### 场景：默认标注
- **当** 用户首次加载新申请的 Change Description
- **则** 全部组件默认为 Minor / No Changes，除非用户修改

### 需求：Basic Information 步骤
系统应提供 Basic Information 步骤，字段与 Course Information 一般信息相同，并从 baseline 课程预填。

#### 场景：与 Course Information 字段一致
- **当** 用户查看 Basic Information 步骤
- **则** 字段包括 Course Code、Course Name、Offering、Course Owner、Course Classification、Credit、Medium of Instruction、Semester Type、Pre-requisite / co-requisite、Synopsis 和 References
- **且** Course Code 只读，与 baseline 课程一致
- **且** 其他必填字段校验规则与 Course Application / Course Information 一致

### 需求：CLO 与 SLT 步骤
系统应提供与 Course Application 向导行为一致的 CLO 与 SLT 步骤。

#### 场景：CLO 管理
- **当** 用户在 edit 模式位于 CLO 步骤
- **则** 系统通过共享 CLO 表单弹框支持 CLO 行的 Create、Edit 和 Delete
- **且** 前进前至少须有一条 CLO

#### 场景：SLT 管理
- **当** 用户位于 SLT 步骤
- **则** 系统使用共享 SLT 步骤面板展示 Course Content Outline、Continuous Assessment 和 Final Assessment 子模块

### 需求：只读详情视图
系统应为已提交及已完成的变更申请提供只读详情视图。

#### 场景：详情布局一致
- **当** 用户打开 Details
- **则** 四步均可查看，结构与 edit 模式相同
- **且** Change Description 以只读形式展示 major/minor 标注
- **且** Basic Information 使用共享只读一般信息布局，与 Course Information 详情样式对齐

### 需求：最终批准回写辅助函数
系统应提供数据层辅助函数，将已批准变更回写至 Course Information；完整审批 UI 应在 Course Change Review 模块实现。

#### 场景：辅助函数合并已批准数据
- **当** 调用 `applyApprovedChangeToCourse`，传入已批准变更申请与共享 courses 集合
- **则** 系统以已批准 form、CLO 和 SLT 数据更新 baseline 课程
- **且** 使用现有 course change log builder 追加变更记录
- **且** 将变更申请状态设为 Approved，审批阶段设为 Approved

#### 场景：申请模块不暴露审批 UI
- **当** 用户在 v1 使用 Course Change Application
- **则** 申请列表上无 Approval 弹框或阶段推进 UI
- **且** 最终批准与回写仅通过 Review 模块调用辅助函数（或测试/demo 调用）触发

#### 场景：已批准变更申请只读
- **当** 变更申请状态为 Approved
- **则** 不可在变更申请列表中编辑或重新提交

### 需求：破坏性操作与提交操作的确认对话框
系统应对 Submit、Withdraw、Delete 及向导未保存离开时要求二次确认。

#### 场景：Submit 确认
- **当** 用户从工具栏确认 Submit
- **则** 状态变更前显示 Submit Confirmation 对话框

#### 场景：Withdraw 确认
- **当** 用户从工具栏确认 Withdraw
- **则** 回退为草稿前显示确认对话框

#### 场景：离开向导确认
- **当** 用户在向导中有未保存更改时点击 Back 或 Cancel
- **则** 返回列表前显示离开确认对话框
