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
