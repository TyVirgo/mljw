## 背景与动机

学籍异动「异动类别」配置页（`sr-movement-category`）首版已交付列表/表单/原因 CRUD。产品图示1 **新增异动类别** 弹框需扩展三个**实施行为开关**，并将类别配置接入 **审批 → 维护实施** 流水线：控制异动是否修改学籍状态/类型，以及审批通过后是**自动实施**还是进入维护页**手动实施**。

本期在既有配置页基础上增量交付；四 Tab 申请页仍不改为从配置动态生成，但通过 lookup 让审批/维护能读取类别策略。

## 变更内容

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

## 能力范围

### 新增能力

（首版已建 `movement-category-config`，本期为**扩展**）

### 修改的能力

- `movement-category-config`: 三个实施行为开关、12 条 mock、`resolveMovementCategoryConfig` lookup
- `movement-approval-app`: 审批通过时读取 `autoImplement` 决定初始 `implemented`
- `movement-maintenance-app`: 自动实施行仍展示于 Approved 维护列表；仅 Pending 可批量「实施」
- `student-records-app`: （无菜单变更）

## 影响范围

- **修改**
  - `src/data/movementCategories.js` — 三字段、lookup、WDR/RES 种子
  - `MovementCategoryFormModal.vue` — 三个开关 UI
  - `src/data/movementApprovalEngine.js` — Approved 时读 `autoImplement`
  - `src/data/movementMaintenanceFields.js` — 实施时读 modify 开关（可选回写 students）
  - `src/i18n/locales/en.js`、`zh.js`
- **非目标**
  - 申请 Tab 动态化、原因下拉改读配置
  - 取消实施 / 反实施
  - 后端 API
  - 维护列表新增三开关列（仅弹框配置）

## 设计决策（探索阶段已确认）

- 开关粒度：**每 Student Type 一行**独立配置
- 自动实施后：**仍展示**于维护列表，状态=已实施
- WDR / RES 类别种子：**一并补齐**（各 3 行）

---

## 增量修订（表单 IA + 移除 Student Type 维度）

`add-movement-category-config` 首版及 §8–§11 开关扩展已交付。产品图示1/2 要求 **新增异动类别** 弹框布局调整，并 **移除 Student Type 字段**（本模块不再需要该维度）。

### 表单弹窗布局（本阶段）

| 区域 | 规则 |
|------|------|
| Row 1 | 类别编码 \| 类别名称 |
| Row 2 左 | **学籍状态** 下拉；右上角 **修改学籍状态** 开关；控件下方 hint（图示2 风格） |
| Row 2 右 | **类别** 下拉（**全量选项**，不与学籍状态联动）；右上角 **修改学籍类型** 开关；控件下方 hint |
| Row 3 左 | **是否自动实施**：左标题、右开关、hint 在下一行（图示1 第三行左列） |
| Row 3 右 | 允许学生申请（是/否） |
| 删除 | **学生类型** 字段；底部独立 `switch-section` 三行 |

### 移除 Student Type 维度

- 表单、列表、数据模型、校验、lookup **均不再使用** `studentType`
- Mock 由 **12 行（4 code × 3 type）合并为 4 行**（每 `categoryCode` 一行）
- 唯一性：**categoryCode** 唯一（替代 categoryCode + studentType）
- Lookup：`resolveMovementCategoryConfig(sourceKey)` 仅按 **categoryCode** 匹配，不再按申请学生类别分流

### 学籍状态与类别解耦

- 类别下拉展示 **全量 track category 选项**（从 `studentStatusCategoryMap` 去重导出）
- 不与学籍状态联动；不随学籍状态变更清空类别

### 实施回写语义（modifyStudentType）

- `modifyStudentType` 开关挂在 **类别** 字段；开启后表示实施时修改学生档案 **学籍类型（track category）**
- Mock 回写：`applyStudentProfileFromMovement` 在 `modifyStudentType === true` 时使用配置行 **`category`** 值（不再读已删除的 `studentType` 字段）

### 列表

- 删除 **学生类型** 列；原因弹窗副标题不再展示 Student Type

## 能力范围（增量）

### 修改的能力

- `movement-category-config`: 表单 IA 修订、移除 Student Type、4 行 seed、lookup 简化、类别全量下拉
- `movement-approval-integration`: lookup 不再依赖 studentCategory 维度（签名可保留、逻辑忽略）
- `movement-maintenance`: modifyStudentType 回写改用 `category` 字段

## 影响范围（增量）

- **修改**
  - `movementCategories.js` — 去 studentType；`trackCategoryOptions`；4 行 seed；lookup/validate
  - `MovementCategoryFormModal.vue` — 布局重构
  - `MovementCategoryView.vue`、`MovementCategoryReasonModal.vue` — 去 Student Type 展示
  - `students.js` — `applyStudentProfileFromMovement` modifyStudentType 语义
- **非目标**
  - 不动 ConsentForm、StudentProfile、MovementQuery 等其它模块的 studentType
  - 申请 Tab 动态化、取消实施、后端 API

## 设计决策（增量已确认）

| 项 | 决策 |
|----|------|
| Student Type | **模块级删除**（表单 + 列表 + 数据 + lookup） |
| 类别下拉 | **全量选项**，不与学籍状态 filter |
| autoImplement 布局 | Row3 左列：左标题、右开关、hint 下一行 |
| modify 开关布局 | Row2：嵌入学籍状态/类别字段右上角（图示2） |
| Seed | **4 行**（PT001 / DEF001 / WDR001 / RES001 各 1） |
| RES001 autoImplement | 合并行保留 `autoImplement: true` 便于演示 |

---

## §15 表单标签列对齐（增量）

§12–§14 已实现开关嵌入与 Student Type 移除，但 **学籍状态 / 类别 / 是否自动实施** 仍使用 `field-label--spacer` 空占位列，字段名落在控件区内的 `inline-label`，与 Row1 **类别编码 / 类别名称** 的 `field-label`（132px 右对齐）不一致。产品要求三字段回归统一 **「字段名 + 字段值」** 排版。

### 问题（当前 vs 目标）

```
当前 Row2                          目标 Row2
┌────────────────────────┐          ┌────────────────────────┐
│ (空)  │ *学籍状态  开关N │          │ *学籍状态: │ [select ▼] │
│       │ [select]        │   →      │            │ 开关N hint │
└────────────────────────┘          └────────────────────────┘
  标签在控件区内、加粗                  标签在左列，与类别编码同列
```

### 布局规则

| 行 | 左列 `field-label` | 右列 `field-control` |
|----|-------------------|----------------------|
| Row1 | `* 类别编码:` / `* 类别名称:` | input（不变） |
| Row2 左 | `* 学籍状态:` | 第一行：`select`（与 label 同一 flex 行）；第二行：`修改学籍状态` + YnSwitch **右对齐**；第三行：hint |
| Row2 右 | `* 类别:` | 同上，开关为 `修改学籍类型` |
| Row3 左 | `是否自动实施:`（与类别编码 **同列对齐**） | 第一行：YnSwitch **左对齐**（`min-height: 32px`，与 radio 行一致）；第二行：hint |
| Row3 右 | `* 允许学生申请:` | radio（不变） |

### 实现要点

- **删除** `field-label--spacer`、`inline-label`、顶行 `field-header` 内嵌主字段名
- **复用** Row1 的 `.form-field` + `.field-label` + `.field-control` 结构
- 学籍状态 / 类别：`field-control-stacked` 内顺序为 `select` → `field-switch-row`（`justify-content: flex-end`）→ `field-hint`
- 是否自动实施：`switch-value-row` 包裹 YnSwitch，与「允许学生申请」radio 行高对齐

### 范围

| 在范围 | 不在范围 |
|--------|----------|
| `MovementCategoryFormModal.vue` 模板 + scoped CSS | 数据模型、lookup、列表列 |
| OpenSpec spec delta（标签列 Scenario） | i18n 文案变更 |

### 设计决策（

| 项 | 决策 |
|----|------|
| 标签列 | 学籍状态 / 类别 / 是否自动实施均使用 `field-label`（132px 右对齐），与类别编码一致 |
| 学籍状态 / 类别 | 标签与下拉 **同一行**（form-field 横排） |
| modify 开关 | 下移至 select **下方**、控件区内右对齐（保留图示2 语义） |
| 是否自动实施 | 左列与类别编码对齐；开关在值区紧挨标签后、左对齐 |

## 能力范围（§15 增量）

### 修改的能力

- `movement-category-config`: 表单标签列与 Row1 对齐；学籍状态/类别 label+select 同行；modify 开关下移；删除 spacer/inline-label

## 影响范围（§15 增量）

- **修改**
  - `MovementCategoryFormModal.vue` — 模板与 scoped CSS
- **非目标**
  - 数据模型、lookup、列表、i18n 文案

---

## §16 modify 开关独立行（增量）

§15 将 modify 开关嵌在学籍状态/类别 `field-control` 内并 **右对齐**（`field-switch-row`）。产品图示1 要求 **修改学籍状态 / 修改学籍类型** 与「是否自动实施」相同：**独立 form-field 行、标准左标签列 + 开关值区左对齐**，hint 文案与位置不变。

### 问题（§15 实现 vs 图示1）

```
§15 当前                           §16 目标
Row2  * 学籍状态: [select]         Row2  * 学籍状态: [select]    | * 类别: [select]
      ┌─control 内──────────┐           Row3  修改学籍状态: [N]  | 修改学籍类型: [N]
      │   修改学籍状态 [N] →│                 hint                | hint
      │   hint              │           Row4  是否自动实施: [N]  | * 允许学生申请
      └─────────────────────┘                 hint
      开关无左标签列、右对齐              开关有 field-label，与类别编码同列
```

### 布局规则

| 行 | 左列 | 右列 |
|----|------|------|
| Row1 | `* 类别编码:` / `* 类别名称:` | input（不变） |
| Row2 | `* 学籍状态:` / `* 类别:` | select only（`field-control` 不再含 switch） |
| Row3 | `修改学籍状态:` / `修改学籍类型:` | `switch-value-row` 左对齐 YnSwitch + `field-hint` |
| Row4 | `是否自动实施:` | YnSwitch + hint |
| Row4 右 | `* 允许学生申请:` | radio（不变） |

### 实现要点

- 学籍状态/类别各拆为 **两个** `form-field`：上行 select，下行 modify 开关
- modify 行使用 `field-label`（非 required）+ `field-control field-control-stacked`
- **删除** `field-switch-row` 及 select 列内嵌 switch 结构
- hint 文案沿用现有 i18n key，位置在开关下方

### 范围

| 在范围 | 不在范围 |
|--------|----------|
| `MovementCategoryFormModal.vue` 模板 + scoped CSS | 数据层、原因同步 |

### 设计决策（

| 项 | 决策 |
|----|------|
| modify 开关位置 | 独立 grid 行（Row3），不再嵌在 select 的 stacked control 内 |
| 标签 | `修改学籍状态:` / `修改学籍类型:` 使用标准 `field-label`，与类别编码同列 |
| 开关对齐 | `switch-value-row` 左对齐，与 autoImplement 一致 |
| hint | 不变，仍在开关下方 |

## 能力范围（§16 增量）

### 修改的能力

- `movement-category-config`: modify 开关独立行、标准标签列排版

## 影响范围（§16 增量）

- **修改** — `MovementCategoryFormModal.vue`
- **非目标** — §17 原因同步、其它模块

---

## §17 原因数据源同步（增量）

异动类别「设置原因」维护的 `reasons[]` 与休学/退学/转专业等 **申请表单原因选项**、审批/查询/维护列表的 **异动原因** 展示目前 **完全断开**（类别 seed 为空；申请侧硬编码 `mainReasonOptions`；PT 为自由文本）。本阶段以类别配置为 **单一数据源**，各端选项与展示同步。

### 现状 vs 目标

```
当前                              目标
movementCategories.reasons[]      movementCategories.reasons[]
        ✗ 无连接                          │
deferments.mainReasonOptions              ├── getReasonOptions(sourceKey)
withdrawals.mainReasonOptions             │
PT transferReason (textarea)              ├── Deferment/Withdrawal/PT Form select
        │                                 │
        └── extractMovementReason         └── resolveReasonLabel(reasonId)
            (各模块 i18n 硬编码)                 Approval / Query / Maintenance
```

### 数据模型

- 类别行 `reasons: [{ id, reasonName }]` 不变；`reasonName` 即展示文案（mock 不做独立 i18n key 表）
- 申请记录新增/统一 **`reasonId`**（指向配置 reasons[].id）；保存时校验 reasonId 属于该类别当前 reasons
- 展示：`resolveReasonLabel(categoryCode, reasonId)` → reasonName；找不到时 fallback 存盘旧值或 `—`

### 覆盖范围

| categoryCode | 申请模块 | 表单变更 | 队列 movementReason |
|--------------|----------|----------|---------------------|
| DEF001 | 休学 | `mainReason` select ← 配置 reasons | resolveReasonLabel |
| WDR001 | 退学 | `mainReason` select ← 配置 reasons | resolveReasonLabel |
| PT001 | 转专业 | `transferReason` **改为 select** ← 配置 reasons；存 reasonId | resolveReasonLabel |
| RES001 | 复学 | **不在范围**（现无原因字段；队列仍显示学期区间） | 不变 |

### Seed 数据

首次加载时各 category 预置与现硬编码一致的 reasons（便于 mock 演示与存量 seed 兼容）：

| code | 预置 reasonName（示例） |
|------|-------------------------|
| DEF001 | Personal Reason, Health Issue, Financial Reason, Military Service, Others |
| WDR001 | Financial Problem, Personal Reason, Health Issue, Academic Difficulty, Others |
| PT001 | Academic Performance, Personal Reason, Programme Fit, Others（新建，替代自由文本 demo） |
| RES001 | reasons: []（保留空，本阶段不同步申请表单） |

存量申请 seed 的 `mainReason` / `transferReason` 字符串在 normalize 时 **映射到对应 reasonId**（按 reasonName 匹配）。

### API（mock helpers）

```javascript
// movementCategories.js
export function getReasonOptionsBySourceKey(sourceKey) { ... }
export function getReasonOptionsByCategoryCode(categoryCode) { ... }
export function resolveReasonLabel(categoryCode, reasonId) { ... }
export function resolveReasonIdByName(categoryCode, reasonName) { ... }
```

### 删除 / 弃用

- `DefermentFormModal` / `WithdrawalFormModal` 不再 import 硬编码 `mainReasonOptions`
- `extractMovementReason`（approval/maintenance/query）对 DEF/WDR/PT 统一走 `resolveReasonLabel`
- `getMainReasonLabel` + `mainReasonI18nKeys` 在列表/详情展示路径上 **让位于** resolveReasonLabel（可保留函数供未迁移路径 fallback）

### 配置为空时

- 申请表单原因 select **无选项**；提交校验拦截并提示需管理员配置原因

### 设计决策（

| 项 | 决策 |
|----|------|
| 单一数据源 | `movementCategories[].reasons[]` |
| 存储 | 申请存 `reasonId` |
| 展示 | `reasonName` 直显，不做 reason 级 i18n |
| PT | 由 textarea 改为 select（与配置同步） |
| RES | 本阶段不同步申请原因字段 |
| 空配置 | select 为空 + 校验拦截 |
| Seed | DEF/WDR 对齐现硬编码；PT 新建 seed；存量映射 reasonName→reasonId |

## 能力范围（§17 增量）

### 修改的能力

- `movement-category-config`: reason helpers、seed reasons、CRUD 后申请端可见
- `movement-approval-integration`: `extractMovementReason` 走 resolveReasonLabel
- `movement-maintenance`: movementReason 展示同步
- `deferment-app` / `withdrawal-app` / `programme-transfer-app`: 原因 select 来自类别配置

## 影响范围（§17 增量）

- **修改**
  - `movementCategories.js` — seed reasons、helpers、nextReasonId
  - `deferments.js` / `withdrawals.js` / `programmeTransfers.js` — reasonId 字段、seed 映射、校验
  - `DefermentFormModal.vue` / `WithdrawalFormModal.vue` / `ProgrammeTransferFormModal.vue`
  - `DefermentDetailModal.vue` / `WithdrawalDetailModal.vue` / `ProgrammeTransferDetailModal.vue`
  - `movementApprovalQueue.js` — extractMovementReason
- **非目标**
  - RES001 申请原因字段
  - 后端 API
  - 原因多语言 key 表

---

## §19 本阶段屏蔽类别新增/删除（2026-06）

产品决策：异动类别主数据本阶段 **固定四类**（PT001 / DEF001 / WDR001 / RES001），与四 Tab 异动申请一一对应；**暂不开放**类别行的新增与删除，仅允许 **编辑** 与 **设置原因**。

### 列表页

- **屏蔽**工具栏「新增」「删除」按钮（UI 不展示；数据层 `createMovementCategory` / `deleteMovementCategories` 保留供后续阶段）
- **移除**主列表勾选列（无批量删除）
- 行操作保留：**编辑** | **设置原因**
- 布局：搜索区下方直接接表格（无空 toolbar）

### 编辑弹框

- 仅通过 **Edit** 打开（无 Create 入口）
- **类别代码**在 Edit 模式下只读（防止破坏 `MOVEMENT_SOURCE_TO_CATEGORY_CODE` lookup）

### 设置原因弹窗

- **不变**：原因列表仍支持新增 / 编辑 / 删除（申请端原因下拉依赖此配置）

### 能力范围（§19 增量）

- `movement-category-config`: 本阶段只读类别集合；屏蔽 Create/Delete UI

### 影响范围（§19 增量）

- **修改** `MovementCategoryView.vue` — 去 toolbar、勾选列、删除确认；仅 Edit + Set Reason
- **修改** `MovementCategoryFormModal.vue` — Edit 时 categoryCode 只读
- **非目标** — 不删 data 层 CRUD 函数；不限制原因弹窗 CRUD

---

## §20 编辑弹框布局调整与转专业选课选项（2026-06）

产品决策：优化异动类别 **Edit** 弹框字段顺序与开关—下拉联动；**转专业（PT001）** 增加三项「处理选课」可选项（本阶段 mock 占位，不接真实选课 API）。

### 表单布局（两行网格）

| 行 | 左 | 右 |
|----|----|----|
| 1 | 类别编码（只读） | 类别名称 |
| 2 | 修改学籍状态 🔘+hint | 修改学籍类型 🔘+hint |
| 3 | 学籍状态 ▼ | 类别 ▼ |
| 4 | 是否自动实施 🔘+hint | 允许学生申请 |
| 5（四类 Edit） | 处理选课 + 首项同行；后两项 checkbox 缩进对齐（§21–§22） | |

### 开关—下拉联动

| 开关 | 控制字段 | ON | OFF |
|------|----------|-----|-----|
| `modifyStudentStatus` | 学籍状态 | disabled（锁定当前值） | 可编辑 |
| `modifyStudentType` | 类别 | disabled | 可编辑 |

保存时 `studentStatus`、`category` 仍必填。

### 转专业选课三选项（§20 仅 PT001；§22 起四类均有）

| 字段 | 说明 | 默认 |
|------|------|------|
| `deleteOriginalCourseList` | 删除原课程名单（已获得成绩的不删） | false，非必选 |
| `presetNewProgrammeBatchList` | 预置新专业批次名单 | false，非必选 |
| `excludeGradedFromPreset` | 已获得成绩课程不预置… | false，非必选；**§21 起与 #1/#2 无联动** |

### 能力范围（§20 增量）

- `movement-category-config`: Edit 表单布局、开关联动、PT001 选课 mock 字段

### 影响范围（§20 增量）

- **修改** `MovementCategoryFormModal.vue` — 布局对调、`:disabled` 联动、PT001 checkbox 区
- **修改** `movementCategories.js` — `normalizeRow` / seed / empty form
- **修改** `en.js` / `zh.js` — 选课相关 i18n
- **非目标** — 不接真实选课 API；~~非 PT001 不展示选课区~~（§22 起四类均展示）

---

## §21 处理选课区 UI 修正（2026-06）

产品反馈：§20 实现的 PT001「处理选课」区块需调整 **布局、字号与选项独立性**（不改变三个 boolean 字段语义与存储）。

### 选项独立性

- 三个 checkbox（`deleteOriginalCourseList` / `presetNewProgrammeBatchList` / `excludeGradedFromPreset`）**互不联动**
- **撤销** §20「仅当 #2 勾选可选 #3；取消 #2 时清 #3」规则
- 无 `watch`、无 `:disabled` 级联；任意组合可保存

### 布局与字号

```
处理选课:  ☐ 删除原课程名单（已获得成绩的不删）   ← 标签与第一项同一行、垂直居中
           ☐ 预置新专业批次名单                  ← 与第一项 checkbox 左对齐缩进
           ☐ 已获得成绩课程不预置…
```

- 「处理选课」标签与 **第一个** checkbox **同一行**对齐（非相对整组垂直居中）
- 第 2、3 项 checkbox 与第 1 项 checkbox **左对齐**（缩进 = 标签列宽 + gap）
- 标签与选项文案字号 **13px**，与弹框其他字段（`.field-label`、radio、select）一致

### 能力范围（§21 增量）

- `movement-category-config`: 处理选课区独立 checkbox + 首行对齐 + 统一字号

### 影响范围（§21 增量）

- **修改** `MovementCategoryFormModal.vue` — 移除 preset→exclude watch/disabled；选课区 markup/CSS 重排
- **修改** `movement-category-config/spec.md` — 替换 §20 联动场景
- **非目标** — 不改 `movementCategories.js` 字段结构；不接选课 API

---

## §22 处理选课扩展至四类异动（2026-06）

产品决策：**PT001 / DEF001 / WDR001 / RES001** 四类异动类别 Edit 弹框均展示相同的「处理选课」三选项（§21 布局与独立选择规则不变）；不再仅限转专业。

### 展示范围

| 类别代码 | 异动类型 | 处理选课 Row5 |
|----------|----------|---------------|
| PT001 | 转专业 | ✓ |
| DEF001 | 休学 | ✓ |
| WDR001 | 退学 | ✓ |
| RES001 | 复学 | ✓ |

- 移除 `categoryCode === 'PT001'` 的 UI 条件
- 列表页 **不** 新增列；仅在 Edit 弹框配置

### 文案与默认值

- **四类共用** §20/§21 已有三项 i18n 文案（含「新专业批次」表述；实施语义由后端统一抽象，本阶段 mock 不区分）
- **默认**：DEF001 / WDR001 / RES001 seed 三项均为 `false`；PT001 可保留 demo 勾选

### 能力范围（§22 增量）

- `movement-category-config`: 四类 Edit 均含处理选课 mock 字段

### 影响范围（§22 增量）

- **修改** `MovementCategoryFormModal.vue` — 去掉 `isProgrammeTransfer` / `v-if` 限制
- **修改** `movementCategories.js` — DEF/WDR/RES seed 显式三字段 `false`（可选，normalize 已默认 false）
- **修改** spec — MODIFIED 选课 Requirement；REMOVED「仅 PT001 可见」场景
- **非目标** — 不改 i18n key；申请表单/审批/实施仍不读这三项
