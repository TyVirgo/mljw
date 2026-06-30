## Context

`restructure-student-records-navigation` 已在「学籍异动」组第二位放置 **知情同意书**（`sr-consent-form`）。`add-movement-category-config` 已实现异动类别主数据。四 Tab 异动申请均已实现 Form/Detail，Documents 区有「下载同意书」但统一 `window.alert(consentLetterHint)`。

产品图示要求：管理端维护 **(异动类型 × 学生类型) → 模板**；申请端按 Tab + 学生类别匹配下载；部分类型含家长模板；转专业需配置 **修读时长** 申请门槛。

## Goals / Non-Goals

**Goals:**

- 知情同意书列表 CRUD（图示1）
- Create/Edit 弹窗（图示3）：名称、适用类别、Student Type、修读时长（转专业）、Remark、学生/家长模板 upload
- View 只读弹窗 + mock 下载
- `resolveConsentTemplate` + 四 Tab / 详情附件区接线（图示2）
- 休学/退学 Section III 家长模板下载（当配置存在）
- 转专业提交时 mock 修读时长校验
- Mock 种子数据体现多维差异

**Non-Goals:**

- 后端文件服务、真实 PDF 生成
- 与 `movementCategories` 行级联动（仅用四 Tab 粗粒度）
- 精确学期/学分计算引擎
- 审批、维护、查询等其它占位菜单

## Decisions

### 1. 数据模型 — `src/data/consentForms.js`

```javascript
export const movementTypeKeys = [
  'programme-transfer',
  'deferment',
  'resumption',
  'withdrawal',
]

/** 与 movementCategories 一致；申请端 studentCategory China 映射为 Chinese */
export const consentFormStudentTypes = ['Local', 'Chinese', 'International']

export const studyDurationRules = [
  'none',              // 不限
  'afterOneYear',      // 入学满 1 学年
  'withinMaxDuration', // 最长修读年限内（6/7 年，mock 文案）
]

{
  id: number,
  formName: string,           // 知情同意书名称
  movementType: string,       // programme-transfer | deferment | ...
  studentType: string,        // Local | Chinese | International
  studyDurationRule: string,  // studyDurationRules；PT 必填，其它默认 none
  remark: string,
  studentConsentFile: { fileName, size } | null,
  parentConsentFile: { fileName, size } | null,
}
```

- 存储：`ref([...])`，初始 **8+ 条** mock
- 唯一键：`movementType + studentType`
- 文件：mock `{ fileName, size }`；下载时用 `Blob` + 占位文本或空 PDF 占位

### 2. Lookup 与 Student Type 映射

```javascript
function normalizeStudentTypeForConsent(studentCategory) {
  if (studentCategory === 'China') return 'Chinese'
  return studentCategory || 'Local'
}

function resolveConsentTemplate(movementType, studentCategory) {
  const studentType = normalizeStudentTypeForConsent(studentCategory)
  return consentForms.value.find(
    (r) => r.movementType === movementType && r.studentType === studentType,
  ) || null
}
```

四 Tab → `movementType` 映射：

| Tab key | movementType |
|---------|----------------|
| programme-transfer | programme-transfer |
| deferment | deferment |
| resumption | resumption |
| withdrawal | withdrawal |

### 3. 修读时长（图示1 列 + 图示3 条件字段）

| 适用异动类别 | 修读时长字段 |
|-------------|-------------|
| Programme Transfer | 必填下拉（afterOneYear / withinMaxDuration 等） |
| Deferment / Resumption / Withdrawal | 默认 `none`，列表显示「不限」；表单可隐藏或只读 |

**申请端校验（转专业 only，mock）：**

- `afterOneYear`：学生 `enrollmentDate` 距今 ≥ 365 天（mock）
- `withinMaxDuration`：首版仅展示规则，提交不额外拦截（或统一提示「请在最长修读年限内申请」）
- 不满足：`validateProgrammeTransferEligibility(student, template)` 返回错误，Form 阻止 Submit

### 4. UI 结构

```
ConsentFormView.vue
  ├── .search-bar（适用类别 / 名称 / Student Type）
  ├── .toolbar（Create · Delete）
  ├── table + pagination
  └── modals:
        ConsentFormFormModal.vue    // Create/Edit 图示3
        ConsentFormViewModal.vue    // View 只读
        ConfirmDialog.vue

src/utils/consentFormDownload.js
  └── downloadMockConsentFile(fileMeta, label)
```

**ConsentFormFormModal**（图示3 对齐）：

- 单列/双列混合；Upload 区复用异动 Form 的 file input mock 模式
- 扩展名提示：`.rar .zip .doc .docx .pdf .jpg ...`
- Footer：Cancel + Save

**ConsentFormViewModal**：

- 只读字段 + 文件名链接（mock 下载）

### 5. 申请端接线

**Documents 区（四 Tab Form + MovementAttachmentReadonly）：**

```javascript
function downloadConsentLetter() {
  const template = resolveConsentTemplate(activeMovementType, selectedStudent?.studentCategory)
  if (!template?.studentConsentFile) {
    window.alert(t('consentForm.downloadNotConfigured'))
    return
  }
  downloadMockConsentFile(template.studentConsentFile, template.formName)
}
```

**Deferment / Withdrawal Section III：**

- 当 `template.parentConsentFile` 存在时，在家长区块底部显示「下载家长同意书」
- 无配置则不显示该按钮

**ProgrammeTransferFormModal submit：**

- 提交前调用修读时长 eligibility check

### 6. Mock 种子示例

| formName | movementType | studentType | studyDuration | parent file |
|----------|--------------|-------------|---------------|-------------|
| PT Consent Local | programme-transfer | Local | afterOneYear | — |
| PT Consent Chinese | programme-transfer | Chinese | afterOneYear | — |
| PT Consent Intl | programme-transfer | International | afterOneYear | — |
| DEF Consent Local | deferment | Local | none | ✓ |
| DEF Consent Chinese | deferment | Chinese | none | ✓ |
| WDR Consent Intl | withdrawal | International | none | ✓ |
| RES Consent Local | resumption | Local | none | — |
| … | … | … | … | … |

### 7. 路由与 i18n

- `studentRecordsDevelopedPages.add('sr-consent-form')`
- `App.vue`：`isConsentForm` → `ConsentFormView`
- 新增 `consentForm.*` 命名空间；`studentType.Chinese` → 「中国」

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| China vs Chinese 两套枚举 | lookup 层统一映射 |
| 修读时长 mock 与真实业务偏差 | 规则枚举 + design 标注 Non-goal 精确计算 |
| 家长书单/双下载按钮 UX | 仅 Section III 有家长区时显示家长下载 |
| 模板缺失导致申请阻塞 | 明确提示「未配置」；种子数据覆盖四 Tab |

## Migration Plan

1. `consentForms.js` + download util + lookup
2. ConsentFormView + FormModal + ViewModal
3. i18n + 菜单 / App.vue
4. 四 Tab Form + MovementAttachmentReadonly 接线
5. PT 修读时长 submit 校验
6. 冒烟 + `npm run build`

## Open Questions

- 复学是否普遍需要家长同意书：首版 mock 可不配 parent file，保留字段即可
- ~~`withinMaxDuration` 是否在首版拦截提交~~（Phase 1 已移除修读时长）

---

## §10 Phase 2 — 学历层次与学期版本（已确认）

### 8. 学历层次枚举

```javascript
export const consentEducationLevels = ['Foundation', 'Undergraduate', 'Postgraduate']
// UI: 预科 / 本科 / 研究生（i18n consentForm.educationLevel.*）
```

- 列表 / Create/Edit **必填**
- 与学生档案 `enrollment.programmeLevel` 对齐（申请端 lookup 时映射；非常规值首版 treat as no match）

### 9. 配置行 + 学期快照模型

```javascript
// 列表一行 = 配置主键
{
  id, formName, movementType, studentType,
  educationLevel: 'Undergraduate',  // Foundation | Undergraduate | Postgraduate
  remark: string,
  // Edit 只改以下「行级默认附件」（非学期生效态）
  studentConsentFile: FileMeta | null,
  parentConsentFile: FileMeta | null,
  versions: [
    {
      id: number,
      academicSession: '2025/04',   // YYYY/MM；与 intakeSets VALID_INTAKE_MONTHS 02|04|09 一致
      studentConsentFile: FileMeta | null,
      parentConsentFile: FileMeta | null,
      remark: string,
      updatedAt: string,            // ISO 或 mock 展示时间
      isApplied: boolean,           // 该学期下是否生效
    },
  ],
}
```

- **唯一键**：`movementType + studentType + educationLevel`（Create/Edit 校验）
- **历史归属**：在历史弹窗内对某 `academicSession` 新增/编辑 → 写入/更新该学期下的 version 条目
- **应用互斥**：`setAppliedVersion(configId, versionId)` 时，同 `academicSession` 其它 version 的 `isApplied` 置 `false`

### 10. Lookup 与申请端

```javascript
function mapProgrammeLevelToEducationLevel(programmeLevel) {
  const v = String(programmeLevel || '').trim()
  if (v === 'Foundation') return 'Foundation'
  if (v === 'Postgraduate') return 'Postgraduate'
  if (v === 'Undergraduate') return 'Undergraduate'
  return '' // 无法映射 → 未匹配
}

export function resolveConsentTemplate(
  movementType,
  studentCategory,
  programmeLevel,
  academicSession,
) {
  const studentType = normalizeStudentTypeForConsent(studentCategory)
  const educationLevel = mapProgrammeLevelToEducationLevel(programmeLevel)
  const session = normalizeAcademicSession(academicSession) // YYYY/MM
  const row = consentForms.value.find(
    (r) =>
      r.movementType === movementType &&
      r.studentType === studentType &&
      r.educationLevel === educationLevel,
  )
  if (!row || !session) return null
  const applied = (row.versions || []).find(
    (v) => v.academicSession === session && v.isApplied,
  )
  return applied || null // 无已应用版本 → null（不用行级默认附件 fallback）
}
```

- **academicSession 来源**：与 `movementApplicationSession.js` 一致——Form 选学生后 `resolveApplicationSessionFromStudent(student)`；详情/只读用存库 `applicationSession`
- **未匹配**：`downloadStudentConsentTemplate` / 家长下载 → toast 或 alert：**「未匹配对应同意书，联系管理员」**（替换 Phase 1 `downloadNotConfigured` 文案或新增 key）

### 11. UI — 历史版本弹窗

```
ConsentFormVersionHistoryModal
├── 标题：历史版本
├── 副标题：Deferment · Local · 本科（movement + studentType + educationLevel）
├── 工具栏（可选）：选择学期 + 从行默认复制 / 新增版本
├── 表格：学年学期 | 学生/家长附件 | 更新时间 | 应用 [switch]
└── Footer：Close
```

- 列表 Actions：`Edit | View | 历史版本`
- 切换 **应用** ON → 同学期其它版本 OFF；可 toast 确认

### 12. 文件影响（§10）

```
新增:
  src/components/studentRecords/ConsentFormVersionHistoryModal.vue

修改:
  src/data/consentForms.js
  src/views/studentRecords/ConsentFormView.vue
  src/components/studentRecords/ConsentFormFormModal.vue
  src/utils/consentFormDownload.js
  ProgrammeTransfer/Deferment/Resumption/Withdrawal FormModal + MovementAttachmentReadonly
  src/i18n/locales/en.js、zh.js
  specs/movement-application-details/spec.md（未匹配文案）
```

**Non-Goals（§10）**：行级默认附件作为下载 fallback；06 月份；版本 diff UI。

---

## §11 Phase 2.1 — 历史版本 UX refinement（Status Log 式 + 全局 Apply）

> **Supersedes（部分）§10**：历史弹窗手工维护、同学期 Apply 互斥、lookup 四维匹配 — 本 Phase **暂时** 改为 Save 追加日志 + 全局一条 Applied + 三维 lookup。

### 13. Version log 模型（对齐 Status Log）

```javascript
versions: [
  {
    id: number,
    academicSession: '2025/04',   // Save 时点：resolveAcademicSessionFromDate(now)
    changedBy: 'ADMIN USER',
    updatedAt: '2026-06-15T10:30:00.000Z',
    remarkTitle: 'New Consent Form' | 'Updated Consent Form',
    remarkLines: ['Student File : foo.pdf', 'Old Student File : a.pdf', 'New Student File : b.pdf'],
    studentConsentFile: FileMeta | null,
    parentConsentFile: FileMeta | null,
    isApplied: boolean,           // 全局至多一条 true / 配置行
  },
]
```

### 14. resolveAcademicSessionFromDate

```javascript
// 1) 在 semesterInfo 记录中找 startDate <= today <= endDate → YYYY/MM
// 2) fallback: normalizeAcademicSession(today ISO) → snapCalendarMonth
export function resolveAcademicSessionFromDate(date = new Date(), records = initialSemesterRecords)
```

与 `getCurrentApplicationSession()`（`currentSemester === 'Yes'`）**不同** — §11 明确用 **日历时间**。

### 15. Save 时 appendVersionLog

```javascript
export function appendVersionLog(configId, { formSnapshot, changedBy, isCreate }) {
  const academicSession = resolveAcademicSessionFromDate()
  const previous = getLatestVersion(configId) // or row state before patch
  const remarkLines = isCreate
    ? buildCreateRemarkLines(formSnapshot)
    : buildDiffRemarkLines(previous, formSnapshot)
  const entry = { ..., isApplied: true }
  // 同 row：其余 versions.isApplied = false
}
```

- `createConsentForm` / `updateConsentForm` 在 Save 成功后调用
- Create：`remarkTitle: 'New Consent Form'`
- Edit：`remarkTitle: 'Updated Consent Form'` + Old/New 行

### 16. 历史弹窗 UI（只读 + Apply）

```
ConsentFormVersionHistoryModal
├── 副标题：Deferment · Local · 本科
├── table（StatusLogTab 风格）
│     学年学期 | 变更人 | 变更内容 | 更新时间 | 应用
└── Close
```

- **无** draft 区、无 upsertConsentVersion 从 UI、无 removeConsentVersion

### 17. Lookup（暂时三维）

```javascript
export function resolveConsentTemplate(movementType, studentCategory, programmeLevel) {
  const row = /* movement + studentType + educationLevel */
  const applied = row.versions.find((v) => v.isApplied)
  return applied ? toTemplateSnapshot(row, applied) : null
}
```

- 申请端 `applicationSession` **暂不参与** 同意书匹配（Non-goal §11）
- 后续可恢复：`resolveConsentTemplate(..., academicSession)` + 每学期 Applied

### 18. 文件影响（§11）

```
修改:
  src/data/consentForms.js — appendVersionLog、全局 setAppliedVersion、lookup 三维
  src/data/movementApplicationSession.js 或 normalizeAcademicSession.js — resolveAcademicSessionFromDate
  ConsentFormVersionHistoryModal.vue — 只读 + Apply
  ConsentFormFormModal.vue / ConsentFormView.vue — Save → append
  consentFormDownload.js + 四 Tab + MovementAttachmentReadonly — lookup 参数简化
  specs/consent-form-config/spec.md MODIFIED
  specs/movement-application-details/spec.md MODIFIED
```

**Non-Goals（§11）**：历史 Delete；弹窗内 Edit；按学期分组 Apply。
