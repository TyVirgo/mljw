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
  <div v-if="form.modifyStudentType" class="form-field" :class="row3FieldClass">
    <!-- 学籍类型 select -->
  </div>
</div>
```

```js
const row3SingleColumn = computed(
  () => (form.modifyStudentStatus ? 1 : 0) + (form.modifyStudentType ? 1 : 0) === 1,
)
// row3FieldClass: row3SingleColumn ? 'form-field-full' : ''
```

`.form-field-full { grid-column: 1 / -1; }` — 与现有 `.course-handling-block` 一致。

### D4：条件校验

```js
if (data.modifyStudentStatus && !data.studentStatus) {
  requireField('studentStatus', 'Student Status is required.')
}
if (data.modifyStudentType && !data.category) {
  requireField('category', 'Track category is required.')
}
```

OFF 时不校验对应字段；保存时仍提交完整 form 对象（含隐藏字段的原值）。

### D5：文案 — 学籍类型

| Key | 中文（改后） | 英文（改后） |
|-----|-------------|-------------|
| `movementCategory.fields.category` | 学籍类型 | Track Category |

列表表头已用 `t('movementCategory.fields.category')`，改 i18n 即可同步。

**注意**：`movementCategory.fields.studentType`（Local/Chinese/International）为不同维度，本变更不修改。

### D6：列表页

- 表头文案随 i18n 更新为「学籍类型」
- 列数据、`formatTrackCategory`、搜索区 **不变**
- PT001 等 seed：`modifyStudentStatus: false` 时列表仍显示 `Active` / `Programme Transfer`

## 表单信息架构（定稿）

```
Row1  类别编码(RO) | 类别名称
Row2  修改学籍状态 ? : [YnSwitch] | 修改学籍类型 ? : [YnSwitch]
Row3  (adaptive)
      OFF+OFF → hidden
      ON+OFF  → 学籍状态 [select] full width
      OFF+ON  → 学籍类型 [select] full width
      ON+ON   → 学籍状态 | 学籍类型
Row4  是否自动实施 ? : [YnSwitch] | 允许学生申请 [radio]
Row5  处理选课 [3 × checkbox]
```

## 风险与应对

| 风险 | 缓解 |
|------|------|
| 与旧 spec §20「ON 锁定下拉」文档冲突 | 本变更 delta 明确 REMOVED + MODIFIED |
| OFF 时列表有值、编辑看不到 | 产品确认：列表展示配置结果，编辑显隐仅控制是否可改 |
| 气泡在弹框边缘被裁切 | tooltip `z-index` 高于 modal；必要时 `position` 向左展开 |
| 仅移动端无 hover | 保留 `focus-within`；本阶段桌面管理端为主 |

## 迁移说明

1. 更新 `movement-category-config` spec delta
2. 改 `MovementCategoryFormModal.vue` + `validateMovementCategoryForm` + i18n
3. 冒烟：PT001（双开关 OFF，Row3 隐藏，列表仍有值）；DEF001（status ON，见学籍状态下拉）；双 ON 双列；hint 气泡；build 通过
