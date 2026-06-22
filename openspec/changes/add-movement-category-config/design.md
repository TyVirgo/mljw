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
