## Why

学籍异动侧边栏「知情同意书」（`sr-consent-form`）仍为建设中页。四 Tab 异动申请（转专业/休学/复学/退学）的「下载同意书」目前仅为 `alert` 占位，无法按 **异动类型 × 学生类型** 匹配不同模板；部分异动（休学/退学）还涉及 **家长同意书**。需在管理端维护同意书模板库，并在申请端按所选学生与当前 Tab 自动匹配下载，使「下载 → 签署 → 上传」闭环可演示。

## What Changes

### 主列表页（图示1）

- 注册 `sr-consent-form` 为已开发页面
- 搜索区：适用异动类别（下拉）、知情同意书名称（文本）、Student Type（下拉）；Search / Reset；复用 `list-page-search.css`
- 工具栏：**Create**、**Delete**（勾选批量删除 + 确认）
- 表格列：勾选、序号、知情同意书名称、适用异动类别、Student Type、**修读时长**、Remark、Actions（**Edit** | **View**）
- 分页器（与 `MovementCategoryView` 一致）

### 新增/编辑弹窗（图示3）

- 字段：
  - 知情同意书名称 *（文本）
  - 适用异动类别 *（下拉：四 Tab 异动类型）
  - Student Type *（Local / Chinese / International；中文 UI 显示「中国」）
  - **修读时长** *（条件字段：当适用类别为 Programme Transfer 时必填；其它类别默认「不限」且可只读或隐藏）
  - Remark（多行，可选）
  - 学生知情同意书 *（Upload mock）
  - 家长知情同意书（Upload mock，可选；有值表示该模板组合需要家长签署件）
- Footer：**Cancel + Save**
- 唯一性：同一 `(适用异动类别 + Student Type)` 不可重复

### 查看弹窗（View）

- 只读展示全部字段及已上传模板文件名
- 支持 mock 下载学生/家长模板文件

### 异动申请端消费（图示2）

- 新增 `resolveConsentTemplate(movementType, studentCategory)` helper
- 四 Tab Form 与 `MovementAttachmentReadonly`：**下载同意书** 改为按当前 Tab + 所选学生 `studentCategory` 匹配学生模板（`China` → `Chinese` 映射）
- 休学/退学 Form 的 Section III（家长同意）：当匹配模板含家长文件时，增加 **下载家长同意书** 按钮
- 未匹配到模板时：提示「未配置同意书模板」（i18n），不下载
- **转专业申请提交**：若模板配置了修读时长规则且不满足 mock 门槛，阻止提交并提示（首版 mock：按入学日期 + 规则枚举判断）

### 数据与范围约束

- **适用异动类别** 使用四 Tab 固定枚举（与异动申请一一对应），显示文案与 `movementCategories.categoryName` 对齐
- **Mock 种子**：覆盖 Programme Transfer / Deferment / Withdrawal × Local / Chinese / International 等组合（至少 8 条），体现差异与家长书
- 纯前端 mock；无后端 API、Import/Export

## Capabilities

### New Capabilities

- `consent-form-config`: 知情同意书模板列表、CRUD、修读时长规则、模板 upload mock、View 弹窗、lookup helper

### Modified Capabilities

- `student-records-app`: `sr-consent-form` 从建设中升级为已开发
- `movement-application-details`: 详情/表单「下载同意书」从 alert 占位改为按模板库匹配 mock 下载

## Impact

- **新增**
  - `ConsentFormView.vue`
  - `ConsentFormFormModal.vue`
  - `ConsentFormViewModal.vue`
  - `src/data/consentForms.js`（含 lookup、修读时长规则、studentCategory 映射）
  - `src/utils/consentFormDownload.js`（mock 下载）
- **修改**
  - `studentRecordsMenu.js`、`App.vue`
  - `ProgrammeTransferFormModal.vue`、`DefermentFormModal.vue`、`ResumptionFormModal.vue`、`WithdrawalFormModal.vue`
  - `MovementAttachmentReadonly.vue`
  - `src/i18n/locales/en.js`、`zh.js`、`zh-flat.js`
- **Non-goals**
  - 真实文件存储 / 后端 API
  - 审批流、异动类别/原因配置联动
  - 最长修读年限的精确学期计算（首版 mock 规则即可）
  - Import / Export
