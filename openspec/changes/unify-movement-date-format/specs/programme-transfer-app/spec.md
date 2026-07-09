## 修改需求

### 需求：转专业表单区块对齐原型
系统应渲染与 StudentSys 原型对齐的申请表单，包括在新建与编辑表单上将 Section VII 作为可见但申请侧不可编辑的教务区块。

#### 场景：Section I 学生详情
- 当用户在表单中查看 Section I 时，则系统展示 Student ID（必填、可搜索下拉）、Full Name、NRIC/Passport No.、Nationality、Email、Contact No. 与 Student Visa Expiry Date。

#### 场景：Student ID 自动填充
- 当用户从学生档案数据中选择 Student ID 时，则系统自动填充 Section I 字段及 Section II 的 current programme、intake 与 school。

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
