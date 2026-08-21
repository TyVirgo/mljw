# 选课管理-选课规则 — 设计要点（合并）

## 文档用途

汇总历史 design 中与本菜单相关的决策与约束，供写需求文档时对照。冲突处以较新变更及当前代码为准。

## 来源：add-registration-rule-settings

## Context

学籍模块已有成熟的规则设置表。选课侧需同等能力管理校级默认规则，挂在配置组与批次并列。

## Decisions

| 决策 | 说明 |
|------|------|
| 菜单 | `cr-config-group` 下、`cr-batch` 后；id=`cr-rules` |
| UI | 对齐 `MovementRuleSettingsView`（YnSwitch、行内编辑） |
| 列 | 序号、规则名称、学期类型、适用范围、规则参数、启用、操作 |
| 参数 | 按 `type` 编辑多字段；展示列为可读摘要 |
| 数据 | `registrationRuleSettings.js` + localStorage `registration-rules-v1` |
| 默认 | 五条全部 `enabled: true` |

## File Impact

```
src/config/courseRegistrationMenu.js
src/App.vue
src/views/courseRegistration/RegistrationRuleSettingsView.vue
src/data/courseRegistration/registrationRuleSettings.js
src/data/courseRegistration/courseRegistrationModuleBriefs.js
src/i18n/locales/zh.js / en.js
```

## 来源：replace-registration-rules-simple

## Context

旧规则 CR001–005 含学期/受众/多参数；学生端学分提示读 CR003/CR004。图示为启用开关 + 单值六条。

## Decisions

1. storage key 升为 `registration-rules-v2`，避免旧结构污染。
2. 规则类型：`flag`（0/1）与 `count`（非负整数）；统一 `params.value`。
3. 表格内联改规则值（blur/change 保存），无操作列。
4. 学分文案用 `LONG_SEMESTER_CREDIT_*` + 新增 `RESUMPTION_CREDIT_MAX=21`。

## Risks

- 本地若曾存 v1，刷新后按 v2 默认；可接受（原型）。

## 增量：第三轮互释校级开关（align-ge-me）

「第三轮选课新老生名额互释」作为规则表一行（`CR205`，flag，默认开），与 CR201–CR204、CR107 同表；必须NOT 独立卡片。批次可经 `localRules.releaseCrossAudienceOnRound3` 覆盖。第一轮容量细分在管理轮次 · 老生第一轮。详见 `align-ge-me-senior-freshman-model`。
