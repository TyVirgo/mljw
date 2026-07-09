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
- **则** 列表同时应用全部活跃筛选（AND 逻辑）

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
