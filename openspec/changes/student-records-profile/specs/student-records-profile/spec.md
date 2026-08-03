# 学籍管理-学生基本信息 规格（合并）

## 说明

以下为各历史 delta spec 原文按来源拼接并做术语中文化处理。整理正式需求文档时，应按场景重写为「用户故事 / 验收标准」，消除重复与过时条目。

## 来源 `add-status-log-graduation-withdrawal-remarks` / 能力 `student-profile`

# student-profile — 增量规格

## 新增需求

### 需求：毕业状态日志备注

详情 Status Log 应 支持毕业状态行，备注展示 Completion Batch、Completion Date、Graduation Batch、Graduation Date。

#### 场景：毕业备注四字段
- **当** 用户查看含毕业记录的 Status Log
- **则** Remarks 显示标题 Graduation 及四行批次/日期（图示 2 格式）

### 需求：退学状态日志原因来自异动类型配置

退学 Status Log 备注 应 包含 Last Date of Attendance 与 Reason；Reason 来自异动类型 WDR001 配置（`reasonId` 解析）。

#### 场景：退学原因与配置一致
- **当** 用户查看退学 Implement 或 mock 退学 Status Log
- **则** Reason 行与异动类型退学原因列表一致（如 Financial Problem、Personal Reason）

## 来源 `add-student-pass-expiry-date` / 能力 `student-profile`

# student-profile — 增量规格

## 新增需求

### 需求：China 与 International 学生 学生Pass Expiry Date

China 与 International 学生基本信息应展示由 IO 维护的 学生Pass Expiry Date（dd/mm/yyyy），在学籍新建/编辑/详情模式下均为只读，学籍用户不可修改。

#### 场景：China 学生展示签证有效期
- **当** 用户查看 China 类别学生的基本信息 Tab
- **则** 显示 学生Pass Expiry Date 只读字段；有值时按 dd/mm/yyyy 展示，无值时显示弱化占位

#### 场景：International 学生展示签证有效期
- **当** 用户查看 International 类别学生的基本信息 Tab
- **则** 显示 学生Pass Expiry Date 只读字段

#### 场景：Local 学生不展示
- **当** 用户查看 Local 类别学生
- **则** 基本信息 Tab 不显示 学生Pass Expiry Date

### 需求：学生Pass Expiry Date 列表列与范围搜索

学生基本信息列表应展示 学生Pass Expiry Date 列，并提供日期范围搜索。

#### 场景：主表列展示
- **当** 用户打开学生基本信息列表
- **则** 表格包含 学生Pass Expiry Date 列；China/International 有值则展示，Local 或无值显示占位

#### 场景：日期范围筛选
- **当** 用户填写 From 和/或 To 并搜索
- **则** 仅返回 `studentPassExpiryDate` 落在 inclusive 范围内的 China/International 记录；无该字段的记录不匹配

#### 场景：导出包含字段
- **当** 用户导出学生档案
- **则** 可选字段包含 学生Pass Expiry Date，且列表默认导出字段包含该列

## 来源 `add-student-profile-change-log-tab` / 能力 `student-profile-change-log`

## ADDED Requirements

### Requirement: 学生详情信息变更记录 Tab

学生基本信息详情视图 必须在「状态日志」右侧提供「信息变更记录」Tab。该 Tab 必须只读展示基本信息与住宿信息字段的变更流水；必须NOT 展示学籍 enrollment 字段变更，也 必须NOT 替代状态日志。

#### Scenario: Tab 位置与名称
- **WHEN** 用户打开学生详情并查看 Tab 栏
- **THEN** 「信息变更记录」出现在「状态日志」右侧
- **AND** 英文界面显示等价标签（如 Profile Change Log）

#### Scenario: 字段级对比列
- **WHEN** 用户打开「信息变更记录」且存在变更数据
- **THEN** 表格展示变更时间、分区（基本信息/住宿）、字段、原值、新值、变更人、角色（老师/学生）
- **AND** 每行对应单个字段的一次变更

#### Scenario: 无数据
- **WHEN** 该生无信息变更记录
- **THEN** 显示空状态（与详情其它空列表一致）

#### Scenario: 与状态日志分离
- **WHEN** 用户查看「状态日志」
- **THEN** 内容仍仅为学籍状态相关条目，不含基本信息/住宿字段对比行

## 来源 `add-student-profile-crud` / 能力 `student-profile`

## 修改需求

### 需求：学生Profile 列表工具栏操作
系统应在 学生Profile 页面提供新增、删除、导入与导出工具栏操作。

#### 场景：显示新增按钮
- 当用户查看 学生Profile 页面时，则工具栏中显示主操作「新增」按钮

#### 场景：删除需先选中行
- 当用户查看 学生Profile 页面时，则显示「删除」按钮，且未选中任何行时该按钮为禁用状态

#### 场景：导入打开导入弹框
- 当用户点击「导入」时，则系统打开学籍导入弹框，提供模板下载与文件上传

#### 场景：有数据时导出
- 当用户点击「导出」并在导出弹框中确认导出时，则系统下载包含所选导出范围与列的 Excel 文件

### 需求：学生Profile 数据表格列
系统应显示与原型一致列结构的分页表格。

#### 场景：表格列
- 当显示 学生Profile 列表时，则列包括选择复选框、No.、学生ID、学生Name、Chinese Name、学生Type、Gender、Programme Code、Programme、Intake、学生Status 与 Actions

#### 场景：行操作
- 当用户查看表格行时，则 Actions 列提供「详情」「编辑」与「删除」链接

#### 场景：分页
- 当筛选结果数量超过每页条数时，则系统显示分页控件并展示正确的当前页数据

#### 场景：按学生类型筛选使用原型类别
- 当用户按 学生Type 筛选时，则可选值包括 Local、China 与 International

### 需求：学生Profile 行详情视图
系统应允许用户从列表查看完整学籍详情，采用与注册表单相同的七个 Tab 结构，并在 Others 之后增加只读 Status Log Tab。

#### 场景：打开详情抽屉
- 当用户点击某行的「详情」时，则系统显示只读抽屉，含 Basic Info、Enrollment、Contact、Education、Family、Accommodation、Others 与 Status Log 等 Tab，展示该生的全部已存字段

#### 场景：详情按学生类别展示字段
- 当用户打开 China 或 International 学生的「详情」时，则 Basic Info Tab 显示护照相关字段，并按该生类别隐藏 Local 专属的 IC 字段

### 需求：学生Profile 模拟数据
系统应使用本地模拟数据展示 学生Profile 列表，不调用后端 API。

#### 场景：初始数据加载
- 当用户打开 学生Profile 页面时，则表格显示模拟学籍记录，含与原型对齐的示例，如 XMUM2309001，涵盖 Local、China、International 类别及 Active 状态

#### 场景：China 模拟数据使用护照或中国身份字段
- 当用户打开类别为 China 的模拟学生 XMUM2309002 的「详情」时，则 Basic Info 显示适用于 China 的身份字段，而非以 Local IC No. 作为主标识

#### 场景：International 模拟数据使用护照字段
- 当用户打开类别为 International 的模拟学生 XMUM2309003 的「详情」时，则 Basic Info 显示护照相关字段，而非以 Local IC No. 作为主标识

## 移除需求

### 需求：学生Profile 列表工具栏操作
#### 场景：导入占位
**原因**：导入已实现模板下载与 Excel 解析。
**迁移说明**：使用导入弹框上传学籍 Excel 文件。

## 新增需求

### 需求：学生Profile 新建与编辑注册表单
系统应提供「新建学籍注册」抽屉，用于创建与编辑学籍记录，含与原型对齐的七个 Tab。

#### 场景：打开新建表单
- 当用户在 学生Profile 页面点击「新增」时，则系统打开空的注册抽屉，标题为新建学籍注册，学生Category 单选选项为 Local、China 与 International

#### 场景：注册 Tab 展示
- 当注册抽屉已打开时，则系统显示 Basic Info、Enrollment、Contact、Education、Family、Accommodation 与 Others 七个 Tab

#### 场景：打开编辑表单
- 当用户点击表格行的「编辑」时，则系统以编辑模式打开预填该生数据的注册抽屉

#### 场景：保存新学籍
- 当用户填写必填字段并在新学籍上点击「保存」时，则系统校验输入、将学生加入列表、关闭抽屉并在表格中显示新行

#### 场景：保存编辑学籍
- 当用户在编辑模式下修改字段并点击「保存」时，则系统校验输入、更新现有记录，并在表格中反映变更

#### 场景：重复学号被拒绝
- 当用户保存的 学生ID 已在其他记录中存在时，则系统阻止保存并显示校验错误

#### 场景：取消关闭抽屉
- 当用户在注册抽屉中点击「取消」时，则抽屉关闭且不保存未保存的变更

#### 场景：Local Basic Info 字段
- 当用户在注册抽屉 Basic Info Tab 中选择 学生Category Local 时，则表单显示 IC No. 与 State of Birth，不显示护照专属或 China 专属身份字段

#### 场景：China Basic Info 字段
- 当用户在注册抽屉 Basic Info Tab 中选择 学生Category China 时，则表单显示 Passport No.、Passport Expiry、Place of Birth、Candidate No.、Political Outlook 与 Identity No. (China ID)，不显示 IC No. 或 State of Birth

#### 场景：International Basic Info 字段
- 当用户在注册抽屉 Basic Info Tab 中选择 学生Category International 时，则表单显示 Passport No.、Passport Expiry 与 Place of Birth，不显示 IC No.、State of Birth 或 China 专属身份字段

#### 场景：保存时按类别校验
- 当用户保存未填写 IC No. 的 Local 学生时，则系统阻止保存并在 Basic Info 显示校验错误

#### 场景：China 或 International 无 IC No. 可保存
- 当用户保存 China 或 International 学生且未填写 IC No.，但其他必填共享字段已填写完整时，则若其他必填字段有效，系统允许保存

### 需求：学生Profile 删除记录
系统应允许用户单独或批量删除学籍记录。

#### 场景：删除单行
- 当用户点击某行的「删除」并确认时，则系统从列表中移除该学生

#### 场景：删除选中行
- 当用户选中一行或多行、点击工具栏「删除」并确认时，则系统从列表中移除所有选中的学生

### 需求：学生Profile 从 Excel 导入
系统应支持从 Excel 模板导入学籍记录，覆盖列表、基本信息与学籍核心字段。

#### 场景：下载导入模板
- 当用户打开导入弹框并点击下载模板时，则系统下载含列标题与示例行的 Excel 文件

#### 场景：导入有效行
- 当用户上传有效 Excel 文件并确认导入时，则系统将解析出的学籍记录加入列表，并显示含导入条数的成功摘要

#### 场景：导入跳过重复学号
- 当用户上传的文件中包含已存在的 学生ID 时，则系统跳过这些行并在导入结果中报告

#### 场景：导入校验错误
- 当用户上传的文件中某行缺少必填字段时，则系统跳过无效行并报告行号与原因

#### 场景：导入仅对 Local 行校验 IC No.
- 当用户上传 学生Category 为 Local 且缺少 IC No. 的行时，则系统跳过该行并报告校验错误

#### 场景：导入接受无 IC No. 的 China 行
- 当用户上传 学生Category 为 China、护照或中国身份字段有效且无 IC No. 的行时，则若其他必填字段有效，系统可导入该行

### 需求：学生Profile 扩展导出
系统应支持导出列表列与扩展档案字段。

#### 场景：导出列表列
- 当用户仅选中列表列字段导出时，则下载的 Excel 与表格列集合一致

#### 场景：导出扩展档案字段
- 当用户选中扩展档案字段导出时，则下载的 Excel 包含七个注册 Tab 的扁平化字段

### 需求：学生Profile Basic Info 照片上传
系统应在新建与编辑时支持在 Basic Info Tab 上传学生照片。

#### 场景：上传照片预览
- 当用户在 Basic Info Tab 选择图片文件时，则系统在表单中显示所选照片预览，无需后端上传

#### 场景：详情中显示照片
- 当用户查看已存照片的学生的「详情」时，则 Basic Info Tab 显示照片预览

### 需求：学生Profile 按类别的 Education 字段
系统应根据 学生Category 显示不同的 Education Tab 字段。

#### 场景：Local Education 显示中文语言测试
- 当用户在新建、编辑或详情模式下查看 Local 学生的 Education Tab 时，则表单显示 Chinese Test Result、Chinese Test Date 与 Chinese Test Expiry 字段

#### 场景：China Education 隐藏中文语言测试
- 当用户在新建、编辑或详情模式下查看 China 学生的 Education Tab 时，则表单不显示 Chinese Test Result、Chinese Test Date 或 Chinese Test Expiry 字段

#### 场景：International Education 显示中文语言测试
- 当用户在新建、编辑或详情模式下查看 International 学生的 Education Tab 时，则表单显示 Chinese Test Result、Chinese Test Date 与 Chinese Test Expiry 字段

#### 场景：所有类别的 Qualification 下拉
- 当用户在新建或编辑模式下查看 Local、China 或 International 学生的 Education Tab 时，则 Qualification 以下拉选择方式呈现

### 需求：学生Profile 按类别的 Others 字段
系统应根据 学生Category 显示不同的 Others Tab 字段。Others Tab 不得包含 Status Change Log 文本字段；状态历史仅在详情 Status Log Tab 中展示。

#### 场景：Local Others 含税务登记
- 当用户查看 Local 学生的 Others Tab 时，则表单显示 Tax Registration No，以及 Registration Date、Sponsor 与 Remarks

#### 场景：China 或 International Others 不含税务登记
- 当用户查看 China 或 International 学生的 Others Tab 时，则表单显示 Registration Date、Sponsor 与 Remarks，不显示 Tax Registration No

### 需求：学生Profile 详情 Status Log Tab
系统应在学籍详情抽屉 Others Tab 之后显示只读 **Status Log** Tab。Status Log Tab 不得出现在新建或编辑注册抽屉中。

#### 场景：Status Log Tab 仅在详情中
- 当用户打开某学籍记录的「详情」时，则抽屉在 Others 之后显示 Status Log Tab
- 当用户打开「新增」或「编辑」注册时，则抽屉不显示 Status Log Tab

#### 场景：Status Log 表格列
- 当用户在详情模式下查看 Status Log Tab 时，则系统显示只读表格，列包括 Status、Date Effective、Changed By 与 Remarks

#### 场景：Date Effective 格式
- 当状态日志条目有 date effective 值时，则 Date Effective 列以 DD/MM/YYYY 格式显示日期

#### 场景：Remarks 多行内容
- 当用户查看 Status Log 条目的 Remarks 列时，则系统显示加粗的备注标题，后跟一行或多行标签-值内容，如 Program、Intake、Old StudentID 或 New StudentID

#### 场景：Status Log 空状态
- 当学籍记录无状态日志条目时，则 Status Log Tab 显示空状态提示

#### 场景：Others Tab 不含旧版 Status Change Log 字段
- 当用户在新建、编辑或详情模式下查看 Others Tab 时，则系统不显示旧版 Status Change Log 文本域字段

#### 场景：展示用模拟数据含状态日志
- 当用户打开模拟学生 XMUM2309001、XMUM2309002 或 XMUM2309003 的「详情」时，则 Status Log Tab 显示多条结构化条目，含注册与状态变更示例

### 需求：学生Profile 按类别的 Enrollment 字段
系统应按原型规定，为 China 与 International 学生显示 Enrollment 字段控件差异。

#### 场景：所有类别的 Recruited By 下拉
- 当用户在新建或编辑模式下查看 Local、China 或 International 学生的 Enrollment Tab 时，则 Recruited By 以下拉方式呈现

#### 场景：Fujian Scholarship 仅 Local 显示
- 当用户查看 Local 学生的 Enrollment Tab 时，则显示 Fujian Scholarship Amt

#### 场景：China 与 International 隐藏 Fujian Scholarship
- 当用户查看 China 或 International 学生的 Enrollment Tab 时，则不显示 Fujian Scholarship Amt

## 修改需求

### 需求：学生Profile Enrollment 主数据下拉
系统应在 Enrollment Tab 将 Programme 作为主下拉，选项来自专业目录名称。当用户选择专业名称时，系统应从同一目录记录自动填充 programme code、faculty、programme level 与 duration 为只读派生字段（含 programme level 存为与专业版本主数据对齐的值，如 L6-Bachelor）。Intake (YYYY/MM) 与 Academic Session 应保持可独立选择的下拉，不随专业选择级联。

#### 场景：专业名称驱动派生 Enrollment 字段
- 当用户在新建或编辑模式的 Enrollment Tab 选择专业名称时，则系统从匹配的专业目录条目设置 programme code、faculty、programme level 与 duration
- 且 programme code、faculty、programme level 与 duration 为只读，用户不可单独编辑

#### 场景：Programme level 存为目录级别代码
- 当系统在选择专业后持久化 Enrollment 时，则 programme level 使用目录级别值（如 L6-Bachelor）存储，而非 Undergraduate 等自由文本标签

#### 场景：Intake 与 Academic Session 保持独立
- 当用户在选择 intake 或 academic session 后变更专业名称时，则系统保留先前选中的 intake 与 academic session 值，除非用户显式变更

#### 场景：Enrollment Intake 与 Session 选项不变
- 当用户在新建或编辑模式下查看 Enrollment Tab 时，则 intake 选项来自活跃 intake 批次集合
- 且 academic session 选项来自学期信息中的 academic sessions

#### 场景：列表、详情与编辑显示相同 Enrollment 值
- 当用户在列表中查看某生并打开「详情」或「编辑」时，则 programme、programme code、faculty、programme level、duration、intake 及相关列表列显示相同的已存 Enrollment 值
- 且编辑模式下，若目录中存在已存专业名称，则在专业下拉中显示为选中项

#### 场景：展示用模拟数据与目录级别及选项对齐
- 当用户打开模拟学生 XMUM2309001、XMUM2309002 或 XMUM2309003 的「编辑」时，则 Enrollment programme level 值与目录级别代码（如 L6-Bachelor）一致
- 且专业派生字段与所选专业名称一致

### 需求：学生Profile Accommodation 代码集下拉
系统应在 Accommodation Tab 将 Hostel Status、Room Type、Campus、Block No 与 Room No 以下拉方式呈现，选项来自基础数据代码集模块中的 学生Code Sets。Floor No、Unit No、Bed No、日期字段与金额字段应按规格保持非代码集控件。

#### 场景：新建或编辑中 Accommodation 代码集下拉
- 当用户在新建或编辑模式下查看 Accommodation Tab 时，则 hostel status、room type、campus、block no 与 room no 为由代码集条目填充的下拉
- 且 floor no、unit no 与 bed no 在本阶段仍为文本输入

#### 场景：代码集选项来自 学生Code Sets
- 当系统加载 Accommodation 下拉选项时，则从代码集管理中维护的 学生Code Sets 条目解析选项（本阶段为模拟种子与本地存储）

#### 场景：Accommodation 详情与编辑一致性
- 当用户打开含 Accommodation 值的学生的「详情」或「编辑」时，则已存的下拉值在代码集列表中存在时显示为选中项

#### 场景：展示用模拟数据与 Accommodation 代码集对齐
- 当用户打开模拟学生 XMUM2309001、XMUM2309002 或 XMUM2309003 的「编辑」时，则 Accommodation 下拉字段值与对应 学生Code Sets 中的条目一致

## 移除需求

### 需求：学生Profile Enrollment 主数据下拉（§14 独立五字段模型）
**原因**：§16 以专业名称驱动联动取代独立的 Programme Code / Faculty 下拉；programme level 与 duration 变为只读派生字段。
**迁移说明**：参见 §16 修改需求「学生Profile Enrollment 主数据下拉」。

#### 场景：Enrollment 字段在新建或编辑中使用基础数据选项（§14 五个独立下拉）
- **已移除** — programme code 与 faculty 不再作为独立主下拉

#### 场景：独立选择无联动
- **已移除** — 专业名称现驱动 programme code、faculty、programme level 与 duration

## 修改需求

### 需求：学生Profile 扩展导出
系统应提供与 Programme Version 模块一致的导出对话框：双列表字段穿梭（Available Fields / Selected Fields）、移动按钮，以及 Export Setting 中的 Current Page、All Results 与 Selected Rows 选项。

#### 场景：导出对话框穿梭布局
- 当用户在 学生Profile 页面有数据可导出时点击「导出」，则系统打开共享 Export 弹框，左侧为 Available Fields、右侧为 Selected Fields，与 Programme Version 一致

#### 场景：默认选中列表列
- 当导出弹框打开时，则列表表格列（含 No.）预选中于 Selected Fields
- 且扩展档案字段出现在 Available Fields 中，直至用户手动移入

#### 场景：导出范围当前页
- 当用户选择 Export Current Page 并至少选中一个字段后确认时，则系统仅导出当前列表页可见行，使用所选列

#### 场景：导出范围全部结果
- 当用户选择 Export All Results 并确认时，则系统导出符合当前搜索筛选条件的全部行，使用所选列

#### 场景：导出范围选中行
- 当用户选择 Export Selected Rows 但未勾选任何表格行时，则系统显示 Toast 提示用户先选中行
- 当用户选择 Export Selected Rows 且已勾选行并确认时，则系统仅导出勾选行，使用所选列

#### 场景：导出列表列
- 当用户仅选中列表列字段导出时，则下载的 Excel 与表格列集合一致

#### 场景：导出扩展档案字段
- 当用户将扩展档案字段移入 Selected Fields 并确认导出时，则下载的 Excel 包含七个注册 Tab 的扁平化字段

## 修改需求

### 需求：学生Profile 行详情视图
系统应在详情抽屉的全部七个 Tab 中以不同 typography 展示只读字段标签与值。字段标签应使用较小、较淡的样式；字段值应使用较大、强调的样式。显示为 em dash 的空值应使用与有值字段区分的 subdued 空状态样式。

#### 场景：详情中标签与值的视觉层级
- 当用户打开「详情」并查看任意 Tab 时，则字段标签与字段值在字号、字重与颜色上视觉区分
- 且编辑模式表单输入不受影响

#### 场景：详情中空值样式
- 当某字段在详情模式下无已存值时，则系统以 subdued 空状态样式显示 em dash

#### 场景：详情头部区域的学生类别行
- 当用户打开「详情」时，则 Tab 上方的学生类别标签与值遵循相同的标签/值层级

### 需求：学生Profile 模拟数据
系统应为展示用学籍记录填充具有代表性的 Tab 内容，使详情视图不被大量空占位符占据。

#### 场景：Local 展示记录内容丰富
- 当用户打开模拟学生 XMUM2309001 的「详情」时，则 Basic Info、Enrollment、Contact、Education、Family、Accommodation 与 Others 各 Tab 在大多数字段上显示具体演示值
- 且每个 Tab 可有少量可选字段保持为空

#### 场景：China 与 International 展示记录
- 当用户打开 XMUM2309002 或 XMUM2309003 的「详情」时，则按类别适配的字段在多个 Tab 上填充具体演示值
- 且可为演示目的保留部分空的可选字段

## 来源 `add-student-profile-crud` / 能力 `student-records-app`

## 新增需求

### 需求：学籍应用列表暴露流转日志操作
系统应在转专业、休学、复学、退学申请历史表格的每一行提供 Workflow Log 操作，且无论申请状态如何均可见。

#### 场景：每行均有流转日志按钮
- 当用户在四模块学籍异动申请中查看任意申请时，则 Actions 列除 Details、Edit 等状态相关操作外，还包含 Workflow Log 链接或按钮。

#### 场景：流转日志打开独立弹框
- 当用户点击某行的 Workflow Log 时，则系统打开独立弹框，以表格展示 Stage、Actor、Action、Date and Time、Comment 列的审批日志条目，且弹框副标题含 application ID、学生ID 与 学生name。

#### 场景：空流转日志
- 当用户点击无审批日志条目的记录的 Workflow Log 时，则弹框打开并显示无数据消息。

### 需求：申请详情弹框不内嵌审批日志
系统不应在转专业、休学、复学、退学的申请详情弹框内展示审批日志时间线。

#### 场景：详情弹框无日志区块
- 当用户在四模块中打开任意申请的 Details 时，则详情弹框仅展示申请区块与 Pending 审批控件（若有），且不展示内嵌 approval log 列表。

#### 场景：仅从列表访问日志
- 当用户需要查看审批历史时，则通过列表行的 Workflow Log 操作访问，而非从详情弹框访问。

## 来源 `add-student-profile-export-card-button` / 能力 `student-profile`

## 新增需求

### 需求：学生基本信息详情导出学籍卡入口

系统应在学生基本信息详情抽屉底部提供「导出学籍卡」按钮；本期仅展示入口，不触发导出。

#### 场景：详情页显示按钮
- **当** 用户打开学生基本信息详情抽屉
- **则** footer 左侧显示「导出学籍卡」按钮

#### 场景：本期无导出行为
- **当** 用户点击「导出学籍卡」
- **则** 系统不执行导出、不弹出提示

## 来源 `add-student-profile-preview-login` / 能力 `student-profile`

## 新增需求

### 需求：学生基本信息 Preview 进入学生端
系统应在学生基本信息列表操作列提供 Preview，使管理员以所选学生身份进入学生异动申请（学生端）。

#### 场景：Preview 按钮与 tooltip
- **当** 用户查看学生基本信息列表操作列
- **则** 每行展示 Preview 按钮，hover/focus 时 tooltip 完整展示说明：以该学生账号登录并跳转到学籍异动申请（学生端）（不被表格容器裁剪）

#### 场景：点击 Preview 切换身份并跳转
- **当** 用户点击某行的 Preview
- **则** 系统将 mock 当前登录学生设为该行 studentId，并导航至 `sr-movement-application-student`
- **且** 不展示 Preview 顶栏提示条

#### 场景：学生端列表与新建行为
- **当** Preview 跳转完成后
- **则** 学生异动申请列表与新建表单按该学生身份运行（与既有 `applicantMode=student` 规则一致）

## 来源 `add-student-profile-track-category-field` / 能力 `student-profile`

## 新增需求

### 需求：列表展示学籍类型列

学生基本信息列表应在学籍状态列右侧展示学籍类型（Track Category），不增加学籍类型搜索筛选。

#### 场景：列位置
- **当** 用户查看学生基本信息列表
- **则** 学籍类型列紧挨学籍状态列右侧显示

### 需求：学籍类型随学籍状态联动

Enrollment Tab 中选择学籍状态时，学籍类型下拉仅展示该状态允许的选项；不扩充现有学籍状态枚举。

#### 场景：Active 状态选项
- **当** 用户在表单中选择学籍状态 Active
- **则** 学籍类型下拉包含 Normal、Programme Transfer、Inbound Mobility、Outbound Mobility、IEP、Completion without Graduation*

#### 场景：Deferred 状态选项
- **当** 用户选择 Deferred
- **则** 学籍类型选项对齐参考表中 Deferment 对应集合

#### 场景：变更状态后清理非法类型
- **当** 用户变更学籍状态且当前学籍类型不在新状态允许列表中
- **则** 系统自动将学籍类型重置为新列表的首个合法值

### 需求：详情与导出同步

详情 Enrollment Tab 与列表导出应展示同一 `enrollment.trackCategory` 值。

#### 场景：详情只读
- **当** 用户打开学生档案详情 Enrollment Tab
- **则** 学籍类型以只读形式展示在学籍状态旁

## 来源 `refine-student-pass-expiry-end-date-display` / 能力 `movement-application-student-info`

## 修改需求

### 需求：异动 Section I 学生签证到期日

异动申请表单及详情视图 应 对中国/国际学生将学生签证到期日（学生Visa Expiry Date）显示为单一截止日期（dd/mm/yyyy）。本地学生显示 `—`。

#### 场景：中国或国际学生显示截止日期
- **当** 所选学生为中国或国际学生且档案中有准证到期日
- **则** Section I 仅显示截止日期，不显示日期范围

#### 场景：详情与抽屉与表单一致
- **当** 用户查看异动申请详情
- **则** 学生签证到期日遵循相同的仅显示截止日期规则

## 来源 `refine-student-pass-expiry-end-date-display` / 能力 `student-profile`

## 修改需求

### 需求：中国与国际学生学生准证到期日

中国与国际学生基本信息 应 展示 IO 维护的学生准证到期日（学生Pass Expiry Date）为单一截止日期（dd/mm/yyyy），即 `studentPassExpiryEndDate`，学籍新建/编辑/详情模式下均为只读。

#### 场景：中国学生仅显示截止日期
- **当** 用户查看中国学生的基本信息 Tab
- **则** 学生准证到期日仅显示 dd/mm/yyyy 格式的截止日期，不显示起止日期范围

#### 场景：国际学生仅显示截止日期
- **当** 用户查看国际学生的基本信息 Tab
- **则** 学生准证到期日仅显示 dd/mm/yyyy 格式的截止日期

### 需求：学生准证到期日列表列与范围搜索

学籍列表 应 将学生准证到期日仅显示为截止日期。搜索 应 仍使用起止日期范围筛选，按截止日期匹配。

#### 场景：列表列显示截止日期
- **当** 用户打开学籍列表
- **则** 学生准证到期日列对中国/国际学生显示 dd/mm/yyyy 格式的截止日期

#### 场景：日期范围筛选保持不变
- **当** 用户在搜索中使用起止日期筛选
- **则** 匹配逻辑与此前一致，按截止日期进行包含性范围匹配

#### 场景：导出显示截止日期
- **当** 用户导出包含学生准证到期日的学籍数据
- **则** 该列值仅为截止日期

## 来源 `refine-student-profile-enrollment-demo-fields` / 能力 `student-profile`

## 修改需求

### 需求：Programme Structure 展示与筛选
系统应按培养方案固定格式展示 Programme Structure，且列表与筛选均有 demo 值。

#### 场景：固定命名格式
- **当** 学生有 programmeCode 与 intake
- **则** Programme Structure 为 `Programme Structure of {专业简称} ({YYYYMM} Version)`，其中 YYYYMM 来自入学批次 intake

#### 场景：列表与筛选非空
- **当** 用户查看学生基本信息列表或 Programme Structure 筛选
- **则** 每条 mock 学生均有 Programme Structure 值，筛选下拉包含实际选项（非仅「全部」）

### 需求：入学相关列 Demo 补全
系统应在列表中展示完整的入学与欠费 demo 数据。

#### 场景：Registration Time 与 Expected Batches
- **当** 显示 Registration Time、Expected Completion Batch、Expected Graduation Batch 列
- **则** 每条学生均有值（由 intake/duration 推导或 seed 提供），不得显示「—」

#### 场景：Outstanding Fee
- **当** 显示 Outstanding Fee 列
- **则** 每条学生均为 Y 或 N（demo 含 N 与 Y 混合），不得显示「—」

## 来源 `refine-student-profile-enrollment-programme-first-cascade` / 能力 `student-profile`

# student-profile — 增量规格

## 修改需求

### 需求：学籍信息 Tab 专业级联

学籍信息 Tab 前四个字段 应 按以下顺序展示：

1. **专业**（Programme）— 必填，下拉选择 `programmeIntakeKey`
2. **专业代码**（Programme Code）— 只读，由专业选择联动
3. **专业层次**（Programme Level）— 只读，由专业选择联动
4. **学院**（Faculty）— 只读，由专业选择联动

#### 场景：选择专业后自动填充联动字段
- **当** 用户选择专业
- **则** 系统自动填充专业代码、专业层次、学院、专业结构、学制

#### 场景：清空专业后清空联动字段
- **当** 用户清空专业
- **则** 系统清空上述联动字段

#### 场景：编辑已有记录时回填联动字段
- **当** 用户编辑已有学生记录
- **则** 系统根据已存 enrollment 推断 `programmeIntakeKey` 并回填联动字段

## 新增需求

### 需求：学籍信息 Tab 字段提示

学籍信息 Tab 以下字段 应 在 label 旁展示 `?` tooltip：

| 字段 | 说明（中文） |
|------|-------------|
| 入学批次 | 学生如果转专业，Intake会变新专业的intake，但是注册时间不变 |
| 注册时间 | Registration Time是入学的intake |
| 学期 | 当前学年学期相对入学intake第几个学期 |

## 来源 `refine-student-profile-list-search` / 能力 `student-profile`

## 修改需求

### 需求：学生Profile 列表搜索
系统应提供统一模糊搜索与可折叠的高级下拉筛选。

#### 场景：统一模糊搜索
- 当用户在 keyword 文本框输入内容并搜索时，则系统对 学生ID、学生Name、Chinese Name、IC No. (No dash)、Mobile Phone 做 OR 模糊匹配

#### 场景：第一行下拉筛选
- 当用户展开搜索区第一行时，则显示 Programme、Intake、Status 三个下拉，与 keyword 组合 且过滤

#### 场景：Status 筛选基于最新日志
- 当用户按 Status 筛选时，则匹配该生 Status Log 中 dateEffective 最新一条的 status；无日志时回退 enrollment.status

#### 场景：折叠高级筛选
- 当用户点击「更多」时，则展开 学生Type、Nationality、Registration Time、Programme Level、Programme Structure、Expected Completion Batch、Expected Graduation Batch、Outstanding Fee 及 学生Pass Expiry 日期范围

#### 场景：学生Type 即 学生Category
- 当用户按 学生Type 筛选或查看表格列时，则值为 Local、China 或 International（由国籍推导的 studentCategory）

### 需求：学生Profile 数据表格列
系统应展示扩展列并支持左侧四列（含复选框）冻结。

#### 场景：必含列
- 当显示列表时，则包含 学生ID、Name、Chinese Name、Status、Intake、Programme Code、Nationality、学生Type、Outstanding Fee (Y/N)

#### 场景：Status 列来源
- 当显示 Status 列时，则展示 Status Log 最新 status（同筛选逻辑）

#### 场景：保留原有列
- 当显示列表时，则保留 学生Pass Expiry Date、Gender、Programme 等原有列

#### 场景：左侧冻结
- 当用户横向滚动表格时，则复选框、序号、学号、姓名四列保持固定可见

#### 场景：Programme Level 展示
- 当显示 Programme Level 列或搜索下拉时，则展示 Foundation / Undergraduate / Postgraduate（不含 L3-/L6- 等前缀）
- 当用户按 Programme Level 筛选时，则对存储值与筛选值做归一化后比较

#### 场景：搜索字段与列表列对齐
- 当某字段出现在搜索区（含 keyword 的 IC No.、Mobile Phone 与折叠区 Registration Time、Programme Level、Programme Structure、Expected Completion Batch、Expected Graduation Batch 等）时，则筛选结果表格必须展示对应列，便于用户核对筛选命中原因

#### 场景：详情可查看搜索字段
- 当用户打开详情抽屉时，则 IC No.、Mobile Phone、Registration Time 等搜索相关字段可在 Basic Info、Contact 或 Enrollment Tab 中查看（无需新增 Tab）

## 来源 `refine-student-profile-nationality-first` / 能力 `student-profile`

## 新增需求

### 需求：学籍表单国籍优先布局
系统应将新建/编辑抽屉与详情抽屉组织为两个带标签的分区：**国籍信息**（Nationality Information）与 **信息填写**（Information Entry）。

#### 场景：新建表单先展示国籍区
- 当用户打开新建学籍抽屉时，则在选择国籍前，抽屉仅显示步骤 **1** **国籍信息** 分区

#### 场景：表单分区步骤序号
- 当用户查看新建或编辑抽屉时，则 **国籍信息** 分区标题显示醒目的步骤序号 **1**，**信息填写** 分区标题显示步骤序号 **2**

#### 场景：新建未选国籍时隐藏信息填写区
- 当用户打开新建抽屉且尚未选择国籍时，则整个 **信息填写** 分区（含标题、Tab 与字段）均不显示

#### 场景：选择国籍后显示信息填写区
- 当用户在新建时选择国籍后，则 **信息填写** 分区变为可见，包含七个 Tab 及按类别适配的可编辑字段

#### 场景：选择国籍后 Tab 展示字段
- 当用户在新建时选择国籍后，则信息填写各 Tab 按推导出的 学生Category 展示对应字段

#### 场景：国籍可搜索下拉
- 当用户在新建或编辑模式下操作「国籍」字段时，则系统提供全球国籍值的可搜索下拉，Malaysia 与 China 置顶，其余国籍按字母序排列

#### 场景：由国籍推导学生类别
- 当用户选择国籍时，则系统按规则 Malaysia → Local、China → China、其他任何国籍 → International 自动设置 学生Category，并在 **国籍信息** 分区以只读方式展示

#### 场景：不可手动选择学生类别
- 当用户在新建或编辑抽屉中查看表单时，则系统不显示 学生Category 单选按钮或其他手动类别选择器

#### 场景：保存时国籍必填
- 当用户未选择国籍就点击「保存」时，则系统阻止保存、保持「保存」按钮可点击，并在步骤 1 的「国籍」字段显示「请选择国籍」等校验提示

#### 场景：保存前切换国籍更新类别字段
- 当用户在保存前变更国籍且推导出的 学生Category 发生变化时，则系统提示确认、清空类别不兼容字段，并更新可见字段以匹配新类别

#### 场景：同类别内切换国籍无需确认
- 当用户在保存前变更国籍但推导出的 学生Category 不变时，则系统直接更新国籍值，无需确认且不清空类别专属字段

#### 场景：Basic Info Tab 不重复国籍
- 当用户在新建或编辑模式下查看 Basic Info Tab 时，则 Tab 内不显示「国籍」输入，因其仅在 **国籍信息** 分区出现

#### 场景：编辑改国籍需确认
- 当用户变更国籍导致推导出的 学生Category 变化时，则系统在应用变更并清空类别不兼容字段前提示确认

#### 场景：详情抽屉布局一致
- 当用户打开某学籍记录的「详情」时，则只读抽屉使用步骤序号 **1** 与 **2**，采用相同的 **国籍信息** 与 **信息填写** 分区结构，以只读方式展示国籍与推导出的类别

### 需求：学籍国籍到类别的映射
系统应使用学籍表单与异动模块共用的单一映射函数，由国籍推导 学生Category。

#### 场景：Malaysia 映射为 Local
- 当国籍为 Malaysia 时，则 学生Category 为 Local

#### 场景：China 映射为 China
- 当国籍为 China 时，则 学生Category 为 China

#### 场景：其他国籍映射为 International
- 当国籍为 Malaysia 或 China 以外的任何值时，则 学生Category 为 International

## 修改需求

### 需求：学籍新建与编辑表单
系统应提供「新建学籍」抽屉用于创建与编辑学籍记录，包含 **国籍信息** 分区、含七个 Tab 的 **信息填写** 分区，以及按所选国籍推导的类别适配字段。

#### 场景：打开新建表单
- 当用户在学籍列表页点击「新增」时，则系统打开空的注册抽屉，标题为新建学籍，**国籍信息** 分区含空的可搜索国籍下拉，选择国籍前不显示推导出的 学生Category

#### 场景：注册 Tab 展示
- 当注册抽屉已打开且已选择国籍时，则系统显示步骤 **2** **信息填写**，含 Basic Info、Enrollment、Contact、Education、Family、Accommodation 与 Others 七个 Tab

#### 场景：打开编辑表单
- 当用户点击表格行的「编辑」时，则系统打开预填该生国籍、推导 学生Category 及其余全部数据的编辑抽屉

#### 场景：保存新学籍
- 当用户填写必填字段（含国籍）并在新学籍上点击「保存」时，则系统校验输入、以推导的 学生Category 将学生加入列表、关闭抽屉并在表格中显示新行

#### 场景：保存编辑学籍
- 当用户在编辑模式下修改字段并点击「保存」时，则系统校验输入、更新现有记录（含国籍与推导 学生Category），并在表格中反映变更

#### 场景：重复学号被拒绝
- 当用户保存的 学生ID 已在其他记录中存在时，则系统阻止保存并显示校验错误

#### 场景：取消关闭抽屉
- 当用户在注册抽屉中点击「取消」时，则抽屉关闭且不保存未保存的变更

#### 场景：Local 类 Basic Info 字段
- 当用户选择 Malaysia 使 学生Category 为 Local 时，则 Basic Info Tab 显示 IC No. 与 State of Birth，不显示护照专属或 China 专属身份字段

#### 场景：China 类 Basic Info 字段
- 当用户选择 China 使 学生Category 为 China 时，则 Basic Info Tab 显示 Passport No.、Passport Expiry、Place of Birth、Candidate No.、Political Outlook 与 Identity No. (China ID)，不显示 IC No. 或 State of Birth

#### 场景：International 类 Basic Info 字段
- 当用户选择 Malaysia 或 China 以外的国籍使 学生Category 为 International 时，则 Basic Info Tab 显示 Passport No.、Passport Expiry 与 Place of Birth，不显示 IC No.、State of Birth 或 China 专属身份字段

#### 场景：保存时按类别校验
- 当用户保存 Local 学生但未填写 IC No. 时，则系统阻止保存并在 Basic Info 显示校验错误

#### 场景：China 或 International 无 IC No. 可保存
- 当用户保存 China 或 International 学生时未填 IC No. 但已完成其他必填共享字段时，则若其他必填字段有效则允许保存

## 移除需求

### 需求：新建表单手动选择学生类别
**原因**：学生Category 现由国籍推导；手动 radio 选择已由自动映射替代。
**迁移**：用户先选择国籍；系统自动设置 Local、China 或 International。

## 来源 `refine-student-profile-split-keyword-search` / 能力 `student-profile`

## 修改需求

### 需求：学生Profile 列表搜索
系统应将原合并 keyword 模糊搜索拆为五个独立文本框，并与下拉筛选 且组合。

#### 场景：拆分文本模糊搜索
- **当** 用户在 学生ID、学生Name、Chinese Name、IC No. 或 Mobile Phone 任一搜索框输入内容并搜索
- **则** 系统仅对该字段做 contains 模糊匹配；未填写的文本框不参与过滤

#### 场景：多文本框 且组合
- **当** 用户同时填写多个文本搜索框
- **则** 记录须同时满足所有已填写字段的模糊匹配条件

#### 场景：搜索框顺序与标签
- **当** 用户查看搜索区第一行
- **则** 五个文本框按 学生ID、学生Name、Chinese Name、IC No.、Mobile Phone 顺序排列，标签与列表列字段标签一致

#### 场景：移除合并 keyword
- **当** 用户查看搜索区
- **则** 不再显示「学号 | 姓名 | 中文名 | NRIC | 电话」合并搜索框

## 来源 `remove-taiwan-from-demo-nationality` / 能力 `student-profile`

## 修改需求

### 需求：Demo 国籍选项移除 Taiwan

学生档案国籍下拉及 Demo 数据应移除 Taiwan 选项；原使用 Taiwan 的 mock 学生应改为其他有效国籍（如 Singapore）。

#### 场景：国籍下拉无 Taiwan
- **当** 用户打开学生档案国籍下拉
- **则** 选项列表中不包含 Taiwan

#### 场景：Demo 学生国籍更新
- **当** 系统加载初始 mock 学生数据
- **则** 不存在 nationality 为 Taiwan 的记录

## 来源 `unify-student-profile-field-labels` / 能力 `student-profile`

## 修改需求

### 需求：学生基本信息字段标签三处统一
系统应保证主表格表头、搜索区 label、详情字段 label 使用同一字段描述，且随语言切换一致。

#### 场景：中英文不混排
- **当** 界面语言为中文
- **则** 表头、搜索 label、详情 label 均为中文（无英文 label 残留）
- **当** 界面语言为英文
- **则** 上述三处均为英文

#### 场景：Programme Level 中文名
- **当** 语言为中文且展示 Programme Level 字段 label
- **则** 统一显示「专业层次」

#### 场景：Preview 按钮文案
- **当** 语言为中文
- **则** 操作列 Preview 显示「预览」
- **当** 语言为英文
- **则** 显示 Preview

#### 场景：表头 tooltip 与详情一致
- **当** 详情某字段配置了 labelHint
- **且** 该字段出现在主表格列
- **则** 表头展示相同 tooltip；搜索区 label 不展示 tooltip
