# 学籍管理-异动类别配置 — 设计要点（合并）

## 文档用途

汇总历史 design 中与本菜单相关的决策与约束，供写需求文档时对照。冲突处以较新变更及当前代码为准。

## 来源：add-movement-category-config

## 背景说明

`add-movement-category-config` 首版已实现 `MovementCategoryView` + 表单/原因 CRUD + 6 条 mock，且 **Non-goal** 为不读写申请 store。`add-movement-approval-app`、`add-movement-maintenance` 已落地：`Approved` 后默认 `implemented: 'Pending'`，维护页手动「实施」→ `Implemented`。

产品图示1 要求弹框新增三个开关，并将类别配置作为**实施策略**供审批/维护消费。

## 目标 / 非目标

**目标：**

- 弹框新增 `modifyStudentStatus`、`modifyStudentType`、`autoImplement` 三个开关（默认 false）
- 数据模型、normalize、Create/Edit 持久化三字段
- `resolveMovementCategoryConfig(sourceKey, studentCategory)` lookup
- 审批最终 Approved 时按 `autoImplement` 设置初始 `implemented`
- 维护页：自动实施行仍列表可见；仅 Pending 可点「实施」
- 实施时按 modify 开关 mock 回写 `students.js`（轻量）
- Mock 扩展至 **12 条**（补 WDR001、RES001 各 ×3）

**非目标：**

- 申请四 Tab 表单改读类别/原因配置
- 取消实施
- 维护列表展示三开关列
- 真实后端、vue-router

## 设计决策

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
const config = resolveMovementCategoryConfig(sourceKey, inferStudentCategory(u

## 来源：add-movement-reason-applicable-personnel-category

# 设计
## 字段值

| 存储值 | 展示 | 过滤行为 |
|--------|------|----------|
| `All` | 全部 | teacher / 学生均可见 |
| `Teacher` | 老师 | 仅 teacher 端 |
| `Student` | 学生 | 仅 学生端 |

新增原因默认 `All`；缺省/旧数据 normalize 为 `All`。

## 来源：refine-movement-category-form-ui

## 背景说明

`add-movement-category-config` §20 将实施开关置于下拉之上，并规定开关 ON 时 **锁定** 下拉（防误改配置轨道值）。探索确认产品期望相反语义：开关表示「实施时是否修改档案对应字段」；ON 时需指定 **目标值**（下拉可见可编辑），OFF 时该字段与编辑无关（隐藏但保留存储值）。列表页两列仍展示配置结果，不受编辑时显隐影响。

```
┌──────────────────────────────────────────────────────────────┐
│  数据层（始终持久化）          │  编辑 UI（条件展示）           │
├───────────────────────────────┼───────────────────────────────┤
│  modifyStudentStatus: bool    │  OFF → 不展示学籍状态下拉      │
│  studentStatus: string        │  ON  → 展示下拉，必选          │
│  modifyStudentType: bool      │  OFF → 不展示学籍类型下拉      │
│  category: string             │  ON  → 展示下拉，必选          │
└───────────────────────────────┴───────────────────────────────┘
                              │
                              ▼
                    列表页照常显示两列值
                    实施 pipeline 仍读 modify* 标志
```

## 目标 / 非目标

**目标：**

- 三处 hint 改为标签旁 `?` 气泡，不占用开关下方行高
- 开关 ON → 展示对应下拉；OFF → 隐藏、保留原值
- Row3 单列/双列自适应
- 表单 + 列表「类别」→「学籍类型」
- 条件校验与 spec 对齐

**非目标：**

- 抽离跨模块 tooltip 组件
- 改 `category` 字段 key 或 track category 枚举
- 列表隐藏 OFF 时的列值

## 设计决策

### D1：Hint 交互 — 标签旁问号气泡

复用 `ProgrammeVersionCreateModal` 的 `.info-tip-wrap` / `.info-tooltip` hover 模式，图标改为 `?`（`cursor: help`）。

```html
<label class="field-label">
  {{ t('movementCategory.fields.modifyStudentStatus') }}
  <span class="field-hint-tip-wrap" tabindex="0">
    <span class="field-hint-icon" aria-hidden="true">?</span>
    <span class="field-hint-tooltip" role="tooltip">
      {{ t('movementCategory.fields.modifyStudentStatusHint') }}
    </span>
  </span>:
</label>
<div class="field-control">
  <YnSwitch v-model="form.modifyStudentStatus" />
</div>
```

- 移除 `.field-control-stacked` 内 `<p class="field-hint">`
- 三开关均同模式：`modifyStudentStatus`、`modifyStudentType`、`autoImplement`
- 气泡定位：相对 `?` 图标，避免遮挡开关（可参考 programme modal：`left` + `bottom` 或 `top`）

### D2：开关 — 下拉联动（修订 §20 §27）

| 开关 | OFF | ON |
|------|-----|-----|
| `modifyStudentStatus` | 隐藏学籍状态下拉；**不清空** `form.studentStatus` | 展示下拉，enabled，保存时 required |
| `modifyStudentType` | 隐藏学籍类型下拉；**不清空** `form.category` | 展示下拉，enabled，保存时 required |

**废弃**（自 `add-movement-category-config` design §27）：

```js
:disabled="form.modifyStudentStatus"
:disabled="form.modifyStudentType"
```

用户再次打开开关时，下拉带出已存值，可继续修改。

### D3：Row3 自适应网格

```vue
<div v-if="form.modifyStudentStatus || form.modifyStudentType" class="row3-adaptive">
  <div v-if="form.modifyStudentStatus" class="form-field" :class="row3FieldClass">
    <!-- 学籍状态 select -->
  </div>
  <div v-if="form.m

## 来源：refine-movement-reason-allow-student-switch

## 设计

### 语义
| 开关 | `applicablePersonnelCategories` | 老师端原因下拉 | 学生端原因下拉 |
|------|--------------------------------|----------------|----------------|
| 否（默认） | `['Teacher']` | 可见 | 不可见 |
| 是 | `['Student']` | 不可见 | 可见 |

### YnSwitch
- 新增 `onLabel` / `offLabel` props，中文传「是」「否」，英文 Yes/No

### 列表行内切换
- 点击开关 → `updateReason(categoryId, reasonId, { allowStudentApply })` 写回

## 来源：remove-exclude-graded-from-preset-option

## Context

`add-movement-category-config` §20–§22 已在 `MovementCategoryFormModal` 为四类异动提供三个「处理选课」checkbox。产品现要求去掉第三项 `excludeGradedFromPreset`（「已获得成绩课程不预置到新专业批次名单」）。

当前实现触点：

```
MovementCategoryFormModal.vue  ← 第三行 checkbox UI
movementCategories.js          ← normalize / seed / empty form
MovementCategoryView.vue       ← 保存映射
zh.js / en.js                  ← excludeGradedFromPreset 文案
```

## Goals / Non-Goals

**Goals:**
- 弹框「处理选课」仅保留两项；布局仍为标签与首项同行、第二项缩进
- 彻底移除字段读写，避免死代码与文案残留

**Non-Goals:**
- 不改选课业务引擎 / 真实 API
- 不调整另两项默认值（PT001 仍默认可勾选删除原名单与预置批次）

## Decisions

1. **删字段，而非隐藏**  
   原因：原型阶段无后端契约依赖该字段；保留会污染 save payload 与 i18n。  
   备选：仅 `v-if=false` → 拒绝，避免无用配置回流。

2. **localStorage 旧值静默忽略**  
   `normalize` 不再映射 `excludeGradedFromPreset`；再次保存后键自然消失。无需迁移脚本。

3. **新建 change，不回写已完成 change**  
   `add-movement-category-config` 已 complete；用本 change 的 delta spec 表达移除。

## Risks / Trade-offs

- [Risk] 评审人员对比旧截图仍期待第三项 → Mitigation：本 change 明确为产品删减；重新部署静态包后可见
- [Risk] 文档/反馈表仍提及第三项（如 `generate-feedback-adjustment-doc.mjs`） → Mitigation：非本次必改；需要时可另开清理任务

## Migration Plan

1. 改源码并本地冒烟四类 Edit
2. `npm run deploy:gitcode` 更新云端静态包（如需）
3. push GitHub Pages（如需公网同步）

## Open Questions

（无）
