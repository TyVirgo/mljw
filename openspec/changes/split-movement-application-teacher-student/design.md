## Context

`split-movement-application-teacher-student` 首版已交付：双菜单、`applicantMode`、StudentSelectModal、学生本人列表与表单自动填充。四异动列表仍仅 **单行学号/姓名 keyword**；转专业另有 **进行中/已归档** Tab 分段。

产品要求列表检索对齐异动查询/维护字段，并区分 portal 在搜索与列上的差异。

## Goals / Non-Goals

**Goals:**

- 四异动 × 老师/学生：专业代码、申请学年学期、审批状态、是否实施 过滤
- 搜索 UI：两行 + 可收起（参考 `MovementQueryView`）
- 老师首行含学号或姓名；**学生首行隐藏**学号或姓名
- 转专业：移除进行中/已归档 Tab，**单列表展示全部**（含终态）
- 学生表格隐藏学号/姓名列；老师保留
- 共享 filter 模块，避免四 View 重复逻辑
- 表单首行：学号 \| 姓名 \| 选择（teacher，选择在行末）
- Section I 末字段：申请学年学期（`applicationSession`，create 自动带出，`YYYY/MM`）
- 申请 Form/Detail 与审批、维护、查询列表 `applicationSession` 格式一致

**Non-Goals:**

- 改 store 结构
- 新专业代码过滤
- 改 query/maintenance/approval 模块

## Decisions

### 1. 共享搜索模块 — `movementApplicationSearch.js`

```javascript
export function createEmptyApplicationSearch() {
  return {
    keyword: '',           // teacher only (UI hides for student)
    programmeCode: '',
    applicationSession: '',
    status: '',
    implemented: '',
  }
}

export function filterMovementApplications(sourceKey, items, search, t) {
  // keyword → studentId / fullName / name
  // programmeCode → extractCurrentProgrammeCode(sourceKey, item)
  // applicationSession → extractApplicationSession(item)
  // status → exact match (includes Draft)
  // implemented → resolve via normalizeQueueItem(...).implemented
}
```

各 View 过滤链：

```
items from store
  → filterMovementApplications(sourceKey, items, appliedSearch, t)
  → [student] filterByCurrentStudent(...)
  → pagination
```

**状态选项**：各类型 `*StatusOptions`（含 Draft），非 query 的 `movementQueryStatusOptions`。

**是否实施选项**：`'' | 'Pending' | 'Implemented' | '—'`（label 复用 `movementMaintenance.implemented.*`）

### 2. 搜索 UI 布局

对齐 `MovementQueryView`：

```
┌─ Row 1 ──────────────────────────────────────────────────────┐
│ [teacher: 学号或姓名] │ 专业代码 │ 申请学年学期 │ 审批状态 │ Q/R/收起 │
└──────────────────────────────────────────────────────────────┘
┌─ Row 2 (collapsible, default expanded) ──────────────────────┐
│ 是否实施                                                      │
└──────────────────────────────────────────────────────────────┘
```

- 引入 `list-page-search.css`（四 View 若尚未引入则添加）
- `searchExpanded` ref + Transition 与查询页一致
- 可选抽 `MovementApplicationSearchBar.vue`，props：`applicantMode`、`searchForm`、`appliedSearch` emit

### 3. 转专业 — 移除 active/archived Tab

删除：

- `listTab` ref
- `.filter-tabs` UI
- `filteredTransfers` 内 `isArchivedTransfer` 分段

**结果**：Draft / In Progress / 终态等同屏；终态通过审批状态下拉筛选。

### 4. 表格列 — `applicantMode`

四 View 表头/单元格：

```vue
<th v-if="applicantMode === 'teacher'">{{ t('...columns.studentId') }}</th>
<th v-if="applicantMode === 'teacher'">{{ t('...columns.name') }}</th>
```

动态 `colspan`：例如转专业 teacher 9 列 → student 7 列。

### 5. i18n

复用现有 key（优先）：

| 用途 | key |
|------|-----|
| 申请学年学期 | `movementQuery.search.academicSession` 或 `movementMaintenance.search.academicSession` |
| 是否实施 | `movementMaintenance.implemented.*` / `tr('Implemented')` |
| 专业代码 | `movementStatistics.columns.programmeCode` 或新增 `movementApplication.search.programmeCode` |

### 6. 与已实现首版的关系

首版 tasks §1–§6 已完成。本 design §7+ 为 **增量**，在现有四 View 上叠加，不 revert 双入口/选择器工作。

### 7. 表单 Section I — 学号 / 姓名 / 选择（行末）

**现状问题**：§11 实现将 `student-picker-row` 放在学号列内（input + 选择），视觉上「选择」按钮夹在学号与姓名中间，与产品图示不符。

**目标布局**（四异动统一）：

```
┌─ Section I 首行（span-2）────────────────────────────────────────────┐
│  学号 *                    │  姓名                  │  [选择] (teacher) │
│  [XMUM2309001        ]    │  [Tan Wei Ming    ]    │                   │
└────────────────────────────┴────────────────────────┴───────────────────┘
 student 模式：第三列无按钮；grid 为 1fr 1fr（或 1fr 1fr auto 隐藏末列）
```

**实现要点**：

- 首行使用 `form-field span-2`，内层 `.student-picker-row` 改为 `grid-template-columns: 1fr 1fr auto`
- 学号、姓名各为独立 label + readonly input（保持现有 `form.studentId` / `form.fullName` 绑定）
- teacher create：第三格渲染「选择」按钮；student / draft edit：不渲染按钮，末列不占位或 `grid-template-columns: 1fr 1fr`
- 更新 `movement-form.css`；四 `*FormModal.vue` 结构对齐

### 8. 只读字段置灰样式

**范围**：所有 `readonly` 的 profile / snapshot 带出字段，含：

| 异动 | 置灰字段（只读） |
|------|------------------|
| 转专业 | Section I 身份 + Section II Current Programme / Intake / School |
| 休学 | Section I 全部 + 申请日期 |
| 复学 | Section I 全部 + 申请日期 |
| 退学 | Section I 全部 + 申请日期 |

**不含**：Section II–IV 可编辑业务字段（email、reason、select、textarea、checkbox、file input）。

**样式 token**（四 modal 统一，可抽共享 CSS）：

```css
.form-control[readonly] {
  background: #f3f4f6;
  color: #6b7280;
  border-color: #e5e7eb;
  cursor: default;
}
.form-control:not([readonly]) {
  background: #fff;
  color: #111827;
}
```

可选：新建 `src/styles/movement-form.css` 供四 FormModal import，避免四处复制。

### 9. 移除模拟过期 mock

**删除面**：

| 位置 | 动作 |
|------|------|
| `ProgrammeTransferView.vue` | 删按钮、`requestExpire`、`canSimulateExpire`、`expireApplication` import |
| `programmeTransfers.js` | 删 `expireApplication` 导出函数 |
| `i18n` zh/en | 删 `programmeTransfer.actions.simulateExpire`、`programmeTransfer.expireOne`（若无其他引用） |

**保留**：`isTransferExpired` 及与业务期限相关的只读展示/校验（与手动 mock 过期无关）。

### 10. Section I — 申请学年学期（applicationSession）

**字段定义**：

| 属性 | 值 |
|------|-----|
| 数据 key | `applicationSession` |
| UI label | 申请学年学期（`movementCommon.fields.applicationAcademicSession` 或统一复用 key） |
| 格式 | `YYYY/MM`（复用 `formatAcademicSession(year, semester)`） |
| 可编辑 | 否（readonly + 置灰） |
| 位置 | Section I **最后一个字段** |

**自动带出**：

```javascript
// src/data/semesterInfo.js 或 src/data/movementApplicationSession.js
export function getCurrentApplicationSession(records = initialSemesterRecords) {
  const current = records.find((r) => r.currentSemester === 'Yes')
  return current ? formatAcademicSession(current.academicYear, current.semester) : ''
}
```

- **create 打开**：`createEmpty*` 或 modal watch 写入 `applicationSession`
- **Draft 编辑**：保留 record 已有值，不刷新
- **saveDraft / submit**：随 form payload 持久化到 store

**与转专业 startSemester 边界**：`applicationSession` 为系统当前申请学期快照；Section II `startSemester` 为用户业务选择，二者独立。

**跨模块一致**：

| 触点 | 展示 |
|------|------|
| 申请 FormModal Section I | `form.applicationSession` readonly |
| 申请 DetailModal Section I | `item.applicationSession \|\| '—'` |
| 审批列表 / ReviewView（DetailModal） | 同上 |
| 维护 / 查询列表 | 已有 `normalizeQueueItem.applicationSession` |

**extract 回退链调整**：`extractApplicationSession` 优先 `item.applicationSession`；不应将 `dateOfApplication`（日期格式）或转专业 `startSemester` 作为 Section I 展示回退。列表层可保留 `intake` 等 mock 兼容回退，但新创建记录必须写入 `applicationSession`。

### 11. i18n — 申请学年学期 label 统一

| 用途 | key（建议） |
|------|-------------|
| Section I 字段 | `movementCommon.fields.applicationAcademicSession` → zh: 申请学年学期 |
| 列表列（可选对齐） | 复用同一 key 或保留 `movementApproval.columns.applicationSession` 并改为「申请学年学期」 |

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 四 View 搜索模板重复 | 共享 `movementApplicationSearch.js` + 可选 SearchBar 组件 |
| programmeCode 为推导值 | 与 maintenance/query 同一 extract 函数，mock 一致 |
| 首行字段过多 | 两行 + 收起；CSS 与 query 页对齐 |
| 四 FormModal 样式重复 | 可选共享 `movement-form.css` |
| 删 expireApplication 影响 seed 演示 | 列表不再提供手动过期；Expired 态仍可通过 seed 或审批流到达 |
| 旧 seed 缺 applicationSession | Detail/列表回退 `extractApplicationSession`；可选批量补 seed |
| 选择按钮行末布局 | 四 modal + 共享 CSS 一次改齐，避免逐文件样式漂移 |

## Migration Plan

1. 新建 `movementApplicationSearch.js`
2. （可选）新建 `MovementApplicationSearchBar.vue`
3. 更新四 View：搜索 UI + filter + 学生列
4. `ProgrammeTransferView`：删 Tab + 全量列表
5. i18n 补齐
6. 冒烟 + `npm run build`
7. **§11 增量**：四 FormModal 学号/姓名分框 + 只读置灰；删模拟过期 + `expireApplication`
8. **§13 增量**：选择按钮移至学号+姓名行末；更新 `movement-form.css`
9. **§14 增量**：`getCurrentApplicationSession` + 四 data `createEmpty*` + 四 FormModal/DetailModal Section I 末字段
10. **§15**：冒烟 + `npm run build`

## Open Questions

（均已确认，无遗留）

- 转专业默认全部含终态 ✓
- 当前专业代码 ✓
- 学生隐藏学号/姓名搜索 ✓
- 两行可收起 ✓
- 选择按钮位于学号+姓名行末 ✓
- 申请学年学期 create 时冻结 ✓

### 16. §16 申请学年学期 — 选学生后 intake

**撤销 §10/§14 create 预填系统学期**；改为选学生后写入 **`enrollment.intake`**。

```javascript
// src/data/movementApplicationSession.js
export function resolveApplicationSessionFromStudent(student) {
  const intake = student?.enrollment?.intake || student?.intake || ''
  const trimmed = String(intake).trim()
  return /^\d{4}\/\d{2}$/.test(trimmed) ? trimmed : ''
}
```

**createEmpty*（四 Tab data）：**

```javascript
applicationSession: '',  // 不再 getCurrentApplicationSession()
```

**buildStudentSnapshotFromProfile（四 Tab 或抽公共）：**

```javascript
return {
  // ...existing snapshot fields
  applicationSession: resolveApplicationSessionFromStudent(student),
}
```

**FormModal 展示：**

```vue
<input :value="form.applicationSession || '—'" readonly />
```

**学生端 create：** `applicantMode=student` 打开时 `applyStudentProfile(getCurrentStudent())` → intake 同步写入。

**Draft 编辑：** 保留 record.applicationSession；不调用 resolve 覆盖。

**与 unify-movement-date-format 边界：** `applicationSession` 为 `YYYY/MM` 学年学期，不走 `formatMovementDate`。

---

## §23 搜索按钮样式 + 管理端菜单改名

### 33. 根因

```
style.css          button { border:none; background:none }  ← 全局 strip
list-page-search   仅定义 .btn-text，无 .btn-primary/.btn-default
MovementApplicationSearchBar  已写 class="btn btn-primary" 但无样式 → 文字按钮
MovementCategoryView        scoped 内定义 .btn-*              → 正常蓝/白按钮
```

### 34. CSS 修复（推荐）

在 `list-page-search.css` 追加（与 `MovementCategoryView` 一致）：

```css
.search-bar .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 14px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}
.search-bar .btn-primary {
  border: none;
  background: #2563eb;
  color: #fff;
}
.search-bar .btn-default {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
}
```

`.search-bar .btn-text` 保持现有文字链，不受影响。

### 35. 菜单文案

```javascript
// zh.js
srMovementApplicationTeacher: '学籍异动申请（管理端）',
// en.js
srMovementApplicationTeacher: 'Status Change Application (Management)',
```

`pageId`: `sr-movement-application-teacher` 不变；`applicantMode: 'teacher'` 不变。

### 36. Migration（§23）

1. `list-page-search.css` + i18n
2. 冒烟：管理端/学生端 → 四 Tab 搜索区查询蓝钮、重置描边钮；侧边栏与面包屑「管理端」
3. `npm run build`

## Risks / Trade-offs（§23）

| 风险 | 缓解 |
|------|------|
| 其他引用 list-page-search 的页面按钮变实心 | 限定 `.search-bar` 前缀；与异动类别目标一致 |
| 历史文档仍写「老师」 | OpenSpec §23 标注；PRD 脚本另开任务 |
