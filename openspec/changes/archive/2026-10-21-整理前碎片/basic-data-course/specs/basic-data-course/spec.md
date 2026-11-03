# 基础数据-课程信息与开课申请 规格（合并）

## 说明

以下为各历史 delta spec 原文按来源拼接并做术语中文化处理。整理正式需求文档时，应按场景重写为「用户故事 / 验收标准」，消除重复与过时条目。

## 来源 `add-course-application` / 能力 `course-application`

## 新增需求

### 需求：课程申请列表页
系统应展示分页的课程申请表格，列包括：No.、Status、Approval Stage、Course Name、Offering、Course Classification、Credit、Applicant、Application Date and Time 和 Actions（Details、Approval Log）。

#### 场景：默认列表加载
- **当** 用户导航至 Course Application
- **则** 系统展示申请记录第一页，包含上述全部列

#### 场景：Status 徽章颜色
- **当** 申请状态为 In Progress、Approved、Temporary saved 或 Rejected
- **则** 系统以区分明显的徽章样式展示状态（分别为蓝色、绿色、灰色、红色）

### 需求：搜索与筛选申请
系统应支持按 Course Code、Course Name、Offering 和 Course Classification 搜索，并可通过 More 展开可选筛选。

#### 场景：基础搜索
- **当** 用户输入 Course Code 或 Course Name 并点击 Search
- **则** 列表仅显示匹配记录，并重置到第 1 页

#### 场景：重置筛选
- **当** 用户点击 Reset
- **则** 清空全部搜索字段并恢复完整列表

### 需求：通过三步向导申请新课程
系统应提供全页 Apply New Course 流程，包含三步：(1) General Information、(2) Course Learning Outcome (CLO)、(3) 学生Learning Time (SLT)。

#### 场景：向导导航
- **当** 用户点击 Apply New Course
- **则** 列表替换为全页向导，含可点击步骤指示器、Back 按钮，以及页眉区域的 Previous / Next / Save 控件
- **且** 步骤内容在可滚动页面区域内行内渲染，而非大型 modal 弹框内

#### 场景：步骤指示器仅高亮当前步骤
- **当** 用户位于向导某一步
- **则** 仅当前步骤标题与圆圈为激活样式（蓝色）
- **且** 其他步骤标题保持非激活（灰色）

#### 场景：点击步骤跳转
- **当** 用户点击步骤指示器中的步骤标题
- **则** 向导直接导航至该步骤内容

#### 场景：返回确认
- **当** 用户点击 Back
- **则** 系统在返回列表前显示确认对话框

#### 场景：从页眉保存
- **当** 用户点击向导页眉中的 Save
- **则** 申请以 Temporary saved 状态保存，不使用 Cancel 按钮
- **且** Save 位于 Next 右侧

#### 场景：步骤 1 — General Information 布局
- **当** 用户位于步骤 1
- **则** 系统展示与 Course Information 相同的一般字段，采用双列可滚动表单布局
- **且** Credit 字段输入宽度与同列 select 下拉框宽度一致

#### 场景：进入步骤 3 前须填写 CLO
- **当** 用户在步骤 2 且 CLO 记录为零条时点击 Next
- **则** 系统阻止导航并显示校验提示：至少须有一条 CLO

#### 场景：保存时须填写 CLO
- **当** 用户在步骤 3 且 CLO 记录为零条时尝试保存申请
- **则** 系统阻止保存并显示校验提示：至少须有一条 CLO

#### 场景：步骤 2 — CLO 管理
- **当** 用户位于步骤 2
- **则** 系统展示 CLO 表格，含 Create 和 Delete 操作，以及每行 Edit 和 Delete
- **且** Create 打开弹框，字段含 CLO、Outcome（最多 100 字符）、Bloom's Taxonomy Level（单选）、Teaching Methods（多选）和 Assessment Methods（多选）

#### 场景：CLO 字段选项
- **当** 用户选择 Bloom's Taxonomy Level
- **则** 选项包括 A1–A5、C1–C6 和 P1–P7
- **当** 用户选择 Teaching Methods
- **则** 选项包括 Lecture、Practical 和 Others（多选）
- **当** 用户选择 Assessment Methods
- **则** 选项包括 Assignments、Quiz、Mid-term Examination、Practical Test、Lab Report、Presentation、Project 和 Final Examination（多选）

#### 场景：步骤 3 — SLT 管理
- **当** 用户位于步骤 3
- **则** 系统提供 Course Content Outline and Subtopics、Continuous Assessment 和 Final Assessment 子区块，各含表格 CRUD 与 Create 弹框

#### 场景：Course content outline 弹框
- **当** 用户创建 course content outline 条目
- **则** 弹框要求填写 Course Content 与 CLO 选择，并提供 F2F Physical、F2F Online/Technology-mediated 和 NF2F 的 Learning Time 输入，Total SLT 自动计算

#### 场景：Continuous 与 final assessment 弹框
- **当** 用户创建 continuous 或 final assessment 条目
- **则** 弹框要求填写 assessment type 与 percentage，并提供 Learning Time 字段，Total SLT 自动计算

#### 场景：保存草稿
- **当** 用户完成向导并在最后一步确认保存
- **则** 申请以 Temporary saved 状态保存，并出现在列表中

### 需求：提交申请以供审核
系统应允许将选中的 Temporary saved 申请提交审批。

#### 场景：从列表提交
- **当** 用户选中一条或多条 Temporary saved 申请并点击 Submit
- **则** 每条选中申请状态变为 In Progress，审批阶段为 HoD/HoP Review，并在 approval log 中追加条目

#### 场景：Rejected 申请不可重新提交
- **当** 申请状态为 Rejected
- **则** 系统不提供 Edit 或 Submit 操作
- **且** Details 和 Approval Log 仍可作为只读操作使用

### 需求：查看详情与审批日志
系统应为每条申请提供只读 Details 与 Approval Log。

#### 场景：Details
- **当** 用户点击列表行的 Details
- **则** 系统打开三步向导数据的只读视图

#### 场景：Approval log
- **当** 用户点击列表行的 Approval Log
- **则** 系统按时间顺序展示该申请的审批事件列表

### 需求：删除与导出申请
系统应支持批量删除与导出申请记录。

#### 场景：删除须确认
- **当** 用户选中申请并点击 Delete
- **则** 系统提示确认并移除可删除记录（Approved 申请不得删除）

#### 场景：Export
- **当** 用户点击 Export 并选择字段
- **则** 系统下载筛选后申请列表数据的 Excel 文件

#### 场景：Import 占位
- **当** 用户点击 Import
- **则** 系统显示占位提示：导入功能尚未开放
- **且** 本阶段不执行文件上传或 Excel 解析

### 需求：按状态限制编辑权限
系统应仅允许编辑 Temporary saved 申请。

#### 场景：仅草稿可编辑
- **当** 用户打开 Temporary saved 申请进行编辑
- **则** 三步向导以可编辑 apply 模式打开

#### 场景：其他状态不可编辑
- **当** 申请状态为 In Progress、Approved 或 Rejected
- **则** 系统不提供 Edit 操作；仅提供 Details 和 Approval Log（适用时）

### 需求：应用注册
系统应将 Course Application 注册为可从 Course Info 子菜单访问的已开发页面。

#### 场景：菜单访问
- **当** 用户在侧边栏点击 Course Application
- **则** 加载 Course Application 视图，而非 Under Construction

## 来源 `add-course-change-application` / 能力 `course-change-application`

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
系统应提供四步向导：Change Description、Basic Information、Course Learning Outcome (CLO) 和 学生Learning Time (SLT)。

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

## 来源 `add-new-course-approval` / 能力 `course-application`

## 修改需求

### 需求：Submit applications for review
系统应允许将选中的 Temporary saved 申请提交审批，并使其在 New Course Approval 队列中可见。

#### 场景：从列表 Submit
- **当** 用户选中一条或多条 Temporary saved 申请并点击 Submit
- **则** 每条选中申请的 status 变为 In Progress，approvalStage 为 HoD/HoP Review，并追加 approvalLog 条目
- **且** 每条已提交申请在 New Course Approval 列表页可见

#### 场景：Rejected 申请不可重新提交
- **当** 申请 status 为 Rejected
- **则** 系统不提供 Edit 或 Submit 操作
- **且** Details 与 Approval Log 仍可作为只读操作使用

#### 场景：Update Required 退回草稿
- **当** 审批人在 New Course Approval 页面对申请选择 Update Required
- **则** 申请在 Course Application 中 status 变为 Temporary saved
- **且** 申请人可再次编辑并 Submit

### 需求：View details and approval log
系统应为每条申请提供只读 Details 与 Approval Log。

#### 场景：Approval log
- **当** 用户点击列表行的 Approval Log
- **则** 系统展示该申请的按时间排序审批事件列表
- **且** 事件包含来自 New Course Approval 模块的审批人操作

## 来源 `add-new-course-approval` / 能力 `new-course-approval`

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

## 来源 `align-change-description-step-ui` / 能力 `course-change-application`

## 修改需求

### 需求：Change description 标注
系统应允许在步骤 1 将各变更组件标记为 Major Changes 或 Minor / No Changes，采用与 UI 原型对齐的三列表格布局。

#### 场景：三列表格布局
- **当** 用户在 create 或 edit 模式查看 Change Description 步骤
- **则** 各组件区块（MAIN COMPONENTS 和 OTHER COMPONENTS）以表格展示，列包括：Component Name、Major Changes 和 Minor / No Changes
- **且** 表头行标注 Major Changes 与 Minor / No Changes 列
- **且** 区块标题左侧显示蓝色竖向强调条

#### 场景：各组件 major 与 minor 判定标准
- **当** 用户查看组件行
- **则** Major Changes 列显示 pill 切换（N/Y）及 bullet-list 判定标准，说明该组件何种变更属于 major change
- **且** Minor / No Changes 列显示 pill 切换（N/Y）及 bullet-list 判定标准，说明何种变更属于 minor 或 no change
- **且** 判定标准文案与各组件原型定义一致

#### 场景：切换互斥选择
- **当** 用户点击某组件 Major Changes 列的切换
- **则** 该列切换显示 Y（蓝色/激活），Minor / No Changes 列切换显示 N（灰色/非激活）
- **且** 该组件存储值为 `major`

#### 场景：选择 minor changes
- **当** 用户点击某组件 Minor / No Changes 列的切换
- **则** 该列切换显示 Y（蓝色/激活），Major Changes 列切换显示 N（灰色/非激活）
- **且** 该组件存储值为 `minor`

#### 场景：Main components
- **当** 用户在 Change Description 步骤查看 MAIN COMPONENTS
- **则** 系统列出 Course Name、Credit Value、Course Classification 和 CLO
- **且** 每行通过双列切换模式选择 Major Changes 或 Minor / No Changes

#### 场景：Other components
- **当** 用户在 Change Description 步骤查看 OTHER COMPONENTS
- **则** 系统列出 Synopsis、Pre-requisite / co-requisite、Teaching Methods、Course Content、Assessment Methods 和 References
- **且** 每行通过双列切换模式选择 Major Changes 或 Minor / No Changes

#### 场景：默认标注
- **当** 用户首次加载新申请的 Change Description
- **则** 全部组件默认为 Minor / No Changes，除非用户修改

#### 场景：只读详情视图
- **当** 用户在 detail（readonly）模式查看 Change Description 步骤
- **则** 展示相同三列表格布局，切换以禁用状态反映已保存的 major/minor 选择

## 新增需求

### 需求：Change description 判定标准内容
系统应展示组件特定的判定标准 bullet 列表，引导教师选择正确的变更级别。

#### 场景：Course Name 判定标准
- **当** 用户查看 Course Name 行
- **则** Major Changes 判定标准包括「Change course name to reflect the change in course content.」
- **且** Minor / No Changes 判定标准包括「Improve the grammar of the course name.」和「No change.」

#### 场景：Credit Value 判定标准
- **当** 用户查看 Credit Value 行
- **则** Major Changes 判定标准包括「Add or reduce the credit value of the course.」
- **且** Minor / No Changes 判定标准包括「Change credit value to meet MQA/EAC standards.」和「No change.」

#### 场景：Course Classification 判定标准
- **当** 用户查看 Course Classification 行
- **则** Major Changes 判定标准包括「Change course classification, e.g. from major to elective.」
- **且** Minor / No Changes 判定标准包括「Change course classification to meet MQA/EAC standards.」和「No change.」

#### 场景：CLO 判定标准
- **当** 用户查看 CLO 行
- **则** Major Changes 判定标准包括「Add or remove CLOs.」
- **且** Minor / No Changes 判定标准包括「Improve the grammar of the CLOs.」、「Rearrange the sequence of the CLOs.」、「Combine the CLOs.」和「No change.」

#### 场景：Synopsis 判定标准
- **当** 用户查看 Synopsis 行
- **则** Major Changes 判定标准包括「Revise the synopsis to reflect the change in course content.」
- **且** Minor / No Changes 判定标准包括「Rephrase the synopsis.」、「Improve the grammar of the synopsis.」和「No change.」

#### 场景：Pre-requisite 判定标准
- **当** 用户查看 Pre-requisite / co-requisite 行
- **则** Major Changes 判定标准包括「Add, remove, or revise the pre-requisite / co-requisite of the course.」
- **且** Minor / No Changes 判定标准包括「No change.」

#### 场景：Teaching Methods 判定标准
- **当** 用户查看 Teaching Methods 行
- **则** Major Changes 判定标准包括「Add or reduce the number of lectures (L), tutorials (T), practical (P).」、「Revise the teaching strategy, e.g. from classroom delivery (CD) to podcast.」和「No change.」
- **且** Minor / No Changes 判定标准包括「No change.」

#### 场景：Course Content 判定标准
- **当** 用户查看 Course Content 行
- **则** Major Changes 判定标准包括「Add or reduce topic in the course content.」
- **且** Minor / No Changes 判定标准包括「Rearrange the topics.」、「Update the topics.」、「Add or reduce subtopics in the topics.」和「No change.」

#### 场景：Assessment Methods 判定标准
- **当** 用户查看 Assessment Methods 行
- **则** Major Changes 判定标准包括「Change the percentage of continuous assessment and final assessment.」
- **且** Minor / No Changes 判定标准包括「Revise the coursework components, e.g. test, assignment, etc.」、「Revise the exam hours.」和「No change.」

#### 场景：References 判定标准
- **当** 用户查看 References 行
- **则** Major Changes 判定标准包括「Add or reduce the main or additional references.」
- **且** Minor / No Changes 判定标准包括「Update the publication year or edition of the references.」、「Revise the referencing system, e.g. from MLA to APA.」和「No change.」

## 来源 `polish-course-library-import-footer` / 能力 `course-registration`

## ADDED Requirements

### Requirement: 课程库导入弹窗页脚布局
「从课程库导入」弹窗页脚 必须与选择类弹窗模板一致：左侧分页、右侧操作按钮；取消与导入选中 必须使用标准按钮样式（非裸文字链接态）。

#### Scenario: 页脚分区
- **WHEN** 用户打开从课程库导入弹窗
- **THEN** 页脚左侧为分页控件，右侧为「取消」与「导入选中（n）」
- **AND** 两按钮为描边次要按钮与主色主按钮样式

#### Scenario: 分页与按钮同一视觉行
- **WHEN** 页脚展示分页
- **THEN** 分页区域不额外叠加与页脚重复的顶部分割线，与操作按钮水平对齐

## 来源 `polish-course-list-pager-filter` / 能力 `course-registration`

## ADDED Requirements

### Requirement: 不可选操作为感叹号提示真实原因
当课程不可立即选课时，操作列 必须以感叹号图标展示，悬停或聚焦 必须显示该课不可选的真实原因。Demo 必须至少包含「先修课未修读」与「先修课成绩不及格」两类原因样例。

### Requirement: 课程列表分页与完整 demo
在线选课课程列表 必须支持分页。Demo 数据 必须覆盖可选有余量、已满可候补、已选/排队中、以及多种不可选原因等主要状态。

### Requirement: 学分漏斗筛选
学分列表头 必须使用漏斗图标打开筛选条件，学生 必须能选择学分过滤列表行；有生效筛选时筛选入口 必须可辨识。

## 来源 `redesign-prerequisite-modal` / 能力 `prerequisite-course-modal`

## 新增需求

### 需求：先修课程选择弹框布局
系统应在用户点击课程向导中 Pre-requisite / co-requisite 的 **Choose** 时，展示宽 **Add** 弹框，布局与原型一致，含搜索区域、数据表格、分页，以及 Discard / Confirm 页脚。

#### 场景：弹框以 Add 为标题打开
- **当** 用户点击 Pre-requisite / co-requisite 的 Choose
- **则** 系统打开标题为 **Add**、宽度约 1000px 的弹框
- **且** 先前已选 course code 保持勾选状态

#### 场景：排除当前课程
- **当** 向导正在编辑或创建 code 为 `X` 的课程
- **则** 课程 `X` 不出现在可选列表中

### 需求：先修课程搜索筛选
系统应提供 Course Name、Course Code 和 Offering 搜索筛选，以及 Search 和 Reset 操作。

#### 场景：Search 应用筛选
- **当** 用户输入筛选值并点击 Search
- **则** 表格仅显示匹配全部非空筛选条件的课程（文本字段不区分大小写部分匹配）
- **且** 分页重置到第 1 页

#### 场景：Reset 清空筛选
- **当** 用户点击 Reset
- **则** 清空全部搜索字段
- **且** 表格展示完整可用课程列表

#### 场景：Offering 筛选
- **当** 用户选择 Offering 单位并点击 Search
- **则** 仅显示该 offering code 的课程

### 需求：先修课程选择表格
系统应展示分页表格，列包括：checkbox、No.、Course code、Course Name、Offering、Credit Value 和 Course Classification。

#### 场景：表格列与数据
- **当** 弹框列出课程
- **则** 每行显示序号、course code、course name、offering 标签（通过 department lookup）、credit value 和已翻译的 course classification

#### 场景：多选课程
- **当** 用户勾选一行或多行并点击 Confirm
- **则** 向导 Pre-requisite 字段更新为所选 course code，以逗号加空格连接
- **且** 弹框关闭

#### 场景：Discard 不保存
- **当** 用户点击 Discard 或关闭控件
- **则** 弹框关闭，不更新向导字段

#### 场景：表头全选当前页
- **当** 用户勾选某页的表头 checkbox
- **则** 当前页全部课程被选中
- **且** 其他页的选中状态保持不变

#### 场景：跨页选中保留
- **当** 用户在第 1 页选中课程，导航至第 2 页并选中更多课程
- **则** 全部选中 course code 保留，直至 Confirm 或 Discard

### 需求：先修弹框分页
系统应使用共享 TablePagination 组件对筛选结果分页。

#### 场景：默认分页
- **当** 匹配筛选条件的课程超过 10 条
- **则** 系统默认每页显示 10 条记录，并显示总记录数

#### 场景：更改每页条数
- **当** 用户更改每页记录数
- **则** 表格以新 page size 刷新并返回第 1 页

### 需求：向导中复用先修弹框
系统应在 Course Information 与 Course Application 向导中使用相同的先修选择弹框，且不改变父组件集成方式。

#### 场景：Course Information 向导
- **当** 用户从 Course Information 创建或编辑向导中选择先修课程
- **则** 弹框接收 courses 列表，Confirm 时返回逗号分隔的 code

#### 场景：Course Application 向导
- **当** 用户从 Course Application apply 向导中选择先修课程
- **则** 使用 applications 派生课程列表，弹框行为相同

## 来源 `refine-approval-modal-action-labels` / 能力 `approval-modal`

## 新增需求

### 需求：审核弹框操作选项文案
系统应在所有审核弹框的操作单选行中，以操作导向的中文文案展示三个审批选项：通过（Pass）、不通过（Not Pass）、驳回（Return），分别对应存库动作值 Approved、Rejected、Update Required。底层 action 值、校验规则与工作流引擎行为保持不变。

#### 场景：异动审批弹框文案
- 当用户从异动审批列表、异动申请详情抽屉或等效的异动审核入口打开审核弹框时，则「操作」行在中文界面下恰好显示三个选项：通过、不通过、驳回；且选择任一选项将提交对应的 Approved、Rejected 或 Update Required 动作值

#### 场景：课程审批弹框文案
- 当用户从新课程审批、课程变更审批或课程申请详情抽屉打开审核弹框时，则「操作」行显示与异动审批弹框相同的三个操作导向文案

#### 场景：弹框外状态展示不变
- 当用户在本变更后查看申请列表状态徽章或状态筛选下拉时，则记录状态仍显示「已通过」「已驳回」等结果态文案，不会被替换为「通过」或「不通过」；且仅审核弹框的「操作」单选行使用操作导向文案

#### 场景：备注校验规则不变
- 当用户在审核弹框中选择不通过（Rejected）或驳回（Update Required）时，则确认前仍须填写 Comments
- 当用户在审核弹框中选择通过（Approved）时，则备注必填规则仍按各模块既有校验逻辑执行

## 来源 `refine-course-list-status-ux` / 能力 `course-registration`

## ADDED Requirements

### Requirement: 学分列表头可筛选
在线选课课程表的学分列表头 必须提供筛选控件，学生 必须能按选定学分过滤列表行。

### Requirement: 名额与选课状态分列展示
名额状态列 必须始终展示容量信息。已选或排队中的课程 必须在选课状态列展示「已选/排队中」，必须NOT 用该文案覆盖名额状态列。选课状态列 必须区分可选、不可选与已选/排队中。

### Requirement: 不可选行可看详情并提示原因
不可选课程行的「详情」必须可点击且 必须NOT 因整行置灰而不可辨认。操作区 必须NOT 展示禁用的「立即选课」按钮作为唯一反馈；必须以可悬停查看的原因说明替代（例如先修未修读或未通过）。

#### Scenario: 已占用课仍显示容量
- **WHEN** 某课已选或排队中
- **THEN** 名额状态仍显示容量文案，选课状态显示已选/排队中
