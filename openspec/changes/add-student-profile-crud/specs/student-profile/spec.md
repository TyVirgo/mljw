## 修改需求

### 需求：Student Profile 列表工具栏操作
系统应在 Student Profile 页面提供新增、删除、导入与导出工具栏操作。

#### 场景：显示新增按钮
- 当用户查看 Student Profile 页面时，则工具栏中显示主操作「新增」按钮

#### 场景：删除需先选中行
- 当用户查看 Student Profile 页面时，则显示「删除」按钮，且未选中任何行时该按钮为禁用状态

#### 场景：导入打开导入弹框
- 当用户点击「导入」时，则系统打开学籍导入弹框，提供模板下载与文件上传

#### 场景：有数据时导出
- 当用户点击「导出」并在导出弹框中确认导出时，则系统下载包含所选导出范围与列的 Excel 文件

### 需求：Student Profile 数据表格列
系统应显示与原型一致列结构的分页表格。

#### 场景：表格列
- 当显示 Student Profile 列表时，则列包括选择复选框、No.、Student ID、Student Name、Chinese Name、Student Type、Gender、Programme Code、Programme、Intake、Student Status 与 Actions

#### 场景：行操作
- 当用户查看表格行时，则 Actions 列提供「详情」「编辑」与「删除」链接

#### 场景：分页
- 当筛选结果数量超过每页条数时，则系统显示分页控件并展示正确的当前页数据

#### 场景：按学生类型筛选使用原型类别
- 当用户按 Student Type 筛选时，则可选值包括 Local、China 与 International

### 需求：Student Profile 行详情视图
系统应允许用户从列表查看完整学籍详情，采用与注册表单相同的七个 Tab 结构，并在 Others 之后增加只读 Status Log Tab。

#### 场景：打开详情抽屉
- 当用户点击某行的「详情」时，则系统显示只读抽屉，含 Basic Info、Enrollment、Contact、Education、Family、Accommodation、Others 与 Status Log 等 Tab，展示该生的全部已存字段

#### 场景：详情按学生类别展示字段
- 当用户打开 China 或 International 学生的「详情」时，则 Basic Info Tab 显示护照相关字段，并按该生类别隐藏 Local 专属的 IC 字段

### 需求：Student Profile 模拟数据
系统应使用本地模拟数据展示 Student Profile 列表，不调用后端 API。

#### 场景：初始数据加载
- 当用户打开 Student Profile 页面时，则表格显示模拟学籍记录，含与原型对齐的示例，如 XMUM2309001，涵盖 Local、China、International 类别及 Active 状态

#### 场景：China 模拟数据使用护照或中国身份字段
- 当用户打开类别为 China 的模拟学生 XMUM2309002 的「详情」时，则 Basic Info 显示适用于 China 的身份字段，而非以 Local IC No. 作为主标识

#### 场景：International 模拟数据使用护照字段
- 当用户打开类别为 International 的模拟学生 XMUM2309003 的「详情」时，则 Basic Info 显示护照相关字段，而非以 Local IC No. 作为主标识

## 移除需求

### 需求：Student Profile 列表工具栏操作
#### 场景：导入占位
**原因**：导入已实现模板下载与 Excel 解析。
**迁移说明**：使用导入弹框上传学籍 Excel 文件。

## 新增需求

### 需求：Student Profile 新建与编辑注册表单
系统应提供「新建学籍注册」抽屉，用于创建与编辑学籍记录，含与原型对齐的七个 Tab。

#### 场景：打开新建表单
- 当用户在 Student Profile 页面点击「新增」时，则系统打开空的注册抽屉，标题为新建学籍注册，Student Category 单选选项为 Local、China 与 International

#### 场景：注册 Tab 展示
- 当注册抽屉已打开时，则系统显示 Basic Info、Enrollment、Contact、Education、Family、Accommodation 与 Others 七个 Tab

#### 场景：打开编辑表单
- 当用户点击表格行的「编辑」时，则系统以编辑模式打开预填该生数据的注册抽屉

#### 场景：保存新学籍
- 当用户填写必填字段并在新学籍上点击「保存」时，则系统校验输入、将学生加入列表、关闭抽屉并在表格中显示新行

#### 场景：保存编辑学籍
- 当用户在编辑模式下修改字段并点击「保存」时，则系统校验输入、更新现有记录，并在表格中反映变更

#### 场景：重复学号被拒绝
- 当用户保存的 Student ID 已在其他记录中存在时，则系统阻止保存并显示校验错误

#### 场景：取消关闭抽屉
- 当用户在注册抽屉中点击「取消」时，则抽屉关闭且不保存未保存的变更

#### 场景：Local Basic Info 字段
- 当用户在注册抽屉 Basic Info Tab 中选择 Student Category Local 时，则表单显示 IC No. 与 State of Birth，不显示护照专属或 China 专属身份字段

#### 场景：China Basic Info 字段
- 当用户在注册抽屉 Basic Info Tab 中选择 Student Category China 时，则表单显示 Passport No.、Passport Expiry、Place of Birth、Candidate No.、Political Outlook 与 Identity No. (China ID)，不显示 IC No. 或 State of Birth

#### 场景：International Basic Info 字段
- 当用户在注册抽屉 Basic Info Tab 中选择 Student Category International 时，则表单显示 Passport No.、Passport Expiry 与 Place of Birth，不显示 IC No.、State of Birth 或 China 专属身份字段

#### 场景：保存时按类别校验
- 当用户保存未填写 IC No. 的 Local 学生时，则系统阻止保存并在 Basic Info 显示校验错误

#### 场景：China 或 International 无 IC No. 可保存
- 当用户保存 China 或 International 学生且未填写 IC No.，但其他必填共享字段已填写完整时，则若其他必填字段有效，系统允许保存

### 需求：Student Profile 删除记录
系统应允许用户单独或批量删除学籍记录。

#### 场景：删除单行
- 当用户点击某行的「删除」并确认时，则系统从列表中移除该学生

#### 场景：删除选中行
- 当用户选中一行或多行、点击工具栏「删除」并确认时，则系统从列表中移除所有选中的学生

### 需求：Student Profile 从 Excel 导入
系统应支持从 Excel 模板导入学籍记录，覆盖列表、基本信息与学籍核心字段。

#### 场景：下载导入模板
- 当用户打开导入弹框并点击下载模板时，则系统下载含列标题与示例行的 Excel 文件

#### 场景：导入有效行
- 当用户上传有效 Excel 文件并确认导入时，则系统将解析出的学籍记录加入列表，并显示含导入条数的成功摘要

#### 场景：导入跳过重复学号
- 当用户上传的文件中包含已存在的 Student ID 时，则系统跳过这些行并在导入结果中报告

#### 场景：导入校验错误
- 当用户上传的文件中某行缺少必填字段时，则系统跳过无效行并报告行号与原因

#### 场景：导入仅对 Local 行校验 IC No.
- 当用户上传 Student Category 为 Local 且缺少 IC No. 的行时，则系统跳过该行并报告校验错误

#### 场景：导入接受无 IC No. 的 China 行
- 当用户上传 Student Category 为 China、护照或中国身份字段有效且无 IC No. 的行时，则若其他必填字段有效，系统可导入该行

### 需求：Student Profile 扩展导出
系统应支持导出列表列与扩展档案字段。

#### 场景：导出列表列
- 当用户仅选中列表列字段导出时，则下载的 Excel 与表格列集合一致

#### 场景：导出扩展档案字段
- 当用户选中扩展档案字段导出时，则下载的 Excel 包含七个注册 Tab 的扁平化字段

### 需求：Student Profile Basic Info 照片上传
系统应在新建与编辑时支持在 Basic Info Tab 上传学生照片。

#### 场景：上传照片预览
- 当用户在 Basic Info Tab 选择图片文件时，则系统在表单中显示所选照片预览，无需后端上传

#### 场景：详情中显示照片
- 当用户查看已存照片的学生的「详情」时，则 Basic Info Tab 显示照片预览

### 需求：Student Profile 按类别的 Education 字段
系统应根据 Student Category 显示不同的 Education Tab 字段。

#### 场景：Local Education 显示中文语言测试
- 当用户在新建、编辑或详情模式下查看 Local 学生的 Education Tab 时，则表单显示 Chinese Test Result、Chinese Test Date 与 Chinese Test Expiry 字段

#### 场景：China Education 隐藏中文语言测试
- 当用户在新建、编辑或详情模式下查看 China 学生的 Education Tab 时，则表单不显示 Chinese Test Result、Chinese Test Date 或 Chinese Test Expiry 字段

#### 场景：International Education 显示中文语言测试
- 当用户在新建、编辑或详情模式下查看 International 学生的 Education Tab 时，则表单显示 Chinese Test Result、Chinese Test Date 与 Chinese Test Expiry 字段

#### 场景：所有类别的 Qualification 下拉
- 当用户在新建或编辑模式下查看 Local、China 或 International 学生的 Education Tab 时，则 Qualification 以下拉选择方式呈现

### 需求：Student Profile 按类别的 Others 字段
系统应根据 Student Category 显示不同的 Others Tab 字段。Others Tab 不得包含 Status Change Log 文本字段；状态历史仅在详情 Status Log Tab 中展示。

#### 场景：Local Others 含税务登记
- 当用户查看 Local 学生的 Others Tab 时，则表单显示 Tax Registration No，以及 Registration Date、Sponsor 与 Remarks

#### 场景：China 或 International Others 不含税务登记
- 当用户查看 China 或 International 学生的 Others Tab 时，则表单显示 Registration Date、Sponsor 与 Remarks，不显示 Tax Registration No

### 需求：Student Profile 详情 Status Log Tab
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

### 需求：Student Profile 按类别的 Enrollment 字段
系统应按原型规定，为 China 与 International 学生显示 Enrollment 字段控件差异。

#### 场景：所有类别的 Recruited By 下拉
- 当用户在新建或编辑模式下查看 Local、China 或 International 学生的 Enrollment Tab 时，则 Recruited By 以下拉方式呈现

#### 场景：Fujian Scholarship 仅 Local 显示
- 当用户查看 Local 学生的 Enrollment Tab 时，则显示 Fujian Scholarship Amt

#### 场景：China 与 International 隐藏 Fujian Scholarship
- 当用户查看 China 或 International 学生的 Enrollment Tab 时，则不显示 Fujian Scholarship Amt

## 修改需求

### 需求：Student Profile Enrollment 主数据下拉
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

### 需求：Student Profile Accommodation 代码集下拉
系统应在 Accommodation Tab 将 Hostel Status、Room Type、Campus、Block No 与 Room No 以下拉方式呈现，选项来自基础数据代码集模块中的 Student Code Sets。Floor No、Unit No、Bed No、日期字段与金额字段应按规格保持非代码集控件。

#### 场景：新建或编辑中 Accommodation 代码集下拉
- 当用户在新建或编辑模式下查看 Accommodation Tab 时，则 hostel status、room type、campus、block no 与 room no 为由代码集条目填充的下拉
- 且 floor no、unit no 与 bed no 在本阶段仍为文本输入

#### 场景：代码集选项来自 Student Code Sets
- 当系统加载 Accommodation 下拉选项时，则从代码集管理中维护的 Student Code Sets 条目解析选项（本阶段为模拟种子与本地存储）

#### 场景：Accommodation 详情与编辑一致性
- 当用户打开含 Accommodation 值的学生的「详情」或「编辑」时，则已存的下拉值在代码集列表中存在时显示为选中项

#### 场景：展示用模拟数据与 Accommodation 代码集对齐
- 当用户打开模拟学生 XMUM2309001、XMUM2309002 或 XMUM2309003 的「编辑」时，则 Accommodation 下拉字段值与对应 Student Code Sets 中的条目一致

## 移除需求

### 需求：Student Profile Enrollment 主数据下拉（§14 独立五字段模型）
**原因**：§16 以专业名称驱动联动取代独立的 Programme Code / Faculty 下拉；programme level 与 duration 变为只读派生字段。
**迁移说明**：参见 §16 修改需求「Student Profile Enrollment 主数据下拉」。

#### 场景：Enrollment 字段在新建或编辑中使用基础数据选项（§14 五个独立下拉）
- **已移除** — programme code 与 faculty 不再作为独立主下拉

#### 场景：独立选择无联动
- **已移除** — 专业名称现驱动 programme code、faculty、programme level 与 duration

## 修改需求

### 需求：Student Profile 扩展导出
系统应提供与 Programme Version 模块一致的导出对话框：双列表字段穿梭（Available Fields / Selected Fields）、移动按钮，以及 Export Setting 中的 Current Page、All Results 与 Selected Rows 选项。

#### 场景：导出对话框穿梭布局
- 当用户在 Student Profile 页面有数据可导出时点击「导出」，则系统打开共享 Export 弹框，左侧为 Available Fields、右侧为 Selected Fields，与 Programme Version 一致

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

### 需求：Student Profile 行详情视图
系统应在详情抽屉的全部七个 Tab 中以不同 typography 展示只读字段标签与值。字段标签应使用较小、较淡的样式；字段值应使用较大、强调的样式。显示为 em dash 的空值应使用与有值字段区分的 subdued 空状态样式。

#### 场景：详情中标签与值的视觉层级
- 当用户打开「详情」并查看任意 Tab 时，则字段标签与字段值在字号、字重与颜色上视觉区分
- 且编辑模式表单输入不受影响

#### 场景：详情中空值样式
- 当某字段在详情模式下无已存值时，则系统以 subdued 空状态样式显示 em dash

#### 场景：详情头部区域的学生类别行
- 当用户打开「详情」时，则 Tab 上方的学生类别标签与值遵循相同的标签/值层级

### 需求：Student Profile 模拟数据
系统应为展示用学籍记录填充具有代表性的 Tab 内容，使详情视图不被大量空占位符占据。

#### 场景：Local 展示记录内容丰富
- 当用户打开模拟学生 XMUM2309001 的「详情」时，则 Basic Info、Enrollment、Contact、Education、Family、Accommodation 与 Others 各 Tab 在大多数字段上显示具体演示值
- 且每个 Tab 可有少量可选字段保持为空

#### 场景：China 与 International 展示记录
- 当用户打开 XMUM2309002 或 XMUM2309003 的「详情」时，则按类别适配的字段在多个 Tab 上填充具体演示值
- 且可为演示目的保留部分空的可选字段
