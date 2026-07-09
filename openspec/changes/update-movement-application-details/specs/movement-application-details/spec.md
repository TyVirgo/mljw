## 新增需求

### 需求：异动申请详情为只读申请内容
系统应将异动申请详情展示为学生端表单区块的只读镜像，不含审批流转控件或仅教务使用的区块。

#### 场景：详情不含审批操作
- 当用户从 Status Change Application tab 下任意异动类型列表打开 Details 时，则详情弹框不展示 approval action、comment、common comments 或 submit approval 控件。

#### 场景：详情顶栏不含审批阶段
- 当用户为 In Progress 申请打开 Details 时，则详情顶栏仅展示 Application ID 与 Status 徽章，不展示 approval stage 文本。

#### 场景：转专业详情不含 Section VII
- 当用户为转专业申请打开 Details 时，则弹框不展示 Section VII（For Academic Affairs Office Only）字段或可编辑的 admin programme/intake/date 控件。

#### 场景：详情区块与新建表单一致
- 当用户为休学、复学或退学打开 Details 时，则弹框展示与新建/编辑表单相同的 student application 区块直至 Documents  inclusive，且不含任何仅审批内容。

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
