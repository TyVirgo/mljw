# 学籍管理-异动规则设置 — 任务清单（合并归档）

> 历史 tasks 已在各次 apply 中完成。本清单仅作追溯；**无需再次实现**。

- [x] 1. 合并本菜单下历史变更包为中文需求包
- [x] 2. 保留合并来源列表便于需求文档回溯
- [x] 3. 删除已被合并的旧变更目录

## 历史来源任务摘要

### add-movement-rule-condition-columns

```
## 1. 数据模型

- [x] 1.1 在 `movementRules.js` 中为每条规则定义 `condition` 默认值（学期类型、学生类别、异动类别、申请时间）
- [x] 1.2 更新 `normalizeRule()`，对缺少 `condition` 的旧数据使用 fallback 补齐
- [x] 1.3 确保 `updateMovementRuleValue()` 与 `updateMovementRuleEnabled()` 不破坏 `condition` 字段

## 2. UI 展示

- [x] 2.1 在 `MovementRuleSettingsView.vue` 表格中新增 4 列，位于「规则名称」与「规则值」之间
- [x] 2.2 实现 4 个只读字段的渲染逻辑，不适用时显示 `-`
- [x] 2.3 调整列宽与样式，保证新增字段在表格中不溢出

## 3. 国际化

- [x] 3.1 在 `zh.js` 中新增列头与枚举值 i18n
- [x] 3.2 在 `en.js` 中新增列头与枚举值 i18n

## 4. 验证

- [ ] 4.1 `npm run build` 通过
- [ ] 4.2 页面打开后 4 个字段按预期展示，缺省值显示 `-`
```

### add-movement-rule-settings

```
## 1. 数据与页面

- [x] 1.1 `movementRules.js`：3 条内置规则 + localStorage
- [x] 1.2 `MovementRuleSettingsView.vue`：表格、行内编辑、YnSwitch

## 2. 导航与 i18n

- [x] 2.1 菜单、`App.vue` 路由
- [x] 2.2 i18n 规则名称与列头

## 3. 验证

- [x] 3.1 `npm run build`
```

### refine-chinese-programme-transfer-rules

```
## 1. 数据

- [x] 1.1 更新 MR004 condition（长学期、5~7 周），新增 MR005
- [x] 1.2 MR004/MR005 规则值 0/1 校验

## 2. i18n

- [x] 2.1 重写 MR004/MR005 规则名称（中英文）

## 3. 验证

- [x] 3.1 页面展示 5 条规则，MR004/MR005 条件列与规则值符合设计
```

### refine-local-programme-transfer-rule-value

```
## 1. 数据

- [x] 1.1 MR001/MR002 `applicationWeek` 设为 null
- [x] 1.2 `normalizeCondition` 对无申请窗口的规则忽略旧存储

## 2. 文档

- [x] 2.1 更新 OpenSpec 映射表
```

### refine-movement-rule-settings-split-rows

```
## 1. 数据

- [x] 1.1 四条规则 + v2 存储与 v1 迁移
- [x] 1.2 MR004 规则值校验 0/1

## 2. UI 与 i18n

- [x] 2.1 规则名称 `{value}` 插值
- [x] 2.2 i18n 四条规则文案

## 3. 验证

- [x] 3.1 `npm run build`
```

### refine-mr004-editable-application-week

```
## 1. 数据与校验

- [x] 1.1 新增 `validateApplicationWeek`、`updateMovementRule`（同时更新规则值与申请时间）

## 2. UI

- [x] 2.1 MR004 编辑态申请时间双输入 + 固定 `~`
- [x] 2.2 保存/取消与规则值编辑联动

## 3. i18n

- [x] 3.1 MR004 规则名称 `{start}` / `{end}` 插值
```
