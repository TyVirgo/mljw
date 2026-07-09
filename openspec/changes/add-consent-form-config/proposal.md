## 背景与动机

学籍异动侧边栏「知情同意书」（`sr-consent-form`）仍为建设中页。四 Tab 异动申请（转专业/休学/复学/退学）的「下载同意书」目前仅为 `alert` 占位，无法按 **异动类型 × 学生类型** 匹配不同模板；部分异动（休学/退学）还涉及 **家长同意书**。需在管理端维护同意书模板库，并在申请端按所选学生与当前 Tab 自动匹配下载，使「下载 → 签署 → 上传」闭环可演示。

## 变更内容

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

## 能力范围

### 新增能力

- `consent-form-config`: 知情同意书模板列表、CRUD、修读时长规则、模板 upload mock、View 弹窗、lookup helper

### 修改的能力

- `student-records-app`: `sr-consent-form` 从建设中升级为已开发
- `movement-application-details`: 详情/表单「下载同意书」从 alert 占位改为按模板库匹配 mock 下载

## 影响范围

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
- **非目标（本变更不做）**
  - 真实文件存储 / 后端 API
  - 审批流、异动类别/原因配置联动
  - 最长修读年限的精确学期计算（首版 mock 规则即可）
  - Import / Export

---

## §10 学历层次与学期版本历史（Phase 2 — 2026-06）

产品反馈：知情同意书需按 **学历层次** 区分模板；同一 `(异动类型 × Student Type × 学历层次)` 下按 **学年学期**（与 `intakeSets` / 申请 `applicationSession` 同一套 `YYYY/MM`，月份 `02|04|09`）维护多版快照；每学期仅 **一个已应用** 版本供申请端下载；列表 **Edit** 只改配置行默认附件，学期快照在 **历史版本** 弹窗维护。

### 范围

- **学历层次**：Create/Edit 必填下拉 `Foundation | Undergraduate | Postgraduate`（界面：预科 / 本科 / 研究生）
- **唯一键**：`(movementType + studentType + educationLevel)` 不可重复（替代 Phase 1 二维唯一）
- **列表**：新增「学历层次」列；Actions 增加 **历史版本**（Edit | View | 历史版本）
- **Edit**：仅更新该配置行的默认字段（名称、Remark、行级学生/家长附件 mock）；**不**直接写入学期快照
- **历史版本弹窗**（新 `ConsentFormVersionHistoryModal`）：
  - 范围：当前行的 `movementType + studentType + educationLevel`
  - 按 **学年学期**（`YYYY/MM`）展示各学期下的版本快照
  - 在某学期下新增/修改同意书 → 归属该 `academicSession` 的历史条目
  - 每行版本：学期、附件摘要、更新时间、**应用**开关（toggle）
  - **互斥**：同一配置行 + 同一 `academicSession` 下最多一个 `isApplied: true`
- **申请端 lookup 扩展**：
  - `resolveConsentTemplate(movementType, studentCategory, programmeLevel, academicSession)`
  - `programmeLevel` 映射为 `Foundation | Undergraduate | Postgraduate`（与 enrollment 字段对齐）
  - `academicSession` 与申请 Form 只读「申请学年学期」同源（`resolveApplicationSessionFromStudent` / 存库 `applicationSession`）
  - 命中：该学期 **已应用** 的版本附件；未命中：**不下载**，按钮侧提示 **「未匹配对应同意书，联系管理员」**（i18n）
- **Mock 种子**：扩展现有 9 条或增行，覆盖至少 2 个 educationLevel × 2 个 academicSession 的 `versions[]` + `isApplied` 样例

### 非目标（§10）

- 真实 PDF 版本 diff、审批发布流
- 自动按当前学期归档（首版手工在历史弹窗维护）
- 新增 `06` 月份（沿用 `intakeSets` 的 `02|04|09`）
- Import/Export 扁平化 versions

### 能力范围（§10）

- `consent-form-config`: 学历层次 + 学期版本历史 + 应用互斥 + lookup 四维匹配
- `movement-application-details`: 下载未匹配时的统一提示文案

### 影响范围（§10）

- **修改** `src/data/consentForms.js` — 模型、`versions[]`、`applyConsentVersion`、lookup 签名
- **新增** `ConsentFormVersionHistoryModal.vue`
- **修改** `ConsentFormView.vue`、`ConsentFormFormModal.vue`、`consentFormDownload.js`、四 Tab Form、`MovementAttachmentReadonly.vue`
- **修改** `specs/consent-form-config/spec.md`、`specs/movement-application-details/spec.md`、`scripts/prd/prd-content.mjs`（可选）
- **i18n**：`educationLevel.*`、`versionHistory`、`applyVersion`、`downloadNoMatchContactAdmin`

---

## §11 历史版本 UX  refinement（Phase 2.1 — 2026-06）

产品反馈：历史版本弹窗 **不应** 提供手工新增/上传区；历史由 **Create/Edit Save 自动追加**（对齐学籍档案 **Status Log** 只读审计表）；**暂时** 每个配置行 **全局仅一条** `isApplied`；Save 时 **学年学期** 由 **当前时间** 推导（非手选、非 `currentSemester` 标记）。

### 范围

- **历史写入**：`ConsentFormFormModal` Save（Create / Edit）时自动 `appendVersionLog`：
  - `academicSession` ← `resolveAcademicSessionFromDate(now)`（优先 `semesterInfo` 起止日区间；无匹配则 `snapCalendarMonth` fallback → `YYYY/MM`）
  - `changedBy` ← mock 当前管理员
  - `updatedAt` ← Save 时间
  - `remarkTitle` / `remarkLines[]` ← 新增或字段 diff（Status Log 风格，含 Old/New 附件名等）
  - 完整附件快照（student / parent）
  - **新记录 `isApplied: true`**，同配置行 **其余全部 `false`**（全局互斥，不按学期分组）
- **历史弹窗**（重构 `ConsentFormVersionHistoryModal`）：
  - **只读**表格：学年学期 | 变更人 | 变更内容 | 更新时间 | 应用 [switch]
  - 表头浅绿 `#E8F5E9`（对齐 `StatusLogTab`）
  - **移除**上半区新增/编辑/上传/删除/从默认复制
  - 允许切换 **Apply** 将某条历史设为全局生效
- **Lookup（暂时）**：
  - `resolveConsentTemplate(movementType, studentCategory, programmeLevel)` — **暂不使用** 申请 `applicationSession`
  - 命中：配置行上 **唯一** `isApplied=true` 的快照；未命中 → 「未匹配对应同意书，联系管理员」
- **配置行 Edit**：Save 仍更新当前字段 **并** append 历史（不再区分「仅 default 不写快照」）

### 非目标（§11）

- 历史弹窗内手工维护版本
- 历史条目 Delete（审计只追加）
- 按申请学期匹配 Applied（后续 Phase 可恢复 §10 四维 lookup）
- 真实后端 audit / 当前登录用户

### 能力范围（§11）

- `consent-form-config`: Status Log 式 version log + Save 驱动 append + 全局 Apply + 日期推导学期
- `movement-application-details`: lookup 暂时三维（education level 仍映射）

### 影响范围（§11）

- **修改** `consentForms.js` — `appendVersionLog`、`resolveAcademicSessionFromDate`、`setAppliedVersion` 全局互斥、lookup 签名
- **修改** `ConsentFormVersionHistoryModal.vue` — 只读表 + Apply
- **修改** `ConsentFormFormModal.vue` / `ConsentFormView.vue` Save 路径
- **修改** `consentFormDownload.js`、四 Tab Form、`MovementAttachmentReadonly` — lookup 去掉 applicationSession 参与匹配（暂时）
- **新增** `resolveAcademicSessionFromDate`（建议 `movementApplicationSession.js` 或 `normalizeAcademicSession.js`）
- **修改** `specs/consent-form-config/spec.md` MODIFIED §11；`specs/movement-application-details/spec.md`
