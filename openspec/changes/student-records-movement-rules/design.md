# 学籍管理-异动规则设置 — 设计要点（合并）

## 文档用途

汇总历史 design 中与本菜单相关的决策与约束，供写需求文档时对照。冲突处以较新变更及当前代码为准。

## 来源：add-movement-rule-condition-columns

# 设计

## 表格列顺序

```
序号 | 规则名称 | 学期类型 | 学生类别 | 异动类别 | 申请时间 | 规则值 | 是否启用 | 操作
```

## 数据模型扩展

每条规则对象从 `{ id, ruleValue, enabled }` 扩展为：

```javascript
{
  id,
  ruleValue,
  enabled,
  condition: {
    semesterType: 'long' | 'short' | null,      // 学期类型
    studentCategory: 'chinese' | 'local' | 'international' | null, // 学生类别
    movementType: 'programme-transfer' | 'deferment' | 'resumption' | 'withdrawal' | null, // 异动类别
    applicationWeek: { start: number, end: number } | null, // 申请时间（开学后周）
  }
}
```

## 字段值与现有规则映射

| id | 学期类型 | 学生类别 | 异动类别 | 申请时间（开学后周） |
|---|---|---|---|---|
| MR001 | 长学期 | 本地 | 转专业 | - |
| MR002 | 短学期 | 本地 | 转专业 | - |
| MR003 | - | 国际 | 转专业 | - |
| MR004 | 长学期 | 中国 | 转专业 | 5 ~ 7 |
| MR005 | 短学期 | 中国 | 转专业 | - |

> 注：MR001/MR002 申请时间列显示 `-`，时限由规则值（截止周）决定；MR003 为月数阈值；MR004 允许时须在 5~7 周内；MR004/MR005 规则值为 0/1。

## 默认值与迁移

- 在 `buildDefaultRules()` 中为每条规则写入 `condition` 默认值。
- `normalizeRule()` 读取时若旧数据缺少 `condition`，则使用 fallback 默认值补齐，保证现有 `movement-rules-v2` 数据向后兼容。
- 不升级 `localStorage` key。

## 展示逻辑

- 新增字段不可编辑，不使用 `input` 或 `select`。
- 枚举字段通过 `t('movementRules.conditions.{field}.{value}')` 渲染。
- 申请时间字段：`applicationWeek` 存在时渲染为 `{start} ~ {end}`；不存在时渲染 `-`。
- 所有不适用的字段统一渲染为 `-`（i18n key: `common.notApplicable` 或 `movementRules.notApplicable`）。

## i18n 结构

```
movementRules:
  columns:
    semesterType: '学期类型'
    studentCategory: '学生类别'
    movementType: '异动类别'
    applicationWeek: '申请时间（开学后【周】）'
  conditions:
    semesterType:
      long: '长学期'
      short: '短学期'
    studentCategory:
      chinese: '中国'
      local: '本地'
      international: '国际'
    movementType:
      programme-transfer: '转专业'
      deferment: '休学'
      resumption: '复学'
      withdrawal: '退学'
  notApplicable: '-'
```

## 来源：add-movement-rule-settings

# 设计

## 内置规则

| id | 规则值含义 | 默认 |
|----|-----------|------|
| `MR001` | 长学期 Week 上限（短学期固定 Week 1，写在规则名称中） | 3 |
| `MR002` | 距下学期开学月数阈值（少于该月数仅能选下下学期） | 2 |
| `MR003` | 逾期是否仍允许提交（1=允许，0=不允许） | 1 |

## 数据

```javascript
{ id, ruleValue, enabled }  // 名称由 i18n movementRules.items.{id}.name 提供
```

`localStorage` key: `movement-rules-v1`

## UI

无搜索、无工具栏。表格列：序号 | 规则名称 | 规则值 | 是否启用 | 操作

## 来源：refine-chinese-programme-transfer-rules

# 设计

## 规则拆分

| id | 学期类型 | 学生类别 | 异动类别 | 申请时间 | 默认 ruleValue | 含义 |
|---|---|---|---|---|---|---|
| MR004 | 长学期 | 中国 | 转专业 | 5 ~ 7 | 1 | 1=允许申请（须在 5~7 周内）；0=不允许 |
| MR005 | 短学期 | 中国 | 转专业 | - | 0 | 1=允许；0=不允许（默认禁止） |

## 0/1 语义

```
ruleValue = 0  →  该学期类型下不受理转专业申请
ruleValue = 1  →  允许申请；长学期（MR004）还须满足 applicationWeek 5~7
```

## 与 Local 规则对照

```
Local                     中国
MR001 长学期 1~3 周       MR004 长学期 5~7 周 + 0/1
MR002 短学期 1~1 周       MR005 短学期 默认 0 禁止
```

## 数据迁移

- 沿用 `movement-rules-v2`；`loadMovementRules()` 按 id 合并，缺失 MR005 用默认值补齐
- MR004 的 `condition` 由 normalize fallback 更新为长学期 + 5~7 周
- 旧 MR004 的 ruleValue（原「逾期是否允许」）保留数值，语义改为「是否允许申请」

## i18n 名称模板

- MR004：`规则值 {value} 表示是否允许申请（1=是，0=否）；允许申请时须在开学后第 5 至第 7 周内提交`
- MR005：`规则值 {value} 表示是否允许申请（1=是，0=否）；短学期默认不允许提交`

## 来源：refine-local-programme-transfer-rule-value

# 设计

## MR001/MR002 申请时间

| id | 申请时间列 | 规则值 | 判断逻辑 |
|---|---|---|---|
| MR001 | - | N（默认 3） | 开学后第 1~N 周内可提交 |
| MR002 | - | N（默认 1） | 开学后第 1~N 周内可提交 |

## 与其他规则对比

| 规则 | 规则值含义 | 申请时间列 |
|---|---|---|
| MR001/002 | 截止周 | - |
| MR004 | 0/1 是否允许 | 5~7（固定窗口） |
| MR005 | 0/1 是否允许 | - |

## 迁移

当 fallback 的 `applicationWeek` 为 `null` 时，`normalizeCondition` 强制返回 `null`，忽略旧 localStorage 中的 `{1,3}` / `{1,1}`。

## 来源：refine-movement-rule-settings-split-rows

# 设计

## 四条内置规则

| id | 默认 ruleValue | 含义 |
|----|----------------|------|
| MR001 | 3 | Local 长学期 Week 上限 |
| MR002 | 1 | Local 短学期 Week 上限 |
| MR003 | 2 | 国际生距下学期开学月数阈值 |
| MR004 | 1 | 中国生逾期是否仍允许提交（1/0） |

## 名称模板

`t('movementRules.items.{id}.name', { value: ruleValue })`

## v1 → v2 迁移

- 旧 MR001 → 新 MR001；新 MR002 默认 1、继承 enabled
- 旧 MR002 → 新 MR003；旧 MR003 → 新 MR004
