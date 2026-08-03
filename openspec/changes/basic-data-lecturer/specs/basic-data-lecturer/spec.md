# 基础数据-教师与评教设置 规格（合并）

## 说明

以下为各历史 delta spec 原文按来源拼接并做术语中文化处理。整理正式需求文档时，应按场景重写为「用户故事 / 验收标准」，消除重复与过时条目。

## 来源 `add-evaluation-settings` / 能力 `evaluation-settings`

## 新增需求

### 需求：Evaluation Settings 页面布局与配置原型一致
系统应将 Evaluation Settings 展示为单页配置表单，不含搜索、筛选或分页控件。

#### 场景：页面区块
- **当** 用户导航至 Evaluation Settings
- **则** 系统按顺序展示：全局信息横幅、New Lecturer 区块、Change in Lecturer Category 区块、「+ Create」控件，以及右下角 Save 按钮

#### 场景：无查询或搜索
- **当** 用户查看 Evaluation Settings
- **则** 系统不展示搜索字段、查询按钮或列表/表格检索控件

### 需求：全局评估信息横幅
系统应展示醒目信息横幅，说明新入职教师或教师类型变更可触发教师评估需求。

#### 场景：英文横幅
- **当** 语言区域为 English
- **则** 横幅文案等价于：「New lecturer or lecturer category change triggers the requirement for a prompt teacher evaluation.」

#### 场景：中文横幅
- **当** 语言区域为 Chinese
- **则** 横幅文案等价于：「新入职教师或教师类型变更会触发教师评估需求。」

### 需求：New Lecturer 全局评估开关
系统应提供 New Lecturer 区块，含描述标签与全局启用/禁用开关，控制无任何教学记录的新讲师是否须评估。

#### 场景：新讲师定义
- **当** 在 mock/demo 模式下应用评估规则
- **则** 仅当讲师有入职日期（`dateOfJoining`）且无教学记录（`hasTeachingRecord` 为 false 或等价 mock 字段）时，才符合「new lecturer」

#### 场景：区块内容（英文）
- **当** 语言区域为 English
- **则** 区块标题为「New Lecturer」，描述等价于：「New lecturers without any teaching experience are required to undergo teacher evaluation.」

#### 场景：区块内容（中文）
- **当** 语言区域为 Chinese
- **则** 区块标题为「新入职教师」，描述等价于：「新入职且无教学经验的教师，需进行教师评估。」

#### 场景：开关位置
- **当** 渲染 New Lecturer 区块
- **则** 启用/禁用开关位于区块行右侧

### 需求：类型变更评估规则
系统应允许管理员定义一条或多条讲师类型变更规则。每条规则应包含：源类型（Category change from / 教师由）、目标类型（to / 变更为）、Delete 操作，以及该规则的启用/禁用开关。

#### 场景：规则行英文模板
- **当** 语言区域为 English 且展示规则行
- **则** 行文案等价于：「Category change from [dropdown] to [dropdown] requires teacher evaluation for providing information.」，右侧含 Delete 与规则开关

#### 场景：规则行中文模板
- **当** 语言区域为 Chinese 且展示规则行
- **则** 行文案等价于：「教师由 [dropdown] 变更为 [dropdown] ，需进行评估。」，右侧含「删除」与规则开关

#### 场景：Category 下拉选项
- **当** 用户在规则行打开 category 下拉框
- **则** 选项与讲师 Category 值一致（Full-time Lecturer、China Seconded Lecturer、学生Teaching Assistant、Part-time Lecturer）

#### 场景：默认 mock 规则
- **当** 用户首次打开 Evaluation Settings 且无已保存配置
- **则** 系统预加载与原型一致的示例规则：Part-time Lecturer → Full-time Lecturer（enabled）和 学生Teaching Assistant → Full-time Lecturer（enabled）

### 需求：创建与删除类型变更规则
系统应允许通过「+ Create」/「+ 新增」新增类型变更规则，并通过 Delete / 删除 移除现有规则。

#### 场景：新增规则
- **当** 用户点击「+ Create」
- **则** 系统追加新的可编辑规则行，from/to 选择为空，规则开关默认开启

#### 场景：删除规则须确认
- **当** 用户点击规则行的 Delete
- **则** 系统在从待保存配置中移除该规则前显示确认对话框

#### 场景：取消删除
- **当** 用户点击 Delete 后在确认对话框中取消
- **则** 规则行保持不变

### 需求：保存评估设置
系统应在用户点击 Save / 保存 时持久化评估设置，并提供成功反馈。

#### 场景：保存时校验
- **当** 用户点击 Save，且任一启用规则缺少 from/to、from 与 to 相同，或与另一启用规则重复
- **则** 系统阻止保存并显示校验提示

#### 场景：保存成功
- **当** 用户点击 Save 且配置有效
- **则** 系统持久化设置（v1 为 mock/local storage）并显示成功提示

#### 场景：Save 按钮位置
- **当** 页面渲染
- **则** Save 按钮作为主操作按钮，对齐于页面卡片右下角

### 需求：将规则应用于讲师评估标记（轻量 demo）
系统可将已保存评估设置应用于讲师 `requiresEvaluation` 标记，采用简化 mock 逻辑，以便 Lecturer Information 演示效果；v1 不要求完整规则引擎精度。

#### 场景：应用新讲师规则
- **当** New Lecturer 评估已启用、设置已保存，且讲师有入职日期但无教学记录
- **则** 该讲师在 mock 数据中可被标记为 `requiresEvaluation: true`

#### 场景：应用类型变更规则
- **当** 启用的类型变更规则匹配讲师 mock 的 `previousCategory` → 当前 `category` 组合
- **则** 该讲师在 mock 数据中可被标记为 `requiresEvaluation: true`

#### 场景：规则反映在列表中
- **当** 用户保存设置后导航至 Lecturer Information
- **则** mock 数据中已标记的讲师显示 Requires Evaluation 标签，并在启用评估筛选开关时出现

## 来源 `add-evaluation-settings` / 能力 `lecturer-information`

## 新增需求

### 需求：Requires Evaluation 由 Evaluation Settings 驱动（轻量演示）
系统可以在保存 Evaluation Settings 后，使用简化的 mock 逻辑更新 lecturer 的 `requiresEvaluation` 标记；首版不要求完整自动化规则引擎。

#### 场景：保存设置后更新标记
- **当** 管理员保存 Evaluation Settings
- **则** mock lecturer 记录可因演示场景被更新（如有入职日期且无授课记录；类型变更 from→to 匹配）

#### 场景：Requires Evaluation 标签反映规则
- **当** mock 规则应用后 lecturer 的 `requiresEvaluation` 为 true
- **则** 列表姓名旁显示绿色 "Requires Evaluation" 标签

#### 场景：评估筛选使用重算后的标记
- **当** 用户在保存设置后于 Lecturer Information 启用评估筛选
- **则** 筛选列表反映 mock 数据中已标记的 lecturer

## 来源 `add-lecturer-information` / 能力 `lecturer-information`

## 新增需求

### 需求：讲师列表页展示核心字段
系统应展示分页的讲师表格，列包括：No.、Staff ID、Name、Gender、Category、Department、Academic Qualification (Highest)、Title、Academic Position、Degree、Employment Status、Date of Joining 和 Actions（Details、Edit、Delete）。

#### 场景：默认列表加载
- **当** 用户导航至 Lecturer Information
- **则** 系统展示讲师记录第一页，包含上述全部列

#### 场景：Requires Evaluation 标签
- **当** 讲师记录的 `requiresEvaluation` 为 true
- **则** 系统在列表中讲师姓名旁显示绿色「Requires Evaluation」标签

### 需求：搜索与筛选讲师
系统应支持按 Staff ID、Name、Department、Category、Title、Academic Position、Degree 和 Employment Status 搜索与筛选。

#### 场景：基础搜索
- **当** 用户输入 Staff ID 或 Name 并点击 Search
- **则** 列表仅显示匹配记录，并重置到第 1 页

#### 场景：通过 More 展开筛选
- **当** 用户点击 More，设置 Title、Academic Position、Degree 或 Employment Status 筛选后点击 Search
- **则** 列表同时应用全部活跃筛选（且逻辑）

#### 场景：评估筛选开关
- **当** 用户启用「Filter lecturers who require teaching observation/lecture evaluation」并点击 Search
- **则** 列表仅显示 `requiresEvaluation` 为 true 的讲师

#### 场景：重置筛选
- **当** 用户点击 Reset
- **则** 清空全部搜索字段与评估筛选开关，并恢复完整列表

### 需求：通过四步向导创建讲师
系统应提供含四步的 Create 弹框：(1) Basic Info、(2) Academic Qualifications、(3) Working Experience、(4) CPD preview。

#### 场景：步骤 1 — Personal and Employment Information
- **当** 用户打开 Create 并位于步骤 1
- **则** 系统展示 Personal Information 字段（Name*、Gender*、Date of Birth、Nationality、Mobile Phone*、Personal Email、Degree*、Research focus areas）和 Employment Information 字段（Staff ID*、Category*、School/Department*、Foundation/Undergraduate/Postgraduate*、Title*、Academic Position*、Office Extension*、XMUM Email*、Date of Joining*、Currently Teaching*、Employment Status*），以及 Others（Attachment PDF 上传、Remarks 0/100）

#### 场景：步骤 2 — Academic Qualifications
- **当** 用户进入步骤 2
- **则** 系统允许新增、编辑、保存和删除多条 qualification 记录，每条含 Name of Qualification、Name of Awarding Institution、Awarding country、Year of Award、Remarks 和 attachment 上传（PDF）

#### 场景：步骤 3 — Working Experience
- **当** 用户进入步骤 3
- **则** 系统允许新增、编辑、保存和删除多条 working experience 记录，字段含 Academic Position、Employer、Start of Service、End of Service、Experience in Education (Years) 和 Experience in Industry (Years)

#### 场景：步骤 4 — Create 时 CPD 只读
- **当** 用户在 Create 过程中进入步骤 4
- **则** 系统展示空或说明性 CPD 区块，表明数据将来自 HR 同步或教师门户审批（Create 时不可手动录入）

#### 场景：创建成功
- **当** 用户在步骤 1–3 完成全部必填字段并在步骤 4 点击 Confirm
- **则** 系统保存新讲师并刷新列表

### 需求：通过四步向导编辑讲师
系统应允许使用相同四步向导编辑现有讲师，并预填现有数据。

#### 场景：Edit 预填
- **当** 用户点击列表行的 Edit
- **则** 向导打开，步骤 1–3 加载全部现有讲师数据

#### 场景：编辑成功
- **当** 用户修改数据并确认
- **则** 系统更新记录，列表反映变更

### 需求：通过四步弹框查看讲师详情
系统应提供与 Create 向导结构一致的四步只读 Details 弹框。

#### 场景：步骤 1 详情 — Basic Info
- **当** 用户点击列表行的 Details
- **则** 步骤 1 以只读形式展示 Personal Information、Employment Information、attachment 下载和 Remarks

#### 场景：步骤 2 详情 — Qualifications
- **当** 用户在 Details 中导航至步骤 2
- **则** 系统列出全部 academic qualifications，并提供 attachment 下载链接

#### 场景：步骤 3 详情 — Working Experience
- **当** 用户在 Details 中导航至步骤 3
- **则** 系统以只读卡片布局列出全部 working experience 记录

#### 场景：步骤 4 详情 — 按年 CPD
- **当** 用户在 Details 中导航至步骤 4
- **则** 系统按年分组展示 CPD 记录，含摘要（Number of Activity Attended、Number of Hours Earned）及每年表格（No.、Name of Activity、Name of Activity Provider、Type of Activity、Category、Mode of Delivery、Date(s) Attended、Number of Hours Earned、Evidence 下载链接）

### 需求：删除讲师
系统应支持单行与批量删除，并须确认。

#### 场景：单行删除
- **当** 用户点击一行的 Delete 并确认
- **则** 该讲师从列表中移除

#### 场景：批量删除
- **当** 用户选中多行、点击 Delete 并确认
- **则** 移除全部选中讲师

### 需求：导出讲师数据
系统应通过现有 Export 弹框模式，支持将筛选后的讲师列表数据导出为 Excel。

#### 场景：导出当前页
- **当** 用户点击 Export 并选择当前页字段
- **则** 系统下载含所选列的当前页 Excel 文件

### 需求：工具栏占位操作
系统应显示 Sync Cache 和 Refers to EMS system 按钮，点击时显示说明提示（本阶段无后端集成）。

#### 场景：Sync Cache 占位
- **当** 用户点击 Sync Cache
- **则** 系统提示 HR 系统同步尚未接入

#### 场景：EMS 引用占位
- **当** 用户点击 Refers to EMS system
- **则** 系统提示 EMS 集成尚未接入

### 需求：CPD 数据来源（未来集成）
系统应说明 CPD 数据来源于 (1) HR 系统同步和 (2) 教师门户提交并经审批；本阶段 CPD 仅由 mock 数据填充。

#### 场景：详情视图中的 mock CPD
- **当** 用户查看含 mock CPD 数据的讲师步骤 4 Details
- **则** 系统按年分组展示 mock CPD 记录
