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
- `withinMaxDuration` 是否在首版拦截提交：建议仅 PT + `afterOneYear` 硬拦截，其余展示为主
