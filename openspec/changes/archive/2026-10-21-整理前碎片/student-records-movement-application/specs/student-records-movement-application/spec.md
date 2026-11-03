# 学籍管理-异动申请（教职工/学生端） 规格（合并）

## 说明

以下为各历史 delta spec 原文按来源拼接并做术语中文化处理。整理正式需求文档时，应按场景重写为「用户故事 / 验收标准」，消除重复与过时条目。

## 来源 `add-deferment-app` / 能力 `deferment-app`

## 新增需求

### 需求：休学列表页展示休学历史
系统应展示分页的 Deferment History 表格，列包括：Application ID、学生ID、Name、Intake、Programme、Deferment Period、Reason、Status、Date 和 Actions。

#### 场景：默认列表加载
- **当** 用户在 学生Records 侧边栏导航至 Deferment
- **则** 系统展示 Deferment 页面，包含 Deferment History 表格及至少一条 mock 示例记录

#### 场景：六种核心状态的 Status 徽章展示
- **当** 记录状态为 Draft、In Progress、Update Required、Approved、Rejected 或 Cancelled
- **则** 系统以只读徽章展示状态，样式与转专业徽章对齐且区分明显

#### 场景：Reason 列显示主要原因
- **当** 列表中展示一条休学记录
- **则** Reason 列显示已本地化的主要原因值

#### 场景：列表操作遵循状态规则
- **当** 用户查看 Draft 记录
- **则** Actions 列显示 Details、Edit、Delete 和 Workflow Log
- **当** 用户查看处于 Pending Review 阶段且符合取消条件的 In Progress 记录
- **则** Actions 列显示 Details、Cancel 和 Workflow Log
- **当** 用户查看 Update Required 记录
- **则** Actions 列显示 Details、Edit 和 Workflow Log
- **当** 用户查看 Cancelled、Rejected 或 Approved 记录
- **则** Actions 列仅显示 Details 和 Workflow Log

### 需求：搜索休学申请
系统应支持通过 学生ID 或 Name 搜索申请；搜索栏位于列表页卡片第一行。

#### 场景：搜索栏为第一行且无页面标题
- **当** 用户导航至 Deferment
- **则** 列表卡片不显示大号页内标题
- **且** 卡片第一行为搜索栏，Search 和 Reset 操作右对齐

#### 场景：按学号或姓名搜索
- **当** 用户输入关键词并点击 Search
- **则** 列表仅显示匹配记录，并重置到第 1 页

#### 场景：重置搜索
- **当** 用户清空关键词并点击 Reset
- **则** 恢复完整列表

### 需求：创建与编辑休学申请并支持草稿
系统应允许用户通过多区块表单弹框创建与编辑休学申请，支持 Save Draft 与 Submit 工作流。

#### 场景：打开创建表单
- **当** 用户点击「+ New Deferment」
- **则** 系统打开 Deferment 表单弹框，包含 Section I–III、Supporting Documents，以及页脚操作 Close、Save Draft 和 Submit

#### 场景：保存草稿
- **当** 用户在新建或编辑申请上点击 Save Draft
- **则** 申请以 Draft 状态保存，出现在列表中，并提供 Edit 和 Delete 操作

#### 场景：提交申请
- **当** 用户完成所有提交必填字段并点击 Submit
- **则** 申请状态变为 In Progress，审批阶段为 Pending Review

#### 场景：每名学生仅一条有效申请
- **当** 用户尝试为已有 Draft、In Progress 或 Update Required 休学申请的学生提交
- **则** 系统阻止提交并显示校验提示

### 需求：休学表单区块与原型一致
系统应渲染与 StudentSys 原型对齐的申请表单区块与字段。

#### 场景：Section I 学生信息
- **当** 用户在表单中查看 Section I
- **则** 系统展示 学生ID（必填，可搜索选择）、Date of Application（只读）、Name、Intake、NRIC/Passport No.、Nationality、Programme 和 Programme Level

#### 场景：学生ID 自动填充
- **当** 用户从学生档案数据中选择 学生ID
- **则** 系统从关联学生档案自动填充 Section I 和 Section II 字段

#### 场景：Section II、III 与支持材料
- **当** 用户查看表单
- **则** 系统展示 Section II 申请字段、Section III 家长/监护人字段，以及必填支持材料上传及格式提示

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
- **则** 记录未从 Deferment History 中物理删除

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

### 需求：休学审批工作流
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

### 需求：休学列表提供工作流日志操作
系统应在每条休学申请行上提供 Workflow Log 操作，与状态无关。

#### 场景：工作流日志打开独立弹框
- **当** 用户点击休学行的 Workflow Log
- **则** 系统打开 ApprovalLogModal，以表格形式展示审批日志条目
- **且** 弹框副标题显示 application ID、学生ID 和 学生name
- **且** 详情弹框内不包含行内审批日志区块

#### 场景：无提交记录的 Draft 工作流日志
- **当** 用户点击无日志条目的 Draft 申请的 Workflow Log
- **则** 弹框打开并显示无数据提示

### 需求：休学详情弹框不内嵌审批日志
系统不得在 DefermentDetailModal 内展示审批日志时间线。

#### 场景：详情弹框无日志区块
- **当** 用户打开任意休学申请的 Details
- **则** 详情弹框仅展示申请区块及进行中审批控件
- **且** 不展示行内审批日志列表

### 需求：休学状态演示 mock 数据
系统应提供覆盖 Draft、In Progress、Cancelled、Update Required、Rejected 和 Approved 的 mock 休学记录，每状态至少两条。

#### 场景：Draft 状态示例
- **当** 用户加载含 mock 数据的 Deferment History
- **则** 至少存在两条 Draft 记录，并提供 Edit 和 Delete 操作

#### 场景：In Progress 状态示例
- **当** 用户加载含 mock 数据的 Deferment History
- **则** 至少存在两条 In Progress 记录，其中一条为 Pending Review 且可 Cancel，另一条已超过 Pending Review 且不可 Cancel

#### 场景：Cancelled、Update Required、Rejected、Approved 示例
- **当** 用户加载含 mock 数据的 Deferment History
- **则** Cancelled、Update Required、Rejected 和 Approved 各状态至少存在两条记录

### 需求：休学页面支持双语 i18n
系统应为 Deferment 页面全部 UI 文案（含六种状态徽章与工作流操作）提供中英文翻译。

#### 场景：切换语言区域
- **当** 用户切换应用语言
- **则** Deferment 列表、表单、详情、状态徽章与操作均显示当前语言区域文案

### 需求：休学页面注册于学籍应用
系统应在 学生Records Application 中将 Deferment 注册为已开发页面。

#### 场景：侧边栏导航
- **当** 用户在 学生Records 侧边栏选择 Deferment
- **则** 系统展示 DefermentView，而非施工中页面

## 来源 `add-deferment-app` / 能力 `student-records-app`

## 修改需求

### 需求：学生Records 侧边栏扁平菜单
系统应提供与原型一致的扁平侧边栏菜单，包含六个顶级菜单项。

#### 场景：菜单项列表
- **当** 用户打开 学生Records Application
- **则** 侧边栏按顺序列出 学生Profile、Family Info、Programme Transfer、Deferment、Resumption、Withdrawal

#### 场景：Deferment 导航
- **当** 用户在侧边栏选择 Deferment
- **则** 系统展示 Deferment History 列表页

#### 场景：未开发菜单页
- **当** 用户选择 Family Info
- **则** 系统展示应用内建设中页，并提供返回 学生Profile 的操作

### 需求：Deferment 列表对齐学籍流转日志模式
系统应将 Programme Transfer 使用的流转日志外置模式应用于 Deferment 模块。

#### 场景：Deferment 参与四模块日志一致性
- **当** 用户对比 Deferment 与 Programme Transfer、Resumption、Withdrawal 列表页
- **则** 各模块均在每行通过共享 `ApprovalLogModal` 组件暴露 Workflow Log
- **且** 四个模块均不在详情 Modal 内嵌 approval log

## 来源 `add-deferment-period-dates` / 能力 `deferment-app`

## 新增需求

### 需求：休学期限起止日期

系统应在休学申请表单中于 Deferment Period 正下方展示只读的 Deferment Start Date 和 Deferment End Date 字段（dd/MM/YYYY），适用于管理员和学生申请人模式。

#### 场景：根据所选期限派生日期
- **当** 用户选择的 Deferment Period 匹配基础数据中的学期记录
- **则** Start Date 和 End Date 从该记录的 `startDate` 和 `endDate` 填充
- **且** 两个字段保持只读

#### 场景：清除期限时清空日期
- **当** 用户清除 Deferment Period
- **则** Start Date 和 End Date 被清空

#### 场景：保存时持久化日期
- **当** 用户保存或提交休学申请
- **则** `defermentStartDate` 和 `defermentEndDate` 存储于申请记录

### 需求：休学详情展示期限日期

系统应在休学详情及统一异动详情视图中展示休学起止日期。

#### 场景：详情只读展示
- **当** 用户打开休学申请详情
- **则** Deferment Start Date 和 Deferment End Date 显示于 Deferment Period 下方

### 需求：状态日志休学日期备注

休学实施至学生档案时，系统应追加一条状态日志，其备注包含申请中的休学日期范围。

#### 场景：备注包含序数日期范围
- **当** 休学维护实施已批准申请
- **则** 新增 Deferment 状态日志的 `remarkLines` 包含一行 `{N}th Deferment: {startDate}-{endDate}`，使用存储的申请日期
- **且** 备注不包含复学信息

## 来源 `add-deferment-period-field-tooltip` / 能力 `deferment-app`

## 新增需求

### 需求：休学期间字段提示

休学申请表单应在「休学期间」字段标签旁显示 tooltip，说明下拉选项可包含申请日期之前（休学补回）与之后的学期。

#### 场景：表单标签上的 tooltip
- **当** 用户打开休学申请表单（教师端或学生端）
- **则** 「休学期间」标签旁显示 `?` 提示图标及与原型一致的 tooltip 文案

## 来源 `add-deferment-resumption-period-date-fields` / 能力 `deferment-app`

## 新增需求

### 需求：休学/复学 Section II 休学起止日期只读回显

休学与复学申请表单 Section II 应在「休学期间」相关字段下方展示只读的休学开始日期与休学结束日期，格式 dd/MM/YYYY，随所选休学期间联动，不可手改。

#### 场景：休学表单展示起止日期
- **当** 用户在休学表单中选择或切换休学期间
- **则** Section II 自动带出对应 `semesterInfo` 的起止日期至只读字段

#### 场景：复学表单联动休学期间
- **当** 用户在复学表单中选择休学期间
- **则** Section II 同样展示与休学期间对应的起止日期只读字段

#### 场景：切换学期更新日期
- **当** 用户更换休学期间选项
- **则** 起止日期字段同步更新为新学期范围

## 来源 `add-movement-declaration-parent-email-notice` / 能力 `movement-declaration`

## MODIFIED Requirements

### Requirement: 各类型 Section V 声明条款

异动申请表单与详情视图 必须在 Section V 按类型显示编号的声明条款。所有异动类型 必须在通用正确性条款之后包含家长/监护人申请结果邮件通知告知条款（中英文）。

#### Scenario: 退学显示两条通用条款
- **WHEN** 用户查看退学 Section V
- **THEN** 第一条声明申请信息正确且完整
- **AND** 第二条声明家长/监护人将通过电子邮件获知申请结果

#### Scenario: 休学与复学在通用两条之后含最长修业年限
- **WHEN** 用户查看休学或复学 Section V
- **THEN** 前两条为通用正确性声明与家长邮件通知告知
- **AND** 其后为最长修业年限确认

#### Scenario: 转专业在通用两条之后含专有条款
- **WHEN** 用户查看转专业 Section V
- **THEN** 前两条为通用正确性声明与家长邮件通知告知
- **AND** 其后依次为规则承诺及签证注销确认

#### Scenario: 中英文文案
- **WHEN** 界面语言为英文
- **THEN** 家长通知条款展示为 `I acknowledge that my parent(s)/guardian(s) will be notified of the application result by email.`
- **WHEN** 界面语言为中文
- **THEN** 家长通知条款展示为 `我知悉，家长/监护人将通过电子邮件获知本申请结果。`

## 来源 `add-movement-international-remarks-and-documents` / 能力 `movement-application`

## 新增需求

### 需求：国际生备注区块

当申请人的 `studentCategory` 为 `International` 时，系统应在休学、转专业、复学、退学异动申请表单及详情视图中，于 Applicant Notes 下方立即展示国际生备注区块。

该区块对 Local 或 China 类别不应显示。

#### 场景：国际生休学申请人看到备注
- **当** 教师为 `studentCategory` 为 International 的学生打开休学表单
- **则** 国际生备注区块出现在 Applicant Notes 下方
- **且** 区块使用休学专用 i18n 内容

#### 场景：本地生不显示备注
- **当** `studentCategory` 为 Local 的学生打开任意异动申请表单
- **则** 国际生备注区块隐藏

### 需求：多槽位文档上传

异动申请表单应根据申请人类别与异动类型支持多行文档上传。

#### 场景：所有申请人均需上传同意书
- **当** 任意申请人提交异动申请（非 Draft）
- **则** 必须上传同意书附件
- **且** 接受格式为 PDF、DOC、DOCX，最大 20MB

#### 场景：异动附件可清除已上传文件
- **当** 用户在异动申请表单 Section IV 已为某槽位选择文件
- **则** 该槽位在文件名/预览旁 必须 提供删除标志
- **当** 用户点击删除
- **则** 清空该槽位已选文件，恢复为未选择状态

#### 场景：异动附件格式与大小提示及校验
- **当** 用户查看异动申请附件上传区（转专业/休学/复学/退学，管理端或学生端）
- **则** 格式提示中文为「支持格式：Word 和 PDF。大小在 20MB 以下。」，英文为「Upload file format: Word and PDF. Size below 20MB.»
- **且** 选择文件时 必须 按扩展名仅接受 `.pdf`、`.doc`、`.docx`，大小不得超过 20MB；不符合时 必须 拒绝并提示，必须NOT 写入该槽位

#### 场景：国际生申请人上传机票
- **当** International 申请人提交任意异动申请（非 Draft）
- **则** 除同意书外还必须上传机票附件

#### 场景：转专业含其他附件
- **当** 用户打开转专业申请表单（任意学生类别；管理端或学生端）
- **则** 附件区在同意书（及国际生机票*）之后展示「其他附件」（可选，默认一行可添加更多）

#### 场景：复学医疗康复证明为可选
- **当** 申请人提交复学申请（非 Draft）
- **则** 显示医疗康复文档上传行
- **且** 该字段为可选

#### 场景：详情视图展示所有已上传槽位
- **当** 用户打开含多个附件的异动申请详情
- **则** 列出每个已配置的文档槽位，并在适用时提供预览/下载

#### 场景：退学附件按国籍清单
- **当** 用户打开退学申请表单且学生国籍为马来西亚（管理端或学生端）
- **则** 附件区按顺序展示：同意书*、住宿退宿表、病历、其他附件
- **且** 不展示机票槽位，不展示中国身份证槽位
- **当** 用户打开退学申请表单且学生国籍为中国
- **则** 附件区按顺序展示：同意书*、住宿退宿表、机票*、中国身份证正面&反面*（单槽）、病历、其他附件
- **当** 用户打开退学申请表单且学生为其他国籍（非马来西亚、非中国）
- **则** 附件区按顺序展示：同意书*、住宿退宿表、机票*、病历、其他附件
- **且** 中文界面上述标签为中文，英文界面为英文
- **且** 休学/复学附件字段清单不受本场景影响

#### 场景：退学提交校验机票（非马来西亚）
- **当** 用户提交退学申请（非 Draft）且学生国籍为中国或其他，且未上传 Flight Tickets
- **则** 校验失败并提示需上传支持性文件
- **当** 用户提交退学申请（非 Draft）且学生国籍为马来西亚
- **则** 必须NOT 因缺少机票而校验失败

#### 场景：退学提交校验中国身份证
- **当** 用户提交退学申请（非 Draft）且学生国籍为中国，且未上传「中国身份证正面&反面」
- **则** 校验失败并提示需上传支持性文件
- **当** 学生国籍非中国
- **则** 必须NOT 展示该槽位，必须NOT 因缺少该槽位而校验失败

#### 场景：切换学生清空退学附件
- **当** 管理端在退学新建表单中已选学生 A 并可能已上传附件后，改选学生 B
- **则** 系统清空全部附件槽位，并提示已切换学生需重新上传
#### 场景：休学附件按国籍图示1–3
- **当** 用户打开休学申请表单（管理端或学生端）且学生国籍为马来西亚
- **则** 附件区展示：休学同意书*、病历（可选）、其他附件（默认一行可增/关）
- **且** 不展示机票槽位

#### 场景：休学中国与其他国籍含机票
- **当** 用户打开休学申请表单且学生国籍为中国或其他（非马来西亚）
- **则** 附件区在病历之后展示机票（国际学生），再展示其他附件
- **且** 机票按图示为可选（无红星）

#### 场景：休学切换学生清空附件
- **当** 管理端在休学新建表单中改选另一学生
- **则** 清空附件并提示需重新上传

#### 场景：复学附件按国籍图示1–3
- **当** 用户打开复学申请表单（管理端或学生端）且学生国籍为马来西亚
- **则** 附件区展示：医疗康复证明材料（可选）、其他附件（默认一行可增/关）
- **且** 不展示签证相关材料与同意书

#### 场景：复学中国与其他国籍含签证材料
- **当** 用户打开复学申请表单且学生国籍为中国或其他（非马来西亚）
- **则** 附件区按顺序展示：签证相关材料*、医疗康复证明材料（可选）、其他附件
- **且** 提交时未上传签证相关材料则校验失败

#### 场景：复学切换学生清空附件
- **当** 管理端在复学新建表单中改选另一学生
- **则** 清空附件并提示需重新上传

### 需求：退学 ISAO 提示替换

对于 International 退学申请，系统应展示国际生备注，而非旧版 `isaoNoteAlert` 页脚区块。

#### 场景：国际生退学表单
- **当** International 学生打开退学表单
- **则** 国际生备注出现在 Applicant Notes 下方
- **且** 不显示旧版 `isaoNoteAlert` 区块

## 来源 `add-movement-parent-contacts-from-family` / 能力 `movement-parent-contacts`

# 异动家长/监护人联系人

## 新增需求

### 需求：从学生家庭成员填充家长联系方式

#### 场景：选择学生后填充 Section III
- **当** 用户在休学或退学申请表单中选择学生
- **则** 系统应使用 `student.family[]` 中所有非空联系人填充 Section III，作为可编辑的 `parentContacts[]` 快照
- **且** 修改不应写回学生档案

### 需求：多个联系人展示（表单）

#### 场景：联系人块重复布局与标题
- **当** 用户在休学或退学表单的 Section III 中查看家长/监护人联系人
- **则** 系统应为每个联系人重复原始单联系人 `form-grid` 布局
- **且** 每个联系人应显示编号标记（例如 Parent/Guardian 1、2）
- **且** 多于一个联系人时，联系人之间应有顶部分隔线

### 需求：表单增删联系人

#### 场景：删除任一联系人
- **当** Section III 存在至少一个家长/监护人联系人
- **则** 每个联系人标题行右侧应显示删除（垃圾桶）控件
- **当** 用户点击某条的删除控件
- **则** 该联系人应从 `parentContacts` 中移除
- **且** 允许删除后列表为空

#### 场景：空列表后手动添加
- **当** Section III 联系人为空
- **则** 系统不应自动插入空白联系人块
- **且** 应提供「添加家长/监护人」入口
- **当** 用户点击添加
- **则** 应追加一条空白可编辑联系人

#### 场景：存在联系人时也可添加
- **当** Section III 已有一位或多位联系人
- **则** 仍应提供添加入口，允许继续追加空白联系人

### 需求：休学校验

#### 场景：提交休学申请时校验家长联系人
- **当** 用户提交休学申请
- **则** 至少需要一条非空家长联系人
- **且** 每个非空家长联系人应要求填写姓名和手机号码

### 需求：退学校验

#### 场景：提交退学申请时校验家长联系人
- **当** 用户提交退学申请
- **则** 至少需要一条非空家长联系人
- **且** 每个非空家长联系人应要求填写姓名、关系、IC/护照、手机号码和电子邮件

### 需求：旧版兼容

#### 场景：扁平字段规范化为 parentContacts
- **当** 加载仅含扁平家长字段的记录
- **则** 系统应规范化为 `parentContacts[0]`
- **且** 保存时保持旧版字段与第一个联系人同步

### 需求：只读展示

#### 场景：详情中多个联系人时重复布局
- **当** 用户在休学或退学详情中查看多于一个家长/监护人联系人
- **则** 系统应为每个联系人重复原始单联系人 `detail-grid` 布局
- **且** 应显示与表单相同的编号标记和分隔线

#### 场景：详情中单个联系人时不显示分隔线
- **当** 仅存在一个联系人
- **则** 系统可显示编号标记，但不应显示联系人之间的分隔线
- **且** 不应显示增删控件

## 来源 `add-programme-transfer-app` / 能力 `programme-transfer-app`

## 新增需求

### 需求：转专业列表页展示申请历史
系统应展示分页的转专业申请历史表格，列包括：Application ID、学生ID、Name、Type、Old Programme、New Programme、Status、Date 和 Actions。

#### 场景：默认列表加载
- **当** 用户在 学生Records 侧边栏导航至 Programme Transfer
- **则** 系统展示 Programme Transfer Application 页面，包含 Application History 表格及至少一条 mock 示例记录

#### 场景：Type 列取值
- **当** 列表中展示一条转专业记录
- **则** Type 列显示「Programme Transfer」（已本地化）

#### 场景：Status 徽章展示
- **当** 记录状态为 Draft、In Progress、Update Required、Approved、Rejected、Cancelled 或 Expired
- **则** 系统以只读徽章展示状态，样式区分明显（非可编辑下拉框）

### 需求：搜索转专业申请
系统应支持通过单一关键词字段按 学生ID 或 Name 搜索申请。

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
- **则** 系统展示 学生ID（必填，可搜索选择）、Full Name、NRIC/Passport No.、Nationality、Email、Contact No. 和 学生Visa Expiry Date

#### 场景：学生ID 自动填充
- **当** 用户从学生档案数据中选择 学生ID
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
- **当** 用户未填写 学生ID、第一志愿专业、开学学期、转专业理由、声明或附件即点击 Submit
- **则** 系统阻止提交并显示行内校验提示

#### 场景：附件格式提示
- **当** 用户在 mock 上传器中选择附件文件
- **则** 系统仅存储文件元数据并显示所选文件名

### 需求：转专业页面注册于学籍应用
系统应在 学生Records Application 中将 Programme Transfer 注册为已开发页面。

#### 场景：侧边栏导航
- **当** 用户在 学生Records 侧边栏选择 Programme Transfer
- **则** 系统展示 ProgrammeTransferView，而非施工中页面

#### 场景：面包屑
- **当** 用户位于 Programme Transfer 页面
- **则** 面包屑显示 学生Status Management > Programme Transfer（已本地化）

## 修改需求

### 需求：搜索转专业申请
系统应支持通过 学生ID 或 Name 搜索申请；搜索栏位于列表页卡片第一行，采用字段标签后接输入控件的布局。

#### 场景：搜索栏为第一行且无页面标题
- **当** 用户导航至 Programme Transfer
- **则** 列表卡片不显示「Programme Transfer Application」等大号页内标题
- **且** 卡片第一行为搜索栏，含 Search 和 Reset 操作

#### 场景：搜索字段标签与输入含义一致
- **当** 用户查看搜索栏
- **则** 标签描述可搜索内容（如「学生ID or Name:」），文本输入与操作按钮位于同一行

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
- **则** 系统展示 学生ID（必填，可搜索选择）、Full Name、NRIC/Passport No.、Nationality、Email、Contact No. 和 学生Visa Expiry Date

#### 场景：学生ID 自动填充
- **当** 用户从学生档案数据中选择 学生ID
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

## 来源 `add-programme-transfer-app` / 能力 `student-records-app`

## 修改需求

### 需求：学生Records 侧边栏扁平菜单
系统应提供与原型一致的扁平侧边栏菜单，包含六个顶级菜单项。

#### 场景：菜单项列表
- **当** 用户打开 学生Records Application
- **则** 侧边栏按顺序列出 学生Profile、Family Info、Programme Transfer、Deferment、Resumption、Withdrawal

#### 场景：学生Profile 导航
- **当** 用户在侧边栏选择 学生Profile
- **则** 系统展示 学生Profile 列表页

#### 场景：Programme Transfer 导航
- **当** 用户在侧边栏选择 Programme Transfer
- **则** 系统展示 Programme Transfer Application 列表页

#### 场景：未开发菜单页
- **当** 用户选择 Family Info、Deferment、Resumption 或 Withdrawal
- **则** 系统展示应用内建设中页，并提供返回 学生Profile 的操作

## 来源 `add-programme-transfer-office-use-approval` / 能力 `programme-transfer`

## 新增需求

### 需求：转专业申请人对 Office Use 区块不可见

学生转专业申请表单不得展示 Section VII。

### 需求：审批人在审核时填写 Office Use 字段

审批转专业申请时，UI 应展示可编辑的 Section VII，默认值来自第一志愿专业、开学学期及当天日期。

#### 场景：字段标签与学生申请一致
- **当** 向审批人展示 Section VII
- **则** 专业和学期标签与学生申请表单字段标签一致

### 需求：Office Use 区块与周边详情布局一致

Section VII 应使用与其他转专业详情区块相同的 `section-bar` 和栅格布局。

#### 场景：已批准只读详情
- **当** 批准后以只读方式展示 Section VII
- **则** 字段使用 `detail-grid`（dt/dd）渲染，与 Sections I–VI 保持一致

#### 场景：审批中可编辑详情
- **当** 审批过程中以可编辑方式展示 Section VII
- **则** 字段使用与其他异动表单相同的两列 `form-grid` 和 `form-control` 样式

## 来源 `add-programme-transfer-status-log-remark` / 能力 `programme-transfer-app`

## 新增需求

### 需求：转专业状态日志备注含学期信息

转专业实施时，系统应追加一条学生档案状态日志，其备注包含已批准申请中的批准学年学期和生效学年学期。

#### 场景：旧版风格备注行
- **当** 维护实施已批准转专业
- **则** `remarkLines` 包含 `Programme transfer, {oldCode} to {newCode}, approved in {applicationSession}, effective from {effectiveSession}`

#### 场景：不更改学籍状态
- **当** 转专业被实施
- **则** 学生学籍状态保持不变，同时仍追加状态日志条目

## 来源 `add-resumption-app` / 能力 `resumption-app`

## 新增需求

### 需求：复学列表页展示复学历史
系统应展示分页的 Resumption History 表格，列包括：Application ID、学生ID、Name、Programme、Original Intake、Resume Intake、Status、Date 和 Actions。

#### 场景：默认列表加载
- **当** 用户在 学生Records 侧边栏导航至 Resumption
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
系统应支持通过 学生ID 或 Name 搜索申请；搜索栏位于列表页卡片第一行。

#### 场景：搜索栏为第一行且无页面标题
- **当** 用户导航至 Resumption
- **则** 列表卡片不显示大号页内标题
- **且** 卡片第一行为搜索栏，Search 和 Reset 操作右对齐

#### 场景：搜索字段标签与输入含义一致
- **当** 用户查看搜索栏
- **则** 标签描述可搜索内容（如「学生ID or Name:」），后接文本输入框

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
- **则** 系统展示 学生ID（必填，可搜索选择）、Date of Application（只读，当前日期）、Name、Original Intake、Programme、Programme Level、NRIC/Passport No. 和 Nationality

#### 场景：学生ID 自动填充
- **当** 用户从学生档案数据中选择 学生ID
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
- **则** 系统仅要求 学生ID，允许在未填写声明或附件时保存

#### 场景：提交校验
- **当** 用户未填写 学生ID、deferment semester、resumption semester、附件或任一声明勾选框即点击 Submit 或 Resubmit
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
- **且** 弹框副标题显示 application ID、学生ID 和 学生name
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
系统应在 学生Records Application 中将 Resumption 注册为已开发页面。

#### 场景：侧边栏导航
- **当** 用户在侧边栏选择 Resumption
- **则** 系统展示 ResumptionView，而非施工中页面

## 来源 `add-resumption-app` / 能力 `student-records-app`

## 修改需求

### 需求：学生Records 侧边栏扁平菜单
系统应提供与原型一致的扁平侧边栏菜单，包含六个顶级菜单项。

#### 场景：菜单项列表
- **当** 用户打开 学生Records Application
- **则** 侧边栏按顺序列出 学生Profile、Family Info、Programme Transfer、Deferment、Resumption、Withdrawal

#### 场景：学生Profile 导航
- **当** 用户在侧边栏选择 学生Profile
- **则** 系统展示 学生Profile 列表页

#### 场景：Programme Transfer 导航
- **当** 用户在侧边栏选择 Programme Transfer
- **则** 系统展示 Programme Transfer Application 列表页

#### 场景：Deferment 导航
- **当** 用户在侧边栏选择 Deferment
- **则** 系统展示 Deferment History 列表页

#### 场景：Resumption 导航
- **当** 用户在侧边栏选择 Resumption
- **则** 系统展示 Resumption History 列表页

#### 场景：未开发菜单页
- **当** 用户选择 Family Info 或 Withdrawal
- **则** 系统展示应用内建设中页，并提供返回 学生Profile 的操作

### 需求：Resumption 列表对齐学籍流转日志模式
系统应将 Programme Transfer、Deferment 使用的流转日志外置模式应用于 Resumption 模块。

#### 场景：Resumption 参与四模块日志一致性
- **当** 用户对比 Resumption 与 Programme Transfer、Deferment、Withdrawal 列表页
- **则** 各模块均在每行通过共享 `ApprovalLogModal` 组件暴露 Workflow Log
- **且** 四个模块均不在详情 Modal 内嵌 approval log

## 来源 `add-withdrawal-app` / 能力 `student-records-app`

## 修改需求

### 需求：学生Records 侧边栏扁平菜单
系统应提供与原型一致的扁平侧边栏菜单，包含六个顶级菜单项。

#### 场景：菜单项列表
- **当** 用户打开 学生Records Application
- **则** 侧边栏按顺序列出 学生Profile、Family Info、Programme Transfer、Deferment、Resumption、Withdrawal

#### 场景：学生Profile 导航
- **当** 用户在侧边栏选择 学生Profile
- **则** 系统展示 学生Profile 列表页

#### 场景：Programme Transfer 导航
- **当** 用户在侧边栏选择 Programme Transfer
- **则** 系统展示 Programme Transfer Application 列表页

#### 场景：Deferment 导航
- **当** 用户在侧边栏选择 Deferment
- **则** 系统展示 Deferment History 列表页

#### 场景：Resumption 导航
- **当** 用户在侧边栏选择 Resumption
- **则** 系统展示 Resumption History 列表页

#### 场景：Withdrawal 导航
- **当** 用户在侧边栏选择 Withdrawal
- **则** 系统展示 Withdrawal History 列表页

#### 场景：未开发菜单页
- **当** 用户选择 Family Info
- **则** 系统展示应用内建设中页，并提供返回 学生Profile 的操作

### 需求：Withdrawal 列表对齐学籍流转日志模式
系统应将 Programme Transfer、Deferment、Resumption 使用的流转日志外置模式应用于 Withdrawal 模块。

#### 场景：Withdrawal 参与四模块日志一致性
- **当** 用户对比 Withdrawal 与 Programme Transfer、Deferment、Resumption 列表页
- **则** 各模块均在每行通过共享 `ApprovalLogModal` 组件暴露 Workflow Log
- **且** 四个模块均不在详情 Modal 内嵌 approval log

## 来源 `add-withdrawal-app` / 能力 `withdrawal-app`

## 新增需求

### 需求：退学列表页展示退学历史
系统应展示分页的 Withdrawal History 表格，列包括：Application ID、学生ID、Name、Programme、Intake、Reason、Status、Date 和 Actions。

#### 场景：默认列表加载
- **当** 用户在 学生Records 侧边栏导航至 Withdrawal
- **则** 系统展示 Withdrawal 页面，包含 Withdrawal History 表格及至少一条 mock 示例记录

#### 场景：六种核心状态的 Status 徽章展示
- **当** 记录状态为 Draft、In Progress、Update Required、Approved、Rejected 或 Cancelled
- **则** 系统以只读徽章展示状态，样式与转专业、休学徽章对齐且区分明显

#### 场景：Reason 列显示主要原因且无层次后缀
- **当** 列表中展示一条退学记录
- **则** Reason 列显示已本地化的主要原因文本，不附加 (UG) 或 (PG) 后缀

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

### 需求：搜索退学申请
系统应支持通过 学生ID 或 Name 搜索申请；搜索栏位于列表页卡片第一行。

#### 场景：搜索栏为第一行且无页面标题
- **当** 用户导航至 Withdrawal
- **则** 列表卡片不显示大号页内标题
- **且** 卡片第一行为搜索栏，Search 和 Reset 操作右对齐

#### 场景：搜索字段标签与输入含义一致
- **当** 用户查看搜索栏
- **则** 标签描述可搜索内容（如「学生ID or Name:」），后接文本输入框

#### 场景：按学号或姓名搜索
- **当** 用户输入关键词并点击 Search
- **则** 列表仅显示匹配记录，并重置到第 1 页

#### 场景：重置搜索
- **当** 用户清空关键词并点击 Reset
- **则** 恢复完整列表

### 需求：创建与编辑退学申请并支持草稿
系统应允许用户通过多区块表单弹框创建与编辑退学申请，支持 Save Draft 与 Submit 工作流。

#### 场景：打开创建表单
- **当** 用户点击「+ New Withdrawal」
- **则** 系统打开 Withdrawal Application 表单弹框，包含 Section I–III、声明、支持材料、条件性 ISAO 说明区域，以及页脚操作 Close、Save Draft 和 Submit

#### 场景：保存草稿
- **当** 用户在新建或编辑申请上点击 Save Draft
- **则** 申请以 Draft 状态保存，出现在列表中，并提供 Edit 和 Delete 操作

#### 场景：提交申请
- **当** 用户完成所有提交必填字段（含声明、家长/监护人区块与附件）并点击 Submit
- **则** 申请状态变为 In Progress，审批阶段为 Pending Review

#### 场景：每名学生仅一条有效申请
- **当** 用户尝试为已有 Draft、In Progress 或 Update Required 退学申请的学生提交
- **则** 系统阻止提交并显示校验提示

### 需求：退学表单区块与原型一致
系统应渲染与 StudentSys 原型对齐的申请表单区块与字段。

#### 场景：Section I 学生信息
- **当** 用户在表单中查看 Section I
- **则** 系统展示 学生ID（必填，可搜索选择）、Date of Application（只读，当前日期）、Name、Intake、NRIC/Passport No.、Nationality、Programme 和 Programme Level

#### 场景：学生ID 自动填充
- **当** 用户从学生档案数据中选择 学生ID
- **则** 系统从关联学生档案自动填充 Section I 和 Section II 联系字段

#### 场景：Section II 学生申请
- **当** 用户在表单中查看 Section II
- **则** 系统展示 Personal Email、Phone Number、Last Date of Attendance、Destination after Leaving、Main Reason for Withdrawal（下拉）、Current Whereabout 和 Detailed Reason（多行文本）

#### 场景：主要原因下拉无层次后缀
- **当** 用户查看 Main Reason for Withdrawal 下拉框
- **则** 系统展示已本地化的原因选项，不含 (UG) 或 (PG) 后缀

#### 场景：声明勾选框
- **当** 用户查看声明区域
- **则** 系统展示一项必填勾选框，声明所提供信息正确且完整

#### 场景：Section III 家长或监护人同意
- **当** 用户在表单中查看 Section III
- **则** 系统展示 Parent/Guardian Name、Contact No.、NRIC/Passport No.、Relationship 和 Email，提交时为必填

#### 场景：Supporting Documents 区块
- **当** 用户在表单中查看 Supporting Documents
- **则** 系统展示必填附件上传（mock），格式提示 PDF/JPG/PNG/DOCX 最大 5MB，并提供 Download Consent Letter 操作

#### 场景：仅国际学生显示 ISAO 说明
- **当** 用户选择 category 为 International 的学生
- **则** 系统显示紫色 ISAO 说明提示：退学须 ISAO 批准

#### 场景：本地与中国学生隐藏 ISAO 说明
- **当** 用户选择 category 为 Local 或 China 的学生
- **则** 系统不显示 ISAO 说明提示

### 需求：退学表单校验
系统应按表单模式（draft 与 submit/resubmit）校验必填字段。

#### 场景：草稿校验
- **当** 用户点击 Save Draft
- **则** 系统仅要求 学生ID，允许在未填写声明、家长区块或附件时保存

#### 场景：提交校验
- **当** 用户未填写 学生ID、Section II 必填字段、声明勾选框、Section III 字段或附件即点击 Submit 或 Resubmit
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
- **则** 记录未从 Withdrawal History 中物理删除

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

#### 场景：国际学生详情中的 ISAO 说明
- **当** 用户查看关联 International 学生申请的 Details
- **则** 系统以只读模式显示 ISAO 说明

### 需求：退学审批工作流
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

### 需求：退学列表提供工作流日志操作
系统应在每条退学申请行上提供 Workflow Log 操作，与状态无关。

#### 场景：工作流日志打开独立弹框
- **当** 用户点击退学行的 Workflow Log
- **则** 系统打开 ApprovalLogModal，以表格形式展示审批日志条目
- **且** 弹框副标题显示 application ID、学生ID 和 学生name
- **且** 详情弹框内不包含行内审批日志区块

#### 场景：无提交记录的 Draft 工作流日志
- **当** 用户点击无日志条目的 Draft 申请的 Workflow Log
- **则** 弹框打开并显示无数据提示

### 需求：退学详情弹框不内嵌审批日志
系统不得在 WithdrawalDetailModal 内展示审批日志时间线。

#### 场景：详情弹框无日志区块
- **当** 用户打开任意退学申请的 Details
- **则** 详情弹框仅展示申请区块及进行中审批控件
- **且** 不展示行内审批日志列表

### 需求：退学状态演示 mock 数据
系统应提供覆盖 Draft、In Progress、Cancelled、Update Required、Rejected 和 Approved 的 mock 退学记录，每状态至少两条。

#### 场景：Draft 状态示例
- **当** 用户加载含 mock 数据的 Withdrawal History
- **则** 至少存在两条 Draft 记录，并提供 Edit 和 Delete 操作

#### 场景：In Progress 状态示例
- **当** 用户加载含 mock 数据的 Withdrawal History
- **则** 至少存在两条 In Progress 记录，其中一条为 Pending Review 且可 Cancel，另一条已超过 Pending Review 且不可 Cancel

#### 场景：Cancelled、Update Required、Rejected、Approved 示例
- **当** 用户加载含 mock 数据的 Withdrawal History
- **则** Cancelled、Update Required、Rejected 和 Approved 各状态至少存在两条记录

### 需求：退学页面支持双语 i18n
系统应通过 `withdrawal.*` i18n 命名空间，为 Withdrawal 页面全部 UI 文案（含六种状态徽章与工作流操作）提供完整中英文翻译。

#### 场景：英文语言区域
- **当** 用户将应用语言设为 English
- **则** Withdrawal 列表、表单、详情、状态徽章、主要原因选项、声明与 ISAO 说明均显示 `en.js` 中的英文文案

#### 场景：中文语言区域
- **当** 用户将应用语言设为 Chinese
- **则** Withdrawal 列表、表单、详情、状态徽章、主要原因选项、声明与 ISAO 说明均显示 `zh.js` 中的中文文案

### 需求：退学页面注册于学籍应用
系统应在 学生Records Application 中将 Withdrawal 注册为已开发页面。

#### 场景：侧边栏导航
- **当** 用户在侧边栏选择 Withdrawal
- **则** 系统展示 WithdrawalView，而非施工中页面

## 来源 `add-withdrawal-final-assessment-field` / 能力 `withdrawal-app`

## ADDED Requirements

### Requirement: 退学申请期末考核确认字段

退学申请表单 SECTION II 必须包含必填下拉「Will you complete Final Assessment?」，选项为 Yes 与 No。标签旁 必须常显提示，英文为：By selecting "Yes", you confirm that you will continue your studies this semester and complete the final assessment. Your official result slip will include this semester's results, and your withdrawal application will only be completed after the results are released.

#### Scenario: 必填校验
- **WHEN** 用户提交退学申请且未选择 Final Assessment
- **THEN** 系统阻止提交并提示该字段必填

#### Scenario: 选 Yes 自动填写出勤日
- **WHEN** 用户将 Final Assessment 选为 Yes
- **THEN** 系统将 Last Date of Attendance 填为本学期 Exam week 最后一天（原型 mock）
- **AND** 用户仍可修改该日期

#### Scenario: 选 No 不锁定日期
- **WHEN** 用户将 Final Assessment 选为 No
- **THEN** Last Date of Attendance 保持可编辑
- **AND** 两字段提示仍显示

### Requirement: 退学 SECTION II 字段顺序与出勤日提示

SECTION II 必须按以下顺序展示：Current Whereabout 与 Destination after Leaving 同行；Will you complete Final Assessment? 与 Last Date of Attendance 同行；Main Reason for Withdrawal；Detailed Reason。Last Date of Attendance 标签旁 必须常显提示：选 Yes 时该日期对应本学期 Exam week 最后一天。

#### Scenario: 布局顺序
- **WHEN** 用户打开退学申请表单 SECTION II
- **THEN** 字段按上述顺序排列

#### Scenario: 详情展示
- **WHEN** 用户查看退学申请详情
- **THEN** 系统展示 Final Assessment 选择结果与 Last Date of Attendance

## 来源 `refine-movement-application-default-tab-and-visa-expiry` / 能力 `movement-application-shell`

## 修改需求

### 需求：异动申请壳层托管四个嵌入视图
#### 场景：默认 Tab 为转专业
- **当** 用户首次进入管理端或学生端学籍异动申请页
- **则** 默认选中转专业 Tab（`programme-transfer`），而非休学

## 来源 `refine-movement-application-default-tab-and-visa-expiry` / 能力 `movement-application-student-info`

## 新增需求

### 需求：四异动 Section I 学生Visa Expiry Date
四异动新建/编辑申请表单 Section I（学生信息）应 展示只读 **学生Visa Expiry Date** 字段。

#### 场景：China 或 International 学生
- **当** 所选学生 studentCategory 为 China 或 International 且档案有签证有效期
- **则** 展示 IO 维护的日期范围（dd/mm/yyyy - dd/mm/yyyy 或单端日期）

#### 场景：Local 学生
- **当** 所选学生 studentCategory 为 Local
- **则** 仍展示 学生Visa Expiry Date 字段，值为 `—`

#### 场景：详情与审批一致
- **当** 用户在详情 Modal 或审批详情查看申请
- **则** Section I 以相同规则展示 学生Visa Expiry Date

## 来源 `refine-movement-declaration-content` / 能力 `movement-declaration`

## 新增需求

### 需求：各类型 Section V 声明条款

异动申请表单与详情视图应在 Section V 按类型显示编号的声明条款。

#### 场景：退学仅显示通用条款
- **当** 用户查看退学 Section V
- **则** 一条编号条款声明申请信息正确且完整

#### 场景：休学与复学显示两条条款
- **当** 用户查看休学或复学 Section V
- **则** 第一条为通用正确性声明
- **且** 第二条为最长修业年限确认

#### 场景：转专业显示三条条款
- **当** 用户查看转专业 Section V
- **则** 条款依次包含通用声明、规则承诺及签证注销确认

## 来源 `refine-movement-parent-contacts-readonly` / 能力 `movement-parent-contacts`

## MODIFIED Requirements

### Requirement: 异动家长/监护人联系人自档案带出且只读

休学与退学申请表单的 Section III 必须在选择学生后（或学生端打开表单时）使用 `student.family[]` 中非空联系人填充 `parentContacts[]`。区块内字段 必须只读，必须NOT 提供新增或删除联系人操作，必须NOT 允许在申请内修改字段。教师代填与学生自填在档案无监护人时 必须同样禁止提交。SECTION III 标题旁 必须常显提示，说明数据来自学生个人信息页、申请内不可改、有误须至档案修改。

#### Scenario: 选学生带出只读联系人
- **WHEN** 用户为休学或退学申请选择学生且该生 `family[]` 含联系人
- **THEN** Section III 按条展示对应监护人信息
- **AND** 字段不可编辑
- **AND** 不显示删除与添加控件

#### Scenario: 无监护人禁止提交
- **WHEN** 学生档案无有效监护人且用户尝试提交（含教师代填）
- **THEN** 系统阻止提交并提示至少需要一名家长/监护人

#### Scenario: SECTION III 标题 tip
- **WHEN** 用户查看休学或退学申请 Section III 标题
- **THEN** 标题旁显示提示图标
- **AND** 提示说明数据来自学生个人信息页且申请内不可修改

## REMOVED Requirements

### Requirement: Section III 可增删可编辑监护人
**Reason**：产品要求监护人仅从学生档案只读带出。  
**Migration**：移除添加/删除入口与字段编辑；空态引导改为维护学生档案。

## 来源 `refine-movement-student-info-fields` / 能力 `movement-application-student-info`

## 新增需求

### 需求：Section I 当前学年学期

四类异动申请表单及详情视图 应 在 Section I 第二行展示只读的当前学年学期与申请学年学期：左侧为当前学年学期，右侧为申请学年学期。当前学年学期采用 YYYY/MM 格式，在学生绑定后从所选学生的入学学年学期填充。

#### 场景：绑定学生后填充当前学年学期
- **当** 用户在异动申请表单上选择学生
- **则** 当前学年学期以 YYYY/MM 格式显示该学生的入学学年学期

#### 场景：详情展示已持久化的当前学年学期
- **当** 用户查看异动申请详情
- **则** 当前学年学期与已存储的快照值一致

#### 场景：Section I 第二行学年学期字段
- **当** 用户在表单或详情中查看 Section I 学生信息
- **则** 第二行左侧显示当前学年学期，右侧显示申请学年学期

#### 场景：转专业在第三行展示申请日期
- **当** 用户在转专业 Section I 的创建表单或详情视图中查看
- **则** 第三行左侧显示只读的申请日期，格式与其他异动类型一致

#### 场景：四类异动的 Section I 联系字段
- **当** 用户在四类异动申请表单或详情视图中查看 Section I
- **则** Section I 中显示个人邮箱与电话号码
- **且** 二者为选填项，若有学生档案数据则预填

#### 场景：休学与退学 Section I 住宿房间号
- **当** 用户查看休学或退学 Section I
- **则** Section I 中显示住宿房间号，为选填字段，若有学生住宿数据则预填

## 来源 `refine-movement-student-info-fields` / 能力 `programme-transfer-app`

## 修改需求

### 需求：转专业 Section I 申请日期

转专业申请表单及详情视图 应 在 Section I 第三行左侧展示只读的申请日期字段，与休学、退学、复学保持一致。

#### 场景：创建表单显示申请日期
- **当** 用户打开新的转专业申请
- **则** 第三行左侧显示申请日期（只读），取当天日期

#### 场景：详情显示已存储的申请日期
- **当** 用户查看转专业详情
- **则** 第三行左侧使用已存储的 `dateOfApplication` 值显示申请日期

#### 场景：转专业原因使用自由文本多行输入
- **当** 用户填写转专业 Section II
- **则** 转专业原因为必填多行文本框，绑定 `transferReason`
- **且** 编辑与详情视图中保留既有已存储的 `transferReason` 文本

## 来源 `refine-movement-student-info-fields` / 能力 `withdrawal-app`

## 修改需求

### 需求：退学当前所在地下拉选择

退学申请表单 应 将当前所在地作为必填下拉字段采集，选项为校内（In Campus）与校外（Out of Campus）。

#### 场景：用户从下拉框选择所在地
- **当** 用户创建或编辑退学申请
- **则** 当前所在地为下拉选择，占位符为 Select Current Whereabout，选项为 In Campus 与 Out of Campus

## 来源 `reorder-movement-declaration-and-applicant-notes` / 能力 `movement-application`

## 修改需求

### 需求：异动申请表单 Section 顺序与声明后移
系统应在转专业、休学、复学、退学四类申请表单中，将「学生声明」区块置于「支持性文件」之后，并按约定重编号 Section 标题。

#### 场景：转专业表单顺序
- 当用户打开转专业申请表单时，则 Section 顺序为 I 学生信息 → II 转专业信息 → III 支持性文件 → IV 学生声明 → VII 教务办；顶部展示申请人说明（结构同转专业 demo notes）。

#### 场景：休学/退学表单顺序
- 当用户打开休学或退学申请表单时，则 Section 顺序为 I 学生信息 → II 学生申请 → III 家长/监护人确认 → IV 支持性文件 → V 学生声明。

#### 场景：复学表单顺序
- 当用户打开复学申请表单时，则 Section 顺序为 I 学生信息 → II 复学详情 → III 支持性文件 → IV 学生声明；`noteAlert` 出现在表单末尾（声明之后）。

### 需求：申请人说明（Applicant Notes）
系统应在表单顶部（Section I 之前）展示申请人说明；退学使用黄色 Instructional Note（6 条），休学/复学使用与转专业相同结构的 demo 说明（各 3 条）；中英文 i18n 分离。

#### 场景：退学 Instructional Note
- 当用户打开退学申请表单或详情时，则顶部展示标题为「申请人须知：」/ `Instructional Note for applicants:` 的 6 条有序说明，样式为黄色 instructional 框。

#### 场景：休学/复学 demo 说明
- 当用户打开休学或复学申请表单或详情时，则顶部展示 3 条 demo 要点说明，结构与转专业 notes 一致（标题 + 有序列表）。

### 需求：详情视图与表单顺序一致
系统应在 `MovementDetailContent` 及各 `*DetailModal` 中，按与表单相同的 Section 顺序渲染字段、附件与声明；顶部只读展示申请人说明。

#### 场景：退学 ISAO 提示位置
- 当退学申请为国际生且需展示 ISAO 提示时，则 ISAO 提示出现在声明区块之后（表单/详情末尾），而非附件之前。

## 来源 `restructure-movement-application-sections` / 能力 `movement-application-sections`

## 新增需求

### 需求：Section II 学生申请布局

四类异动申请表单应使用区块标题 `SECTION II : 学生APPLICATION`（或等效 i18n），并按设计文档为各异动类型配置字段网格。

#### 场景：休学 Section II 两行布局
- **当** 用户查看休学 Section II
- **则** 第一行并排显示 Deferment Period 与 Main Reason
- **且** 第二行 Detailed Reason 横跨两列

#### 场景：退学 Section II 三行布局
- **当** 用户查看退学 Section II
- **则** 第一行显示 Current Whereabout 与 Destination after Leaving
- **且** 第二行显示 Last Date of Attendance 与 Main Reason for Withdrawal
- **且** 第三行 Detailed Reason 横跨两列

#### 场景：复学 Section II 单行布局
- **当** 用户查看复学 Section II
- **则** Deferment Period 与 Resumption of Study 显示在同一行

#### 场景：转专业 Section II 不含当前专业区块
- **当** 用户查看转专业 Section II
- **则** 字段仅为 Start Semester、New Programme 选项及 `transferReason` 文本域
- **且** Current Programme、Intake、School 以只读形式显示在 Section I

### 需求：Section III 家长/监护人布局

休学与退学表单应展示 Section III，家长字段采用 Name|Relationship、NRIC|Contact、Email 布局，选中学生时从主要家庭联系人预填。

#### 场景：家长字段预填
- **当** 用户选择带有家庭联系人数据的学生
- **则** Section III 家长字段预填且仍可编辑

#### 场景：复学与转专业省略 Section III
- **当** 用户查看复学或转专业表单
- **则** 不显示 Section III 家长区块

### 需求：复学支持性文件不含同意书下载

复学 Section IV 不应提供 Download Letter of Consent。

#### 场景：复学文档面板
- **当** 用户查看复学 Section IV
- **则** 不显示同意书下载操作

## 来源 `sort-deferment-period-options-desc` / 能力 `deferment-app`

## 修改需求

### 需求：休学期间下拉倒序

休学申请表单「休学期间（学年学期）」选项按学年学期从新到旧排列。

#### 场景：新学期在前

- **当** 用户打开休学期间下拉
- **则** 有效选项中较新的学年学期出现在较旧选项之前（占位「请选择」仍在最前）

## 来源 `split-movement-application-teacher-student` / 能力 `movement-application-applicant-mode`

## 新增需求

### 需求：申请方模式控制列表范围
系统应按申请方模式筛选异动申请列表，使学生自助门户仅展示当前学生的申请。

#### 场景：管理端列表展示全部申请
- **当** 用户在 `applicantMode` 为 `teacher` 下查看任一异动 Tab
- **则** 列表含所有学生的申请，受现有搜索与分页筛选约束

#### 场景：学生端列表仅展示本人申请
- **当** 用户在 `applicantMode` 为 `student` 下查看任一异动 Tab
- **则** 列表仅含学号与当前 mock 登录学生匹配的申请

#### 场景：学生端在本人记录内搜索
- **当** 学生端用户在任一 Tab 应用高级列表筛选（专业代码、申请学期、审批状态、是否实施）
- **则** 搜索仅在当前学生的申请范围内操作，且不暴露学号或姓名搜索字段

### 需求：学生端新建时自动填充 Section I
系统应在学生端模式下创建任一异动申请时，从当前登录学生自动填充 Section I 学生身份字段。

#### 场景：新建打开时携带当前学生快照
- **当** 学生端用户在学生端模式下于任一异动 Tab 点击新建
- **则** Section I 展示当前学生的学号、姓名及相关只读档案字段，无需学生选择器

#### 场景：学生端 Section I 只读
- **当** 学生端用户在学生端模式下查看新建或草稿编辑的 Section I
- **则** 学生身份字段为只读，不可更改为其他学生

#### 场景：四种异动类型行为一致
- **当** 学生端用户在学生端模式下创建休学、复学、退学或转专业
- **则** 应用相同的 Section I 自动填充与只读行为

### 需求：管理端新建时使用学生选择器
系统应要求管理端在管理端模式下创建任一异动申请时，通过 `StudentSelectModal` 选择学生。

#### 场景：新建需选择学生
- **当** 管理端用户在管理端模式下于任一异动 Tab 打开新建且未选学生
- **则** Section I 展示空的学生信息及打开 `StudentSelectModal` 的选择操作

#### 场景：草稿编辑锁定学生身份
- **当** 管理端用户在管理端模式下编辑 `Draft` 或 `Update Required` 申请
- **则** 绑定的学号与姓名为只读，且不可通过选择操作更换学生

### 需求：草稿编辑与新建可编辑字段一致
系统应允许在两种申请方模式下，对每种异动类型编辑与新建时相同的业务字段，同时按模式规则保持 Section I 身份只读。

#### 场景：学生端草稿编辑业务区
- **当** 学生端用户在学生端模式下编辑 `Draft` 申请
- **则** Section II–IV 与附件字段遵循该异动类型与新建相同的可编辑规则，且 Section I 保持只读

#### 场景：管理端草稿编辑业务区
- **当** 管理端用户在管理端模式下编辑 `Draft` 申请
- **则** Section II–IV 与附件字段遵循该异动类型与新建相同的可编辑规则，且 Section I 学生身份保持锁定

### 需求：学生端 Mock 当前学生
系统应从单一 mock 模块解析当前登录学生，用于列表筛选与表单自动填充，直至接入真实认证。

#### 场景：当前学生单一数据源
- **当** 学生端列表或表单需要登录学生
- **则** 系统从基于 `initialStudents` 的共享 mock 当前学生辅助函数读取

#### 场景：后续 SSO 可替换
- **当** 后续接入认证
- **则** 仅需替换 mock 当前学生模块，无需变更列表筛选或表单自动填充调用点

### 需求：Section I 分字段展示学号与姓名
系统应在四种异动表单弹框中，于同一表单行以两个相邻只读字段分别展示学号与全名。

#### 场景：学号字段仅显示学号
- **当** 管理端或学生端用户在绑定学生后（通过选择器或自动填充）查看 Section I
- **则** 学号字段仅显示学号，不拼接姓名

#### 场景：姓名字段单独显示全名
- **当** 管理端用户选择学生或学生端自动填充新建
- **则** 相邻姓名字段显示档案快照中的学生全名

#### 场景：同行布局且选择按钮在行末
- **当** 管理端用户在管理端模式下打开任一异动表单弹框的新建
- **则** 第一行以两等分列展示学号与姓名，选择操作位于**该行末尾**，不在学号与姓名之间

#### 场景：学生端无选择按钮
- **当** 学生端用户打开任一异动表单弹框的新建
- **则** 第一行仅展示学号与姓名，无选择操作

#### 场景：四种异动类型布局一致
- **当** 用户打开转专业、休学、复学或退学表单弹框
- **则** 在管理端与学生端两种申请方模式下，均应用相同的分字段、同行布局，且管理端新建时选择按钮位于行末

### 需求：只读快照字段与可编辑字段视觉区分
系统应对来自学生记录的档案与快照只读字段应用一致的只读（灰底）视觉处理，与可编辑业务字段区分。

#### 场景：Section I 与快照字段灰底
- **当** 用户查看 Section I 只读字段及转专业 Current Programme、Current Intake、Current School 等只读快照字段
- **则** 这些字段使用共享只读样式（ muted 背景与文字），与后续章节可编辑输入视觉区分

#### 场景：可编辑字段保持白底
- **当** 用户查看 Section II–IV 可编辑字段（下拉、文本输入、文本域、复选框、文件上传）
- **则** 这些字段保持标准可编辑控件样式，不使用只读灰底处理

### 需求：转专业列表移除模拟过期 Mock 操作
系统不得在转专业申请列表上暴露手动「Simulate Expire」操作。

#### 场景：无模拟过期按钮
- **当** 管理端或学生端用户查看 `Draft` 或 `Update Required` 转专业列表操作
- **则** 不展示 Simulate Expire 操作

#### 场景：移除 expireApplication 辅助函数
- **当** 代码库为本变更更新
- **则** 从转专业数据模块移除 `expireApplication` mock 辅助函数，且视图不再导入

### 需求：Section I 展示申请学年学期
系统应在四种异动表单弹框与详情弹框的 Section I 末尾展示只读**申请学年学期**（`applicationSession`）字段，格式 `YYYY/MM`，与审批、维护、查询列表列一致。

#### 场景：新建时自动填充
- **当** 用户在任一异动表单弹框（管理端或学生端模式）打开新建
- **则** Section I 在末尾展示从系统当前学期推导的当前申请学年学期（如 `2025/09`），为只读灰底字段

#### 场景：草稿编辑时冻结
- **当** 用户编辑现有 `Draft` 或 `Update Required` 申请
- **则** 申请学年学期保留记录存储值，不根据当前学期重新计算

#### 场景：保存与提交时持久化
- **当** 用户保存草稿或提交申请
- **则** `applicationSession` 值持久化于异动存储记录

#### 场景：详情弹框与表单格式一致
- **当** 用户通过任一异动 `DetailModal`（含审批审核只读视图）查看申请详情
- **则** Section I 以与表单弹框相同的 `YYYY/MM` 格式展示申请学年学期

#### 场景：四种异动类型一致
- **当** 用户创建或查看转专业、休学、复学、退学
- **则** 申请学年学期字段在 Section I 末尾以相同标签与格式出现

## 修改需求

### 需求：Section I 展示申请学年学期
系统应在四种异动表单弹框与详情弹框的 Section I 末尾展示只读**申请学年学期**（`applicationSession`）字段，格式 `YYYY/MM`，与审批、维护、查询列表列一致。值应从所选学生的 enrollment intake 推导，且在绑定学生前不得预填。

#### 场景：管理端新建选学生前为空
- **当** 管理端用户在管理端模式下于选择学生前打开任一异动表单弹框的新建
- **则** Section I 末尾的申请学年学期字段为空或显示 em dash 占位符
- **且** 该字段不显示系统当前学期

#### 场景：选择学生后从 intake 填充
- **当** 管理端用户在新建时通过 `StudentSelectModal` 选择学生
- **则** 申请学年学期字段以该学生 enrollment intake 的 `YYYY/MM` 格式（如 `2023/09`）展示，为只读灰底字段

#### 场景：学生端自动填充含 intake 学期
- **当** 学生端用户在学生端模式下打开任一异动表单弹框的新建
- **则** Section I 在末尾以申请学年学期展示当前学生的 enrollment intake

#### 场景：草稿编辑时冻结
- **当** 用户编辑现有 `Draft` 或 `Update Required` 申请
- **则** 申请学年学期保留记录存储值，不根据学生档案或当前学期重新计算

#### 场景：保存与提交时持久化
- **当** 用户保存草稿或提交申请
- **则** `applicationSession` 值持久化于异动存储记录

#### 场景：详情弹框与表单格式一致
- **当** 用户通过任一异动 `DetailModal`（含审批审核只读视图）查看申请详情
- **则** Section I 以与表单弹框相同的 `YYYY/MM` 格式展示申请学年学期

#### 场景：四种异动类型一致
- **当** 用户创建或查看转专业、休学、复学、退学
- **则** 申请学年学期字段在 Section I 末尾以相同标签与基于 intake 的规则出现

## 移除需求

#### 场景：新建时从系统当前学期自动填充
- **已移除** — 由「管理端新建选学生前为空」与「选择学生后从 intake 填充」取代

## 来源 `split-movement-application-teacher-student` / 能力 `movement-application-list-filters`

## 新增需求

### 需求：异动申请列表高级搜索
系统应在管理端与学生端门户的全部四个异动申请 Tab 上提供高级列表搜索。

#### 场景：管理端首行搜索字段
- **当** 管理端用户在管理端模式下查看任一异动申请 Tab
- **则** 搜索栏第一行含学号或姓名、专业代码、申请学期、审批状态筛选及查询、重置操作

#### 场景：学生端首行搜索字段
- **当** 学生端用户在学生端模式下查看任一异动申请 Tab
- **则** 搜索栏第一行含专业代码、申请学期、审批状态筛选，但不展示学号或姓名筛选

#### 场景：是否实施筛选位于可收起第二行
- **当** 用户查看异动申请列表搜索栏
- **则** 可收起的第二行提供是否实施筛选，默认展开，收起/展开控件与学籍异动查询布局一致

#### 场景：专业代码仅匹配当前专业
- **当** 用户在任一异动 Tab 按专业代码筛选
- **则** 系统匹配该申请的解析后当前专业代码，而非转专业的新专业代码

#### 场景：审批状态含 Draft
- **当** 用户在申请列表 Tab 选择审批状态筛选
- **则** 可选状态含 `Draft` 及该异动类型的其他工作流状态

#### 场景：共享筛选逻辑
- **当** 任一异动申请视图应用列表搜索
- **则** 使用共享异动申请搜索辅助函数，复用与查询、维护模块一致的申请学期与专业代码提取逻辑

### 需求：异动申请搜索操作按钮样式（§23）
系统应在异动申请列表搜索栏使用与异动类别列表页相同的实心主色与描边默认按钮样式渲染查询与重置控件。

#### 场景：查询与重置与异动类别按钮一致
- **当** 管理端或学生端用户查看任一异动申请 Tab 的搜索栏
- **则** 查询操作为蓝色主色按钮、白字标签
- **且** 重置操作为白底灰边按钮
- **且** 收起/更多控件仍为文本样式，不变

#### 场景：样式在共享搜索组件中应用
- **当** 为管理端或学生端 `applicantMode` 渲染 `MovementApplicationSearchBar`
- **则** 查询与重置按钮样式通过共享列表页搜索样式应用，不在各视图重复 scoped CSS

### 需求：转专业列表无进行中/已归档 Tab
系统应在管理端与学生端门户以单一统一列表展示转专业申请，不区分进行中与已归档 Tab。

#### 场景：无进行中/已归档 Tab 控件
- **当** 用户在任一门户查看转专业
- **则** 不展示进行中与已归档 Tab 按钮

#### 场景：统一列表含终态
- **当** 用户在不应用状态筛选的情况下查看转专业
- **则** 列表含所有状态的申请，包括 `Rejected`、`Cancelled`、`Expired` 等终态及进行中记录

#### 场景：终态记录可通过状态筛选发现
- **当** 管理端或学生端用户按终态审批状态筛选转专业
- **则** 匹配的终态申请出现在统一列表中

### 需求：学生端隐藏冗余身份列
系统应在学生端模式下，于四种异动类型的申请历史表格中隐藏学号与姓名列。

#### 场景：学生端表格列
- **当** 学生端用户查看休学、复学、退学或转专业的申请历史
- **则** 表格不渲染学号或姓名列

#### 场景：管理端表格列不变
- **当** 管理端用户查看相同异动申请历史表格
- **则** 学号与姓名列仍可见

#### 场景：空状态 colspan
- **当** 学生端用户看到空的申请历史表格
- **则** 空行 colspan 反映去除学号与姓名后的列数

## 修改需求

### 需求：申请方模式控制列表范围
系统应按申请方模式筛选异动申请列表，使学生自助门户仅展示当前学生的申请，再在该范围内应用高级搜索筛选。

#### 场景：管理端列表展示全部申请
- **当** 用户在 `applicantMode` 为 `teacher` 下查看任一异动 Tab
- **则** 列表含所有学生的申请，受高级搜索与分页筛选约束

#### 场景：学生端列表仅展示本人申请
- **当** 用户在 `applicantMode` 为 `student` 下查看任一异动 Tab
- **则** 列表在应用高级搜索前，仅含学号与当前 mock 登录学生匹配的申请

#### 场景：学生端在本人记录内高级搜索
- **当** 学生端用户应用专业代码、申请学期、审批状态或是否实施筛选
- **则** 搜索仅在当前学生的申请范围内操作

## 来源 `split-movement-application-teacher-student` / 能力 `movement-application-shell`

## 新增需求

### 需求：双异动申请侧边栏入口
系统应在学籍异动下暴露两个并列侧边栏入口，分别对应管理端代办与学生自助异动申请。

#### 场景：管理端菜单标签
- **当** 用户查看学籍异动下的学生档案侧边栏
- **则** 叶子菜单项在中文界面显示标签 **学籍异动申请（管理端）**（英文：**Status Change Application (Management)**）

#### 场景：学生端菜单标签
- **当** 用户查看学籍异动下的学生档案侧边栏
- **则** 并列叶子菜单项显示学生自助学籍异动申请标签

#### 场景：Distinct 页面标识
- **当** 用户导航至任一异动申请入口
- **则** 系统分别使用 `sr-movement-application-teacher` 与 `sr-movement-application-student` 作为页面标识

### 需求：壳层向嵌入视图传递申请方模式
系统应将 `applicantMode` 为 `teacher` 或 `student` 从异动申请壳层传递给四个嵌入异动视图。

#### 场景：管理端壳层模式
- **当** 用户打开管理端异动申请菜单入口
- **则** 壳层以 `applicantMode` 为 `teacher` 渲染，并传递给 `ProgrammeTransferView`、`DefermentView`、`ResumptionView`、`WithdrawalView`

#### 场景：学生端壳层模式
- **当** 用户打开学生端异动申请菜单入口
- **则** 壳层以 `applicantMode` 为 `student` 渲染，并传递给全部四个嵌入视图

#### 场景：Tab 行为不变
- **当** 用户在任一门户内切换 Tab
- **则** Tab 键、默认 Tab 与嵌入视图复用行为与单一门户壳层相同

## 修改需求

### 需求：异动申请壳层托管四个嵌入视图
系统应在单一父壳层组件内嵌入现有 `ProgrammeTransferView`、`DefermentView`、`ResumptionView`、`WithdrawalView`，不重复业务逻辑，适用于管理端与学生端两个门户入口。

#### 场景：每个门户入口单一壳层组件
- **当** 应用渲染管理端或学生端学籍异动申请
- **则** 同一壳层组件管理 Tab 状态，且每次仅渲染一个嵌入异动视图

#### 场景：无重复数据模块
- **当** 壳层在任一门户嵌入异动视图
- **则** 各 Tab 复用现有数据层文件，不 fork 新 mock 存储

## 来源 `split-movement-application-teacher-student` / 能力 `student-records-app`

## 修改需求

### 需求：学生档案侧边栏异动申请入口
系统应注册两个已开发的侧边栏异动申请入口，取代原先未区分的单一入口。

#### 场景：管理端入口已开发
- **当** 用户点击管理端学籍异动申请菜单项
- **则** 系统导航至 `sr-movement-application-teacher`，并以管理端模式渲染异动申请壳层

#### 场景：学生端入口已开发
- **当** 用户点击学生端学籍异动申请菜单项
- **则** 系统导航至 `sr-movement-application-student`，并以学生端模式渲染异动申请壳层

#### 场景：管理端入口面包屑
- **当** 用户位于管理端异动申请页面
- **则** 面包屑展示学籍异动分组，后跟管理端菜单标签（中文界面：学籍异动申请（管理端））

#### 场景：学生端入口面包屑
- **当** 用户位于学生端异动申请页面
- **则** 面包屑展示学籍异动分组，后跟学生端菜单标签

## 移除需求

### 需求：单一异动申请侧边栏页面 ID
**原因**：拆分为管理端与学生端门户，使用 distinct 页面标识与标签。
**迁移说明**：在菜单配置、`App.vue` 路由与已开发页面中，将 `sr-movement-application` 替换为 `sr-movement-application-teacher`，并新增 `sr-movement-application-student`。

#### 场景：侧边栏不再使用旧页面 ID
- **当** 用户查看学生档案侧边栏
- **则** 不存在未标注管理端/学生端、仅标为「学籍异动申请」的未区分单一菜单项

## 来源 `split-movement-application-teacher-student` / 能力 `student-select-modal`

## 新增需求

### 需求：管理端表单用学生选择弹框
系统应为管理端异动申请表单提供可复用的学生选择弹框，支持对学生档案 mock 数据集搜索与分页。

#### 场景：从表单打开弹框
- **当** 管理端用户在任何异动新建表单的 Section I 学号处点击选择
- **则** 弹框打开，列表展示学号、姓名、国籍、专业、专业层次、学院列

#### 场景：专业与学院列来自学籍
- **当** 学生选择弹框展示某学生行
- **则** 专业列显示 `enrollment.programme`，学院列显示 `enrollment.faculty`，为空时显示 `—`

#### 场景：国籍列随界面语言展示
- **当** 学生选择弹框展示某学生行且该生有 `basicInfo.nationality`
- **则** 英文界面显示英文国名，中文界面显示对应国家中文名（经 flat 文案映射）；国籍为空时显示 `—`

#### 场景：专业层次列统一为本科
- **当** 学生选择弹框展示任意学生行（转专业 / 休学 / 复学 / 退学任一申请打开的同一弹框）
- **则** 专业层次列统一显示「本科」（英文界面为 Undergraduate），不按该生学籍真实层次分化

#### 场景：表格字段可横向滑动看全
- **当** 学生选择弹框中专业或学院等列文字较长、超出可视宽度
- **则** 表格区域提供横向滚动条，单元格不使用省略号截断，用户可左右滑动查看完整字段值

#### 场景：按学号或姓名搜索
- **当** 管理端用户在弹框搜索框输入关键词
- **则** 列表筛选学号、英文名或中文名包含该关键词的学生（不区分大小写）

#### 场景：分页结果
- **当** 筛选后学生列表超过页大小
- **则** 弹框展示分页控件，每次仅显示一页

#### 场景：确认选择
- **当** 管理端用户选中一行并确认
- **则** 弹框关闭，表单 Section I 字段从所选学生档案快照填充

#### 场景：取消且不变更
- **当** 管理端用户关闭或取消弹框且未确认
- **则** 表单保留先前的学生选择状态

#### 场景：未选择时确认禁用
- **当** 弹框中未选中任何学生行
- **则** 确认操作禁用

## 移除需求

### 需求：异动表单内联学生筛选下拉
**原因**：学生数量较大时，由 `StudentSelectModal` 取代以提升可扩展性。
**迁移说明**：从四种异动表单弹框的 Section I 移除配对关键词输入框与原生 `<select>`；改为只读展示加选择按钮打开 `StudentSelectModal`。

#### 场景：学生选择不使用原生 select
- **当** 管理端用户创建异动申请
- **则** Section I 不渲染内联列出全部学生的原生 HTML select

## 来源 `unify-movement-date-format` / 能力 `movement-date-format`

## 新增需求

### 需求：异动全链路日期展示为 dd.Mmm.YYYY
系统应在学籍异动全链路中，将日历日期字段统一以 dd.Mmm.YYYY 格式展示（日补零、英文三字母月份缩写、四位年份，如 `29.Sep.2025`），覆盖列表列、只读表单与详情字段、审批视图、维护与查询表格、导出文件及审批日志条目。

#### 场景：申请列表申请日期
- 当用户查看四 Tab 异动申请列表的申请日期列时，则每条日期以 dd.Mmm.YYYY 展示。

#### 场景：表单与详情只读日期
- 当用户在异动表单或详情弹框中查看申请日期、签证到期、lastDateOfAttendance 等只读日期字段时，则值以 dd.Mmm.YYYY 展示。

#### 场景：审批列表申请日期
- 当用户查看异动审批列表的 Application Date 列时，则以与对应异动申请列表相同的格式化规则展示 dd.Mmm.YYYY。

#### 场景：维护与查询异动日期
- 当用户查看维护或查询列表的 movementDate 列时，则日期以 dd.Mmm.YYYY 展示。

#### 场景：审批日志日期列
- 当用户为任意异动记录打开 Approval log 时，则每条日志 dateTime 以 dd.Mmm.YYYY 展示且无时间部分，包括以 DD.MM.YYYY HH:mm 存储的旧 seed 值。

#### 场景：导出日期列
- 当用户导出含日期字段的异动申请、审批、维护或查询结果至 xlsx 时，则导出单元格值与屏幕展示一致，使用 dd.Mmm.YYYY。

#### 场景：申请学年学期不在范围内
- 当用户查看 Application Academic Session（`applicationSession`）字段或列时，则这些值仍使用 YYYY/MM 学年学期格式，且不以 dd.Mmm.YYYY 格式化。

### 需求：共享异动日期格式化器
系统应在共享 helper 中集中异动日期展示格式化，供异动申请 data 模块、审批队列 formatter、维护日期展示、导出 formatter 及审批日志 UI 使用。

#### 场景：单一 formatter 入口
- 当任意异动模块需要向用户展示日历日期时，则模块使用共享 `formatMovementDate` helper，而非各自 ad hoc formatter。

#### 场景：ISO 存储兼容
- 当异动记录以 ISO 日期字符串或 ISO datetime 存储日期时，则 `formatMovementDate` 产出 dd.Mmm.YYYY 用于展示，且存储值保持 ISO 兼容。

#### 场景：引擎日志存储使用 ISO
- 当审批引擎追加新审批日志条目时，则存储的 dateTime 值通过 `formatMovementDateIso` 使用 YYYY-MM-DD，供周期比较。

### 需求：生效学期列展示为 YYYY/MM
系统应在审批、维护、查询列表及导出中，将 Effective Session（`effectiveSession`）列以学年学期格式 YYYY/MM（如 `2025/09`）展示，且列内各异动类型格式一致。

#### 场景：转专业与休学生期值
- 当用户查看源字段使用 YYYY/MM（如 `startSemester`、`defermentPeriod`）的转专业或休学记录的 Effective Session 列时，则值以 YYYY/MM 原样展示。

#### 场景：退学从就读最后日期派生学期
- 当用户查看 effective 值由 `lastDateOfAttendance`（存储为 YYYY-MM-DD，如 `2025-09-20`）派生的退学记录 Effective Session 列时，则列展示 `2025/09` 而非 dd.Mmm.YYYY。

#### 场景：导出生效学期列
- 当用户导出含 Effective Session 列的审批、维护或查询结果时，则导出单元格值与屏幕列表格式化一致，使用 YYYY/MM。

#### 场景：异动日期列使用 dd.Mmm.YYYY
- 当用户查看同一退学记录的 Movement Date 列时，则该列以 dd.Mmm.YYYY 展示日历日，且不转换为 YYYY/MM。

### 需求：学年学期字段仅使用 YYYY/02、YYYY/04 或 YYYY/09
系统应将 Intake、Application Academic Session 与 Effective Session 视为学年学期值（非日历日期），展示与导出统一 normalize 为 YYYY/MM，其中 MM 为 02、04 或 09 之一。

#### 场景：列表列展示合法学期码
- 当用户查看审批、维护或查询列表的 Intake、Application Academic Session 或 Effective Session 时，则每个值为 YYYY/02、YYYY/04 或 YYYY/09，或空时显示 `—`。

#### 场景：申请学年学期不回退日历日
- 当异动记录无 applicationSession 但有 dateOfApplication 时，则 Application Academic Session 列不展示日历日期。

#### 场景：从就读最后日期派生的生效学期映射到学期码
- 当 Effective Session 由存储为 YYYY-MM-DD 的 lastDateOfAttendance 派生时，则展示值映射为 YYYY/02、YYYY/04 或 YYYY/09，而非 YYYY/08 等日历月。

#### 场景：学期时间顺序
- 当异动记录上 intake、applicationSession 与 effectiveSession 均存在时，则 intake 不晚于 applicationSession，且 applicationSession 不晚于 effectiveSession。

#### 场景：表单提交校验学期顺序
- 当教职工或学生提交学期字段违反时间顺序的异动申请时，则提交校验失败并显示字段级错误。

## 来源 `unify-movement-date-format` / 能力 `programme-transfer-app`

## 修改需求

### 需求：转专业表单区块对齐原型
系统应渲染与 StudentSys 原型对齐的申请表单，包括在新建与编辑表单上将 Section VII 作为可见但申请侧不可编辑的教务区块。

#### 场景：Section I 学生详情
- 当用户在表单中查看 Section I 时，则系统展示 学生ID（必填、可搜索下拉）、Full Name、NRIC/Passport No.、Nationality、Email、Contact No. 与 学生Visa Expiry Date。

#### 场景：学生ID 自动填充
- 当用户从学生档案数据中选择 学生ID 时，则系统自动填充 Section I 字段及 Section II 的 current programme、intake 与 school。

#### 场景：Section II 转专业信息
- 当用户在表单中查看 Section II 时，则系统展示 Current Programme、Current Intake、Current School、New Programme (1st Choice, required)、New Programme (2nd Choice, optional)、Start Semester of New Programme (required) 与 Reasons to Transfer（必填 textarea）。

#### 场景：Section III 声明
- 当用户查看 Section III 时，则系统展示带完整法律文本的必填声明 checkbox 及必填同意 checkbox。

#### 场景：Section IV 支持文档
- 当用户查看 Section IV 时，则系统展示必填附件上传（mock：文件名与大小）、支持格式提示 PDF/JPG/PNG/DOCX、最大 5MB，以及 Download Consent Letter 操作。

#### 场景：新建表单 Section VII 可见但 disabled
- 当用户通过「+ New Application」打开新建申请表单时，则系统在 Section IV 之后展示 Section VII，灰色区块标题为「FOR ACADEMIC AFFAIRS OFFICE USE ONLY」，New Programme、New Intake 与 Date 字段可见且布局对齐原型，且 Section VII 全部输入 disabled、只读置灰样式，申请人不可编辑。

#### 场景：表单 Section VII 布局
- 当用户在新建或编辑表单中查看 Section VII 时，则 New Programme 与 New Intake 在第一行，Date 在 New Programme 下方第二行。

#### 场景：申请表单提交不校验 Section VII
- 当用户从转专业申请表单提交或保存草稿时，则系统不要求填写 Section VII 字段，且申请侧提交不持久化用户对 Section VII 教务字段的编辑。

## 来源 `unify-movement-declaration-section` / 能力 `movement-application-declaration`

## 新增需求

### 需求：异动申请统一声明区块
系统应在转专业、休学、退学、复学的新增/编辑申请弹框中包含 Declaration 声明区，样式与转专业一致。

#### 场景：声明区结构
- 当用户打开任一类异动申请弹框时，则显示带 section 标题的声明区、条款列表及必填勾选框

#### 场景：不含家长同意书下载
- 当用户查看申请弹框时，则系统不显示「下载家长同意书」按钮；家长/监护人信息字段可保留

#### 场景：休学声明必填
- 当用户提交休学申请且未勾选声明时，则系统阻止提交并显示校验错误

#### 场景：详情展示声明
- 当用户查看异动申请详情时，则系统只读展示声明勾选结果

## 来源 `update-movement-application-details` / 能力 `movement-application-details`

## 新增需求

### 需求：异动申请详情为只读申请内容
系统应将异动申请详情展示为学生端表单区块的只读镜像，不含审批流转控件或仅教务使用的区块。

#### 场景：详情不含审批操作
- 当用户从 Status Change Application tab 下任意异动类型列表打开 Details 时，则详情弹框不展示 approval action、comment、common comments 或 submit approval 控件。

#### 场景：详情顶栏不含审批阶段
- 当用户为 In Progress 申请打开 Details 时，则详情顶栏仅展示 Application ID 与 Status 徽章，不展示 approval stage 文本。

#### 场景：转专业详情不含 Section VII
- 当用户为转专业申请打开 Details 时，则弹框不展示 Section VII（For Academic Affairs Office Only）字段或可编辑的 管理员programme/intake/date 控件。

#### 场景：详情区块与新建表单一致
- 当用户为休学、复学或退学打开 Details 时，则弹框展示与新建/编辑表单相同的 学生application 区块直至 Documents  inclusive，且不含任何仅审批内容。

### 需求：异动附件只读展示对齐原型
系统应在详情弹框中使用对齐原型的边框面板渲染已上传附件：带必填标记的标签行、右侧 Download Consent Letter 操作，以及下方带文档图标的文件链接。

#### 场景：附件面板布局
- 当用户在任意异动详情弹框的 Documents 区查看时，则系统在同一行展示 Upload Attachment 标签（含必填指示）、Download Consent Letter 按钮，下方以蓝色链接与文档图标展示已上传文件名。

#### 场景：无附件占位
- 当申请无附件文件名时，则附件面板显示占位而非文件链接。

#### 场景：在详情中下载同意书
- 当用户在详情附件面板点击 Download Consent Letter 时，则系统触发与申请表单相同的 mock 下载提示行为。

### 需求：流转日志仍外置于详情之外
系统应仅通过列表 Workflow Log 操作访问审批历史，不在详情弹框内嵌。

#### 场景：从列表打开流转日志
- 当用户点击列表行的 Workflow Log 时，则无论详情弹框内容如何变化，`ApprovalLogModal` 均打开并展示 stage/actor/action 历史。

## 修改需求

### 需求：转专业详情弹框（来自 programme-transfer-app）
系统应为转专业申请提供只读详情视图，仅展示学生申请 Section I–IV。

#### 场景：从列表打开详情
- 当用户点击转专业行的 Details 时，则系统打开含学生区块与状态元数据的详情弹框，且无 Section VII 或内嵌审批。

#### 场景：允许时从详情进入编辑
- 当用户为 Draft 或 Update Required 状态的转专业打开 Details 时，则底栏可提供 Edit 以打开表单弹框；详情中不提供审批。

### 需求：异动列表操作不再依赖详情内审批
系统不应在 Status Change Application 模块通过详情弹框 approve 事件路由审批状态更新。

#### 场景：关闭详情无审批副作用
- 当用户查看 In Progress 申请的 Details 并关闭弹框时，则除非用户执行列表级或表单级操作，否则 application status 与 approval stage 保持不变。

## 来源 `update-movement-application-details` / 能力 `programme-transfer-app`

## 修改需求

### 需求：查看转专业申请详情
系统应将转专业申请详情展示为只读学生申请内容（Section I–IV），不含 Section VII 或内嵌审批控件。

#### 场景：详情内容范围
- 当用户打开转专业 Details 时，则只读展示 Section I（学生Details）、II（Transfer Information）、III（Declaration）与 IV（Supporting Documents）。

#### 场景：申请模块中无教务审批
- 当用户为 Pending 审批的 In Progress 转专业打开 Details 时，则系统在详情弹框中不提供 Approve、Update Required 或 Reject 操作。

#### 场景：支持文档 UI
- 当用户在详情中查看 Section IV 时，则通过共享只读附件面板展示附件，并提供 Download Consent Letter 操作。

## 移除需求

### 需求：从详情弹框审批转专业
**原因**：审批迁移至独立 Status Change Approval 模块；申请 tab 详情面向学生只读。  
**迁移**：使用 Workflow Log 查看历史；未来审批模块将提供 approve/reject 操作。

#### 场景：详情内教务审批（已移除）
- 当用户以 管理员身份打开转专业 Details 时，则不展示内嵌审批表单。

### 需求：审批期间从详情弹框编辑 Section VII
**原因**：Section VII 为教务数据录入，不属于学生申请详情视图。  
**迁移**：Section VII 在新建/编辑表单保留供 mock 演示；完整教务编辑延后至审批模块。

#### 场景：详情中 Section VII 可编辑（已移除）
- 当用户在 Academic Affairs 审批阶段打开 Details 时，则详情弹框不展示或不可编辑 Section VII 字段。

## 来源 `update-movement-application-details` / 能力 `student-records-app`

## 修改需求

### 需求：学籍异动申请与审批 UX 分离
系统应将学生申请查看（Status Change Application tab）与审批操作（未来 Status Change Approval 菜单）分离。

#### 场景：申请 tab 详情不可审批
- 当用户导航至 Status Change Application 并为任意异动类型打开 Details 时，则仅展示申请表单字段；此上下文中不执行审批。

#### 场景：列表仍可访问流转日志
- 当用户在申请 tab 查看任意异动申请列表时，则 Workflow Log 操作对所有状态仍可用。
