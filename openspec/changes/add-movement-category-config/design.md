## Context

`add-movement-category-config` 首版已实现 `MovementCategoryView` + 表单/原因 CRUD + 6 条 mock，且 **Non-goal** 为不读写申请 store。`add-movement-approval-app`、`add-movement-maintenance` 已落地：`Approved` 后默认 `implemented: 'Pending'`，维护页手动「实施」→ `Implemented`。

产品图示1 要求弹框新增三个开关，并将类别配置作为**实施策略**供审批/维护消费。

## Goals / Non-Goals

**Goals:**

- 弹框新增 `modifyStudentStatus`、`modifyStudentType`、`autoImplement` 三个开关（默认 false）
- 数据模型、normalize、Create/Edit 持久化三字段
- `resolveMovementCategoryConfig(sourceKey, studentCategory)` lookup
- 审批最终 Approved 时按 `autoImplement` 设置初始 `implemented`
- 维护页：自动实施行仍列表可见；仅 Pending 可点「实施」
- 实施时按 modify 开关 mock 回写 `students.js`（轻量）
- Mock 扩展至 **12 条**（补 WDR001、RES001 各 ×3）

**Non-Goals:**

- 申请四 Tab 表单改读类别/原因配置
- 取消实施
- 维护列表展示三开关列
- 真实后端、vue-router

## Decisions

### 1. 数据模型扩展 — `movementCategories.js`

```javascript
{
  // ...existing fields...
  modifyStudentStatus: boolean,   // default false
  modifyStudentType: boolean,     // default false
  autoImplement: boolean,         // default false
}
```

**语义区分（重要）**

| 现有字段 | 配置维度 | 新增开关 | 行为维度 |
|---------|---------|---------|---------|
| `studentStatus` | 该类别所属学籍状态轨道 | `modifyStudentStatus` | 实施时是否改档案状态 |
| `studentType` | 该行适用的学生类型 | `modifyStudentType` | 实施时是否改档案类型 |
| — | — | `autoImplement` | 审批通过后是否跳过 Pending |

### 2. Mock 种子（12 条）

| categoryCode | categoryName | studentStatus | category | 行数 | 演示开关建议 |
|--------------|--------------|---------------|----------|------|-------------|
| PT001 | Programme Transfer | Active | Programme Transfer | ×3 | modifyStatus false；auto false |
| DEF001 | Deferment | Deferment | Normal | ×3 | modifyStatus **true**；auto false |
| WDR001 | Withdrawal | Withdrawal | Normal | ×3 | modifyStatus **true**；auto **false**（全 manual） |
| RES001 | Resumption | Active | Normal | ×3 | modifyStatus **true**；Local auto **true**，其余 false |

`nextCategoryId` 从 7 起为 WDR/RES 分配 id 7–12。

### 3. Lookup — `resolveMovementCategoryConfig(sourceKey, studentCategory)`

```javascript
const SOURCE_TO_CODE = {
  'programme-transfer': 'PT001',
  deferment: 'DEF001',
  withdrawal: 'WDR001',
  resumption: 'RES001',
}

function mapStudentType(studentCategory) {
  if (studentCategory === 'China') return 'Chinese'
  return studentCategory || 'Local'
}

// Returns category row or null → caller uses defaults (all false, Pending)
```

### 4. 审批引擎钩子 — `movementApprovalEngine.js`

在 `applyMovementDecision` 最终 `status: 'Approved'` 分支：

```javascript
const config = resolveMovementCategoryConfig(sourceKey, inferStudentCategory(updated))
const auto = config?.autoImplement === true
updated.implemented = auto ? 'Implemented' : (updated.implemented || 'Pending')
```

中间阶段 Approved 不触达维护状态。

### 5. 维护 / 实施 — `movementMaintenanceFields.js`

`implementMaintenanceRecords(rows)` 及自动实施路径共用 `applyImplementationEffect(row)`：

1. 设 `implemented: 'Implemented'`（若尚未）
2. lookup config；若 `modifyStudentStatus` → 更新 `students.js` enrollment.status（mock 映射）
3. 若 `modifyStudentType` → 更新 `students.js` studentCategory

**无取消实施**：Implemented 为终态。

自动实施记录在审批通过时已为 Implemented → **仍进入** `mergeMovementMaintenanceQueue`（filter Approved），维护页「实施」按钮已因 `canImplement` 排除。

### 6. UI — `MovementCategoryFormModal.vue`

在双列 grid 下方增加第三组（全宽三行），每行含开关 + 功能说明：

```
修改学籍状态    [switch]  开启后，表示该异动会修改学生档案的学籍状态。
修改学籍类型    [switch]  开启后，表示该异动会修改学生档案的学籍类型。
是否自动实施    [switch]  开启后，该异动审批通过后将自动标记为已实施。
```

- 复用 `YnSwitch`；说明文案放在开关**右侧同一行**（`field-hint`）
- Create 默认三开关均为 false
- 列表页**不**新增三列（配置仅在 Edit 弹框可见）

### 7. i18n

`movementCategory.fields.*` 含 `modifyStudentStatusHint`、`modifyStudentTypeHint`、`autoImplementHint`。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 与首版 Non-goal「不联动申请」冲突 | proposal 明确为**增量扩展**；lookup 只读配置 |
| lookup 找不到配置 | fallback：三开关 false，Pending |
| 学籍状态枚举不一致（类别 vs students） | mock 映射表写在 implementation helper |
| 12 行列表分页 | 仍用现有分页，pageSize 10 |

## Migration Plan

1. 扩展 `movementCategories.js` + 6 条新种子 + lookup
2. 表单 Modal 三开关 + i18n
3. 审批引擎接 `autoImplement`
4. 实施 helper 接 modify 开关（mock 回写 students）
5. 冒烟：RES Local 自动实施、WDR manual、维护列表均可见
6. `npm run build`

## Open Questions

- modify 回写目标字段与类别 `studentStatus` 是否 1:1 映射：mock 阶段用简化映射表即可
- 后续申请记录是否加 `categoryCode`：本期仍 sourceKey 硬映射

---

## 增量修订（§12+ 表单 IA + 移除 Student Type）

首版 + §8–§11 已交付。本节为 **布局与数据模型降维**，不 revert 原因 CRUD / 审批维护流水线。

### 8. 表单布局 — `MovementCategoryFormModal.vue`

**删除**：底部 `.switch-section` 独立三行。

**Row 2 — 图示2 风格（学籍状态 / 类别各一列）**

```
┌ field-with-switch ──────────────────────────────┐
│  * 学籍状态              修改学籍状态 [YnSwitch] │
│  [ select 全宽 ]                                 │
│  hint：开启后，表示该异动会修改学生档案的学籍状态。│
└──────────────────────────────────────────────────┘
```

- 新增 `.field-header`（label 左、开关+短 label 右）、`.field-hint`（select 下方）
- **类别** 列同理，开关绑定 `modifyStudentType`

**Row 3 — 图示1 第三行两列**

| 左列 | 右列 |
|------|------|
| 是否自动实施 + 右对齐 YnSwitch | 允许学生申请 radio |
| hint 在开关行下方 | — |

**删除**：学生类型 `select` 及关联 script/校验。

### 9. 数据模型 — 移除 `studentType`

```javascript
// normalizeRow — 删除 studentType
{
  categoryCode, categoryName, studentStatus, category,
  allowStudentApply, modifyStudentStatus, modifyStudentType, autoImplement, reasons
}
```

**`trackCategoryOptions`**：

```javascript
export const trackCategoryOptions = [
  ...new Set(Object.values(studentStatusCategoryMap).flat()),
]
```

表单 Category 下拉：`v-for="opt in trackCategoryOptions"`，**无** `@change` 清空、**无** disabled。

**校验**：

- 删除 `studentType` 必填
- 删除 category 与 studentStatus 组合合法性检查
- 唯一性：`isDuplicateCode(categoryCode)` 替代 `isDuplicateCodeAndType`

### 10. Mock 种子（4 行）

| id | categoryCode | studentStatus | category | autoImplement | 备注 |
|----|--------------|---------------|----------|---------------|------|
| 1 | PT001 | Active | Programme Transfer | false | |
| 2 | DEF001 | Deferment | Normal | false | modifyStatus true |
| 3 | WDR001 | Withdrawal | Normal | false | modifyStatus true |
| 4 | RES001 | Active | Normal | **true** | 演示自动实施 |

`nextCategoryId` 从 5 起。

### 11. Lookup 简化

```javascript
export function resolveMovementCategoryConfig(sourceKey, _studentCategory) {
  const categoryCode = MOVEMENT_SOURCE_TO_CATEGORY_CODE[sourceKey]
  if (!categoryCode) return null
  return movementCategories.value.find((row) => row.categoryCode === categoryCode) || null
}
```

- 删除 `mapStudentCategoryToConfigType` 在 lookup 中的使用
- 审批/维护调用点签名可不变，第二参数忽略

### 12. 实施回写 — `students.js`

```javascript
if (categoryConfig.modifyStudentType && categoryConfig.category) {
  // mock：写入 enrollment 或预留 trackCategory 字段；首版可用 enrollment.remark 或文档化 no-op 映射
  patch.enrollment = { ...current.enrollment, trackCategory: categoryConfig.category }
}
```

若学生档案尚无 `trackCategory` 字段，design 允许 mock 阶段写入 `enrollment` 扩展字段或仅持久化开关、回写留 TODO。**proposal 决策**：写入 `enrollment.trackCategory`（normalize 时可选字段）。

### 13. 列表与原因弹窗

- `MovementCategoryView`：删除 Student Type 列
- `MovementCategoryReasonModal`：副标题 `code · name`（去掉 studentType）

## Risks / Trade-offs（增量）

| 风险 | 缓解 |
|------|------|
| localStorage 残留 12 行旧数据 | 开发环境清 storage 或 migration 按 code 去重 |
| 旧 spec 与 12 行 seed 冲突 | 本 change spec delta MODIFIED/REMOVED |
| modifyStudentType 档案字段缺失 | mock 用 enrollment.trackCategory |

## Migration Plan（增量）

1. `movementCategories.js` 模型 + 4 seed + lookup + validate
2. FormModal 布局重构
3. View / ReasonModal 去列
4. `students.js` 回写语义
5. 冒烟 + build
6. 清 mock localStorage 或文档说明

## Open Questions（增量）

（均已确认）

- 去掉 Student Type ✓
- 类别全量下拉 ✓
- 列表同步删列 ✓
- autoImplement Row3 左列布局 ✓

---

## §15 表单标签列对齐

### 14. 标签列与 Row1 统一

**DOM 结构（学籍状态示例）**

```html
<div class="form-field">
  <label class="field-label required">{{ t('...studentStatus') }}:</label>
  <div class="field-control field-control-stacked">
    <select class="control-input" />
    <div class="field-switch-row">
      <span class="switch-label">{{ t('...modifyStudentStatus') }}</span>
      <YnSwitch v-model="form.modifyStudentStatus" />
    </div>
    <p class="field-hint">...</p>
  </div>
</div>
```

**是否自动实施**

```html
<div class="form-field">
  <label class="field-label">{{ t('...autoImplement') }}:</label>
  <div class="field-control field-control-stacked">
    <div class="switch-value-row">
      <YnSwitch v-model="form.autoImplement" />
    </div>
    <p class="field-hint">...</p>
  </div>
</div>
```

**CSS**

```css
.field-switch-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
.switch-value-row {
  display: flex;
  align-items: center;
  min-height: 32px;
}
```

**删除**：`field-label--spacer`、`inline-label`、含主字段名的 `field-header`

### 15. Migration（§15）

1. 调整 `MovementCategoryFormModal.vue` 模板/CSS
2. 视觉对照 Row1 与 Row2/3 标签列对齐
3. `npm run build`

## Risks / Trade-offs（§15）

| 风险 | 缓解 |
|------|------|
| 双列 grid 内 label 列宽不一致 | 全部复用同一 `.field-label { width: 132px }` |
| switch 行挤占垂直空间 | 仅学籍状态/类别增加一行 switch-row，可接受 |

---

## §16 modify 开关独立行

### 16. DOM 结构（修改学籍状态 — 独立行）

```html
<!-- Row2: select only -->
<div class="form-field">
  <label class="field-label required">…studentStatus:</label>
  <div class="field-control">
    <select class="control-input" />
  </div>
</div>

<!-- Row3: modify switch -->
<div class="form-field">
  <label class="field-label">…modifyStudentStatus:</label>
  <div class="field-control field-control-stacked">
    <div class="switch-value-row">
      <YnSwitch v-model="form.modifyStudentStatus" />
    </div>
    <p class="field-hint">…modifyStudentStatusHint</p>
  </div>
</div>
```

类别列「修改学籍类型」同理。

**删除**：select 列内 `field-switch-row`、`.field-switch-row` CSS（若无其它引用）

### 17. Migration（§16）

1. 拆分 `MovementCategoryFormModal.vue` 为 5 行 grid（Row1–Row4 见 proposal）
2. 视觉对照图示1
3. `npm run build`

## Risks / Trade-offs（§16）

| 风险 | 缓解 |
|------|------|
| 表单行数增加 | 仅 +1 行 grid，可接受 |
| §15 spec 与 §16 冲突 | 更新 spec delta Switches scenario |

---

## §17 原因数据源同步

### 18. Helpers — `movementCategories.js`

```javascript
export function getReasonOptionsBySourceKey(sourceKey) {
  const code = MOVEMENT_SOURCE_TO_CATEGORY_CODE[sourceKey]
  if (!code) return []
  const row = movementCategories.value.find((r) => r.categoryCode === code)
  return row?.reasons ?? []
}

export function resolveReasonLabel(categoryCode, reasonId) {
  const row = movementCategories.value.find((r) => r.categoryCode === categoryCode)
  const reason = row?.reasons?.find((r) => r.id === reasonId)
  return reason?.reasonName ?? ''
}
```

### 19. 申请表单接入

```javascript
// DefermentFormModal.vue
import { getReasonOptionsBySourceKey } from '../../data/movementCategories.js'
const reasonOptions = computed(() => getReasonOptionsBySourceKey('deferment'))
// v-for="opt in reasonOptions" :value="opt.id" → form.reasonId
```

PT：`transferReason` 字段改为 `reasonId` + select（或保留 transferReason 作 detailed 说明 — **proposal 决策**：仅 reasonId select，详细说明仍用既有 detailedReason 若存在）。

### 20. 队列展示

```javascript
// movementApprovalQueue.js — extractMovementReason
case 'deferment':
  return resolveReasonLabel('DEF001', item.reasonId) || getDefermentReasonLabel(item.mainReason, t) || '—'
```

fallback 保留至存量 seed 全部映射完成。

### 21. Seed reasons + nextReasonId

- DEF001 reasons id 1–5，WDR001 id 6–10，PT001 id 11–14
- `nextReasonId` 从 15 起
- normalize 申请记录：`reasonId = resolveReasonIdByName(code, item.mainReason || item.transferReason)`

### 22. Migration（§17）

1. movementCategories seed + helpers
2. 三业务 data 文件 reasonId + 映射
3. 三 FormModal + DetailModal
4. movementApprovalQueue
5. 冒烟 + build

## Risks / Trade-offs（§17）

| 风险 | 缓解 |
|------|------|
| localStorage 旧类别无 reasons | seed 写入 initial；或 migration 合并 |
| PT textarea 改 select 丢自由文本 | seed 覆盖常见项；detailedReason 保留 |
| 改名后历史 reasonId 仍有效 | 存 id 不存 name |
| deferment/withdrawal i18n 表冗余 | 展示改 reasonName，i18n 表可 deprecate |

---

## §19 本阶段屏蔽类别新增/删除

### 23. 列表 IA

```
搜索区
  ↓（无 toolbar）
表格：序号 | 代码 | 名称 | 学籍状态 | Category | 编辑 | 设置原因
分页
```

- 勾选列移除：`selectedIds` / 批量 Delete / `ConfirmDialog` 从 View 卸载
- `openCreate` 无 UI 入口；`formMode` 恒为 `edit`

### 24. 编辑表单

```html
<input v-model="form.categoryCode" :readonly="isEditMode" :disabled="isEditMode" />
```

类别代码只读；名称、学籍状态、Category、三开关、允许学生申请仍可改。

### 25. Migration（§19）

1. 更新 `movement-category-config` spec delta
2. `MovementCategoryView.vue` + `MovementCategoryFormModal.vue`
3. 冒烟：4 行 seed 可见；无新增/删除；Edit + Set Reason 可用；build 通过

## Risks / Trade-offs（§19）

| 风险 | 缓解 |
|------|------|
| 后续开放 Create 需恢复 UI | data 层 CRUD 保留；spec 标 deferred |
| 用户误改类别名称 | 代码只读；名称仍可编辑 |

---

## §20 编辑弹框布局与转专业选课选项

### 26. 表单 IA（Edit）

```
Row1  类别编码(RO) | 类别名称
Row2  修改学籍状态 [YnSwitch + hint] | 修改学籍类型 [YnSwitch + hint]
Row3  学籍状态 [select] | 类别 [select]
Row4  是否自动实施 [YnSwitch + hint] | 允许学生申请 [radio Y/N]
Row5  [四类 Edit] 处理选课 — 标签与首 checkbox 同行；后两项缩进（§21–§22）
```

开关与下拉 **对调** 后：用户先看到「是否修改」决策，再看到目标值下拉。

### 27. 开关—下拉联动

```js
:disabled="form.modifyStudentStatus"   // studentStatus select
:disabled="form.modifyStudentType"     // category select
```

- ON = 该异动会修改对应档案字段 → 下拉 **锁定** 当前配置值（防误改）
- OFF = 下拉可编辑
- 校验不变：`studentStatus`、`category` 保存前仍 required

### 28. PT001 选课字段

```js
// movementCategories row（四类均可持久化；§22 起 UI 均展示）
deleteOriginalCourseList: boolean
presetNewProgrammeBatchList: boolean
excludeGradedFromPreset: boolean  // §21: independent; no dependency on presetNewProgrammeBatchList
```

~~§20 watch 已废弃（§21）~~ — 三项 checkbox 无级联。

- 展示条件：Edit 弹框 **恒展示**（§22；移除 `categoryCode === 'PT001'` 判断）
- 本阶段：存 mock 配置；实施/审批流程 **不** 调用选课 API

### 29. Migration（§20）

1. 更新 `movement-category-config` spec delta（§20）
2. `MovementCategoryFormModal.vue` + `movementCategories.js` + i18n
3. PT001 seed 可预勾一项供演示
4. 冒烟：DEF001 开关 ON 时学籍状态下拉 disabled；PT001 见选课区；build 通过

## Risks / Trade-offs（§20）

| 风险 | 缓解 |
|------|------|
| 开关 ON 后用户想改下拉 | 先关开关再改值再开 |
| 非 PT001 存了选课字段 | §22 起 UI 均展示；normalize 默认 false |
| 后续接 API | 字段名与 spec 对齐，实施阶段再读 config |

---

## §21 处理选课区 UI 修正

### 30. 撤销 §28 选项联动

§20 曾规定 `excludeGradedFromPreset` 依赖 `presetNewProgrammeBatchList`。产品确认 **三项独立**，用户按需勾选即可。

**删除：**

```js
// 不再使用
watch(() => form.presetNewProgrammeBatchList, ...)
:disabled="!form.presetNewProgrammeBatchList"  // excludeGradedFromPreset
```

保存时三个 boolean 原样持久化，不做组合校验。

### 31. 选课区布局（Edit 弹框，§21 起）

不再使用「左 `field-label` 列 + 右 `field-control-stacked` 三行」导致标签相对整组居中。

```
┌─ course-handling-block (grid-column: 1 / -1) ─────────────────┐
│  [处理选课:] [☐ 删除原课程名单…]     ← course-handling-first-row │
│              [☐ 预置新专业批次名单]   ← course-handling-follow-rows│
│              [☐ 已获得成绩…不预置…]                              │
└───────────────────────────────────────────────────────────────┘
```

- 首行：`flex` + `align-items: center` — 标签宽 132px、右对齐，与弹框其他行 label 一致
- 后续行：`padding-left` 或 `margin-left` = 132px + 8px（与首行 checkbox 左缘对齐）
- 字号：标签与 checkbox 文案均为 **13px** / `#374151`（与 `.field-label`、`.radio-item` 一致）

### 32. Migration（§21）

1. 更新 spec：移除 exclude-depends-preset 场景；新增独立选择与首行对齐场景
2. `MovementCategoryFormModal.vue` — 移除 watch/disabled；CSS/markup 按 §31
3. 冒烟：PT001 三项可任意勾选；标签与首项同行；字号一致；build 通过

## Risks / Trade-offs（§21）

| 风险 | 缓解 |
|------|------|
| #3 勾选但 #2 未勾选时业务语义模糊 | mock 阶段允许；接 API 时由后端/实施模块解释组合 |
| 与 §20 文档表述冲突 | §21 明确 supersede §20 联动条款 |

---

## §22 处理选课扩展至四类异动

### 33. 展示条件

§20–§21 限定 `form.categoryCode === 'PT001'`。产品确认四类固定 seed **结构一致**，Edit 弹框 Row5 始终展示。

```diff
- const isProgrammeTransfer = computed(() => form.value.categoryCode === 'PT001')
- <div v-if="isProgrammeTransfer" class="course-handling-block">
+ <div class="course-handling-block">
```

布局/CSS 沿用 §31，无 PT 专用分支。

### 34. Seed 默认值

| code | deleteOriginal | presetBatch | excludeGraded |
|------|----------------|-------------|---------------|
| PT001 | true（demo） | true | true |
| DEF001 | false | false | false |
| WDR001 | false | false | false |
| RES001 | false | false | false |

`normalizeRow` 已支持；seed 可显式写出便于阅读。

### 35. Migration（§22）

1. spec MODIFIED：选课 Requirement 覆盖四类；REMOVED PT001-only 场景
2. `MovementCategoryFormModal.vue` — 移除 PT 条件
3. `movementCategories.js` — 非 PT seed 补三字段（可选）
4. 冒烟：四类 Edit 均见选课区；DEF/WDR/RES 默认未勾选；build 通过

## Risks / Trade-offs（§22）

| 风险 | 缓解 |
|------|------|
| 休学/退学文案含「新专业批次」略偏 PT | 产品确认四类共用文案；接 API 时可再拆分 i18n |
| localStorage 旧 DEF/WDR/RES 无三字段 | normalizeRow 默认 false |
