# 学籍管理-知情同意书配置 — 设计要点（合并）

## 文档用途

汇总历史 design 中与本菜单相关的决策与约束，供写需求文档时对照。冲突处以较新变更及当前代码为准。

## 来源：add-consent-form-config

## 背景说明

`restructure-student-records-navigation` 已在「学籍异动」组第二位放置 **知情同意书**（`sr-consent-form`）。`add-movement-category-config` 已实现异动类别主数据。四 Tab 异动申请均已实现 Form/Detail，Documents 区有「下载同意书」但统一 `window.alert(consentLetterHint)`。

产品图示要求：管理端维护 **(异动类型 × 学生类型) → 模板**；申请端按 Tab + 学生类别匹配下载；部分类型含家长模板；转专业需配置 **修读时长** 申请门槛。

## 目标 / 非目标

**目标：**

- 知情同意书列表 CRUD（图示1）
- Create/Edit 弹窗（图示3）：名称、适用类别、学生Type、修读时长（转专业）、Remark、学生/家长模板 upload
- View 只读弹窗 + mock 下载
- `resolveConsentTemplate` + 四 Tab / 详情附件区接线（图示2）
- 休学/退学 Section III 家长模板下载（当配置存在）
- 转专业提交时 mock 修读时长校验
- Mock 种子数据体现多维差异

**非目标：**

- 后端文件服务、真实 PDF 生成
- 与 `movementCategories` 行级联动（仅用四 Tab 粗粒度）
- 精确学期/学分计算引擎
- 审批、维护、查询等其它占位菜单

## 设计决策

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

### 2. Lookup 与 学生Type 映射

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
| Deferment / Res

## 来源：refine-consent-form-version-snapshot

## 背景说明

已实现 Phase 2.1 refinement 的主体（版本快照、附件列、Edit 仅元数据等）。产品进一步明确：

- **学期与应用** 只在版本快照中维护，Create 不参与
- **新增版本** 时用户显式决定是否立即应用，默认不应用
- 列表与快照 UI 若干微调（见 Phase 2.2）

```
┌─────────────────────────────────────────────────────────────┐
│  Create / Edit          │  Version Snapshot                │
├─────────────────────────┼─────────────────────────────────┤
│  配置身份 + 名称 + 批注   │  学期 + 附件 + 应用状态          │
│  versions[] = []        │  新增版本（含立即应用开关）       │
└─────────────────────────┴─────────────────────────────────┘
```

## 目标 / 非目标

**目标：**

- Create 五字段，无学年学期，无首版 snapshot
- 新增版本：学期 + 附件 + **是否立即应用**（默认关）
- 快照表 Apply 列用 `YnSwitch`，互斥
- 「新增版本」在表格左上角
- 列表无 View；mock 备注各行不同

**非目标：**

- 按申请学期 lookup
- 快照内编辑/删除版本

## 设计决策

### D1：Create 不再创建版本（修订原 D2）

Save Create 时：

```js
{ formName, movementType, studentType, educationLevel, remark, versions: [] }
```

用户保存后进入「版本快照」→「新增版本」完成首次内容录入。

**理由**：学期与应用均属版本维度，与 Create 五字段模型一致。

### D2：Create 布局（修订原 D5）

- 2×2 Grid：名称 | 异动类别 / 学生Type | 学历层次
- 批注：单独一行 `grid-column: 1 / -1` 或置于网格最后一格
- 弹宽 ~640–720px

### D3：新增版本 — 是否立即应用（修订原 D3）

`ConsentFormVersionFormModal` 字段：

| 字段 | 必填 | 默认 |
|------|------|------|
| 生效学年学期 | 是 | — |
| 学生同意书 | 是 | — |
| 家长同意书 | 否 | — |
| 是否立即应用 | — | **关** |

Save 逻辑：

```js
isApplied = payload.applyImmediately === true
// 若 isApplied，同 row 其余版本 isApplied = false
```

**废弃**：「无已应用版本时新条目自动 isApplied=true」。

### D4：快照 UX（Phase 2.2 已实现/规格化）

- 「新增版本」：`table-toolbar`，表格上方左对齐
- Apply 列：复用 `YnSwitch`，`setAppliedVersion` 互斥
- 附件列：`AttachmentPreviewTrigger`

### D5：列表 Actions

- **Edit | 版本快照**（无 View）
- `ConsentFormViewModal` 不再从列表挂载

### D6：数据层（修订原 D6）

| 函数 | 变更 |
|------|------|
| `createEmptyConsentForm()` | **移除** `effectiveAcademicSession` |
| `validateConsentFormForm` Create | **不再**校验 effectiveAcademicSession |
| `createConsentForm` | `versions: []` |
| `addConsentFormVersion` | 增加 `applyImmediately`；按 D3 设 isApplied |

### D7：Mock 种子

- 12 行 `remark` 各不相同（英文 mock 句子即可）

## 风险与应对

| 风险 | 缓解 |
|------|------|
| Create 后快照为空，用户不知下一步 | 保存后可提示进入版本快照；空表仍显示「新增版本」 |
| 全部版本未应用时 lookup 失败 | 预期；下载端已有「联系管理员」 |
| 立即应用默认关，首版需多一步 | 产品明确要求；开关可手动打开 |

## 迁移说明

1. `ConsentFormFormModal` — 去掉学年学期，改 5 字段布局
2. `consentForms.js` — create 不写 versions；addVersion 读 applyImmediately
3. `ConsentFormVersionFormModal` — 增加 YnSwitch「是否立即应用」
4. `ConsentFormView` — 确认无 View（若已实现则仅 spec 对齐）
5. 更新 i18n `applyImmediately`

## 待决问题

（已关闭）

- Create 是否自动首版 → **否**
- 新增版本默认应用 → **否，除非用户打开立即应用**
