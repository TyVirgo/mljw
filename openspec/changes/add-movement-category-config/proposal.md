## Why

学籍异动「异动类别」配置页（`sr-movement-category`）首版已交付列表/表单/原因 CRUD。产品图示1 **新增异动类别** 弹框需扩展三个**实施行为开关**，并将类别配置接入 **审批 → 维护实施** 流水线：控制异动是否修改学籍状态/类型，以及审批通过后是**自动实施**还是进入维护页**手动实施**。

本期在既有配置页基础上增量交付；四 Tab 申请页仍不改为从配置动态生成，但通过 lookup 让审批/维护能读取类别策略。

## What Changes

### 表单弹窗扩展（图示1 增量）

在现有六项字段之下，新增三个**开关**（每行独立配置，默认关）：

| 开关 | 字段 | 含义 |
|------|------|------|
| 修改学籍状态 | `modifyStudentStatus` | 实施生效时是否回写学生档案学籍状态 |
| 修改学籍类型 | `modifyStudentType` | 实施生效时是否回写学生档案学籍类型 |
| 是否自动实施 | `autoImplement` | 审批最终通过后是否直接 `Implemented`，否则 `Pending` 待维护手动实施 |

- UI 文案与现有「Student Status / Student Type **下拉配置**」区分，避免歧义
- 三个开关均展示功能说明（hint）：modify 开关说明是否修改对应档案字段；auto implement 说明为「开启后，该异动审批通过后将自动标记为已实施」
- Create / Edit 均可编辑三个开关；Student Type 行维度仍只读（Edit 时）
- Footer 仍为 Cancel + Save

### 审批 / 维护流水线联动

- 审批引擎 `applyMovementDecision` 最终 **Approved** 时：按 `sourceKey + studentType` lookup 类别配置
  - `autoImplement === true` → `implemented: 'Implemented'`
  - `autoImplement === false` → `implemented: 'Pending'`（与现行为一致）
- **自动实施的记录仍进入维护列表**，状态显示「已实施」；「实施」按钮对该类行不可用（无取消实施）
- 手动/自动**实施**时：若 `modifyStudentStatus` / `modifyStudentType` 为 true，mock 阶段更新 `students.js` 对应记录（首版轻量回写）

### Mock 种子扩展

- 由 **6 条** 扩展为 **12 条**（4 组 × 3 Student Type）：
  - 保留 PT001、DEF001 各 3 行
  - **新增** WDR001 / Withdrawal / Withdrawal / Normal × 3
  - **新增** RES001 / Resumption / Active / Normal × 3（复学目标状态 Active）
- 部分行预设演示用开关组合（如 RES001 Local `autoImplement: true`；WDR001 全 manual）

### Lookup 规则（mock）

```
programme-transfer → PT001
deferment          → DEF001
withdrawal         → WDR001
resumption         → RES001
studentCategory China → config studentType Chinese
```

## Capabilities

### New Capabilities

（首版已建 `movement-category-config`，本期为**扩展**）

### Modified Capabilities

- `movement-category-config`: 三个实施行为开关、12 条 mock、`resolveMovementCategoryConfig` lookup
- `movement-approval-app`: 审批通过时读取 `autoImplement` 决定初始 `implemented`
- `movement-maintenance-app`: 自动实施行仍展示于 Approved 维护列表；仅 Pending 可批量「实施」
- `student-records-app`: （无菜单变更）

## Impact

- **修改**
  - `src/data/movementCategories.js` — 三字段、lookup、WDR/RES 种子
  - `MovementCategoryFormModal.vue` — 三个开关 UI
  - `src/data/movementApprovalEngine.js` — Approved 时读 `autoImplement`
  - `src/data/movementMaintenanceFields.js` — 实施时读 modify 开关（可选回写 students）
  - `src/i18n/locales/en.js`、`zh.js`
- **Non-goals**
  - 申请 Tab 动态化、原因下拉改读配置
  - 取消实施 / 反实施
  - 后端 API
  - 维护列表新增三开关列（仅弹框配置）

## Decisions（探索阶段已确认）

- 开关粒度：**每 Student Type 一行**独立配置
- 自动实施后：**仍展示**于维护列表，状态=已实施
- WDR / RES 类别种子：**一并补齐**（各 3 行）
