## 新增需求

### 需求：Section II 学生申请布局

四类异动申请表单应使用区块标题 `SECTION II : STUDENT APPLICATION`（或等效 i18n），并按设计文档为各异动类型配置字段网格。

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
