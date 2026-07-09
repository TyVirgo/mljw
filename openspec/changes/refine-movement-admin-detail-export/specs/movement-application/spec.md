## 修改需求

### 需求：异动详情抽屉布局

所有异动申请详情抽屉（Query、Maintenance、Approval、Admin Application、Student Application）应先展示申请详情，最后展示 Approval Log 表格。抽屉不应使用纵向审批时间线组件。

#### 场景：详情内容先于审批日志
- **当** 用户打开任意异动申请详情抽屉
- **则** 申请字段与附件显示在 Approval Log 区块上方

#### 场景：审批日志为四列表格
- **当** 抽屉展示审批历史
- **则** 表格列为 Description、Action By、Action By Role、Created At，按日志顺序排列

#### 场景：Submitted 操作描述
- **当** 审批日志条目的 action 为 Submitted
- **则** Description 显示 Application Submitted

#### 场景：Created At 格式
- **当** 审批日志条目有日期/时间值
- **则** Created At 显示为 `YYYY-MM-DD HH:mm:ss`

### 需求：详情抽屉中的附件演示与导出

详情抽屉应在无已上传文件时展示演示附件，并为每个附件提供 Export 操作，命名包含文档类型与异动类型后缀（Programme Transfer、Deferment、Resumption、Withdrawal）。

#### 场景：无上传时显示演示附件
- **当** 为无已上传附件元数据的记录打开详情抽屉
- **则** 适用文档字段显示演示附件文件

#### 场景：附件导出文件名
- **当** 用户从详情抽屉导出附件
- **则** 下载名称遵循 `{archiveNo}. {studentId} {NAME}_ {DocType}_{MovementType}.ext`，未 Approved 时使用 NA

### 需求：仅管理端申请支持 PDF 导出

仅 Movement Application (Admin) 详情抽屉（`applicantMode === 'teacher'`）应在页脚显示 Export PDF 操作。Query、Maintenance、Approval 与 Student Application 抽屉不应显示 PDF 导出。

#### 场景：管理端申请显示 PDF 导出
- **当** 教职工从 Movement Application (Admin) 打开详情抽屉
- **则** 页脚提供 Export PDF 按钮

#### 场景：其他入口隐藏 PDF 导出
- **当** 用户从 Query、Maintenance、Approval 或 Student Application 打开详情抽屉
- **则** 不显示 Export PDF 按钮

#### 场景：PDF 包含附件与审批日志
- **当** 教职工从 Movement Application (Admin) 导出 PDF
- **则** 生成的 PDF 包含申请详情、附件列表及 Approval Log 表格

#### 场景：PDF 文件名归档编号
- **当** 记录状态为 Approved
- **则** PDF 文件名使用稳定的数字归档前缀；否则前缀为 NA

#### 场景：转专业命名后缀
- **当** 为转专业导出 PDF 或附件
- **则** 异动类型后缀使用 Programme Transfer

### 需求：详情视图隐藏同意书模板下载

异动申请详情视图（抽屉与详情弹框）不应显示 Download Consent Letter 模板按钮。该操作仅保留在新增/编辑申请表单中。

#### 场景：详情抽屉隐藏同意书模板下载
- **当** 用户打开异动申请详情抽屉
- **则** 文档区块不显示 Download Consent Letter 按钮

#### 场景：创建表单保留同意书模板下载
- **当** 用户在表单弹框中创建或编辑异动申请
- **则** 适用文档字段仍提供 Download Consent Letter 按钮

### 需求：详情声明勾选框与创建表单一致

详情视图应以与创建表单相同的已勾选视觉样式（蓝色勾选外观）渲染学生声明勾选框，同时保持不可交互。

#### 场景：只读声明显示蓝色已勾选状态
- **当** 详情视图展示已同意声明的记录
- **则** 勾选框显示为已勾选，样式与创建表单相同的蓝色风格

### 需求：管理端详情抽屉页脚按钮顺序

显示 Export PDF 时，其应位于 Close 按钮左侧。

#### 场景：Export PDF 在 Close 之前
- **当** 管理端申请详情抽屉页脚显示 Export PDF
- **则** Export PDF 位于 Close 之前
