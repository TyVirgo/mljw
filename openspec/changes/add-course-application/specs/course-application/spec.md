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
系统应提供全页 Apply New Course 流程，包含三步：(1) General Information、(2) Course Learning Outcome (CLO)、(3) Student Learning Time (SLT)。

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
