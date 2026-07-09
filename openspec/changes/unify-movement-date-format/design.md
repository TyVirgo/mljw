## 背景说明

异动模块各 data 文件各自实现 `format*ListDate` / `formatApplicationDateDisplay`，使用 `DD MMM YYYY`（如 `15 Oct 2023`）。审批 log 写入 `formatDefermentDateTime` 等 `DD.MM.YYYY HH:mm`。维护 `movementDate` mock 已为 `YYYY-MM-DD`，但申请/审批列表不一致。

## 目标 / 非目标

**目标：**

- 单一 helper `formatMovementDate(value)` → `YYYY-MM-DD` 或 `—` / 空
- 异动全链路**展示**统一；Export 同步
- approvalLog 新写入与展示均为 `YYYY-MM-DD`
- 兼容解析 ISO、现有 `YYYY-MM-DD` mock、可解析的旧 `DD MMM YYYY` seed（formatter 内 fallback）

**非目标：**

- 改 `applicationSession`（`YYYY/MM`）
- 学生档案、非异动模块
- DatePicker 输入 UX
- 强制迁移全部 mock seed（formatter 兼容即可）

## 设计决策

### 1. Helper — `src/utils/formatMovementDate.js`

```javascript
export function formatMovementDate(value) {
  if (value === '' || value == null) return '—'
  // ISO YYYY-MM-DD passthrough
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value).trim())) return value.trim()
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toISOString().slice(0, 10)
}

export function formatMovementDateOrEmpty(value) {
  const formatted = formatMovementDate(value)
  return formatted === '—' ? '' : formatted
}
```

**Log 写入：**

```javascript
// movementApprovalEngine formatDateTime → formatMovementDate(new Date())
// 或 toISOString().slice(0, 10)
```

**字符串比较：** `YYYY-MM-DD` 字典序可用于 `entry.dateTime >= cycleStart`（现有 engine 逻辑）。

### 2. 替换 map

| 现函数 | 文件 | 动作 |
|--------|------|------|
| `formatApplicationDateDisplay` | deferments, withdrawals, resumptions | 委托 `formatMovementDate` |
| `formatDefermentListDate` | deferments.js | 委托 |
| `formatTransferListDate` | programmeTransfers.js | 委托 |
| `formatWithdrawalListDate` | withdrawals.js | 委托 |
| `formatResumptionListDate` | resumptions.js | 委托 |
| `formatApprovalApplicationDate` | movementApprovalQueue.js | 各 case 委托 |
| `formatMovementDateDisplay` | movementMaintenanceFields.js | 委托 |
| `ApprovalLogModal` `item.dateTime` | 组件 | `formatMovementDate(item.dateTime)` |
| Export formatters | export*Excel.js | 日期列走 helper |

### 3. 触点清单

```
申请列表 date column     ─┐
Form/Detail 只读日期      ─┤
审批 Application Date    ─┼── formatMovementDate()
维护/查询 movementDate   ─┤
Export 日期列            ─┤
ApprovalLogModal         ─┘
```

### 4. 与 §16 applicationSession 边界

| 字段 | 格式 | Helper |
|------|------|--------|
| `applicationSession` | `YYYY/MM` | `resolveApplicationSessionFromStudent` / 原值 |
| `dateOfApplication`, `movementDate`, log `dateTime` | `YYYY-MM-DD` | `formatMovementDate` |

## 风险与应对

| 风险 | 缓解 |
|------|------|
| 旧 mock log 非 ISO | formatter 用 `new Date(value)` 尽量解析 |
| 四 data 文件重复 wrapper | 保留 thin wrapper 导出名，内部一行 delegate |
| 与 refine-movement-approval spec「同申请列表 formatter」 | 统一后四 Tab + 审批同源 helper，spec 仍成立 |

## 迁移说明

1. 新增 `formatMovementDate.js`
2. 替换四 Tab format 函数 + approval queue + maintenance
3. 更新 FormModal/DetailModal computed 展示
4. approval engine log 写入 + ApprovalLogModal
5. Export formatters
6. 冒烟 + `npm run build`

---

## §17 Section VII 申请侧置灰

### 触点

仅 `ProgrammeTransferFormModal.vue`（Create / Edit / Resubmit 共用同一模板）。

### UI

```html
<!-- Section VII 容器加 class，如 section-seven-readonly -->
<select ... disabled class="form-control is-readonly">
<DatePickerEn ... disabled />
```

- 样式：与 Section I 只读字段一致（灰底 / 不可聚焦）
- **不**在 DetailModal、ReviewView、MovementApprovalModal 改动

### 数据

- createEmpty 保持 `adminNewProgramme/Intake/Date` 为空
- Submit / Save Draft payload **不包含**用户修改的 Section VII（disabled 下 v-model 不应变更；双保险可在 prepare 时 strip）
- 审批仍用 `newProgrammeFirstChoice` 回退 + seed

### 与旧 Phase 2 spec 关系

`add-programme-transfer-app`「Create 可编辑 Section VII」→ 本增量 **MODIFIED** 为「可见 disabled」。

---

## §18 effectiveSession 统一 YYYY/MM

### Helper — `formatEffectiveSession(value)`

```javascript
export function formatEffectiveSession(value) {
  if (value === '' || value == null) return '—'
  const s = String(value).trim()
  if (s === '—') return '—'
  if (/^\d{4}\/\d{2}$/.test(s)) return s
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m] = s.split('-')
    return `${y}/${m}`
  }
  // fallback: try Date parse → YYYY/MM
  const date = new Date(s)
  if (!Number.isNaN(date.getTime())) {
    const y = date.getUTCFullYear()
    const m = String(date.getUTCMonth() + 1).padStart(2, '0')
    return `${y}/${m}`
  }
  return s
}
```

### 替换 map

| 位置 | 动作 |
|------|------|
| `extractEffectiveSession` 返回值 | 经 `formatEffectiveSession` |
| 审批 / 维护 / 查询列表 `item.effectiveSession` | normalize 层已格式化 |
| Export effectiveSession 列 | 同 formatter |

### 与 formatMovementDate 边界

| 字段/列 | 格式 | Helper |
|---------|------|--------|
| `applicationSession` | `YYYY/MM` | 原值 / intake |
| `effectiveSession` | `YYYY/MM` | `formatEffectiveSession` |
| `movementDate`, 申请日期, log | `dd.Mmm.YYYY` 展示；log 新写入 ISO | `formatMovementDate` / `formatMovementDateIso` |

退学 `lastDateOfAttendance` 仅在 **异动日期** 列展示 `dd.Mmm.YYYY`；**生效学期** 列展示派生 `2025/09`。

---

## §19 展示格式 dd.Mmm.YYYY

### Helper 更新

```javascript
// formatMovementDate(value) → '29.Sep.2025' | '—'
// formatMovementDateIso(value) → '2025-09-29'（存储 / engine 比较）
// parseMovementDate(value) → Date | null（兼容 ISO、DD.MM.YYYY HH:mm、DD MMM YYYY）
```

**展示 vs 存储：**

| 用途 | 格式 | 函数 |
|------|------|------|
| 列表 / Form / Detail / Export / Log 展示 | `dd.Mmm.YYYY` | `formatMovementDate` |
| approval engine 新 log 写入 | `YYYY-MM-DD` | `formatMovementDateIso` |
| seed 旧 log `15.09.2025 10:00` | 展示时 parse → `15.Sep.2025` | `formatMovementDate` |

**字符串比较：** engine `entry.dateTime >= cycleStart` 仍依赖 ISO 存储；旧 seed 非 ISO 时现有 fallback 逻辑保留。

---

## §20 normalizeAcademicSession

### Helper — `src/utils/normalizeAcademicSession.js`

- 合法码：`02 | 04 | 09`（复用 `semesterCodeOptions`）
- 非法 `YYYY/MM` 或 ISO 日期：按日历月 snap 到学期码
- `compareAcademicSession` / `validateAcademicSessionOrder` 用于列表与表单

### extractApplicationSession（修订）

```
applicationSession → intake → originalIntake
（移除 dateOfApplication、startSemester）
```
