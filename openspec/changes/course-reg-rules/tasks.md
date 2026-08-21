# 选课管理-选课规则 — 任务清单（合并归档）

> 历史 tasks 已在各次 apply 中完成。本清单仅作追溯；**无需再次实现**。

- [x] 1. 合并本菜单下历史变更包为中文需求包
- [x] 2. 保留合并来源列表便于需求文档回溯
- [x] 3. 删除已被合并的旧变更目录

## 历史来源任务摘要

### add-registration-rule-settings

```
## 1. 提案与入口

- [x] 1.1 写入 proposal / design / spec / tasks
- [x] 1.2 菜单 `cr-rules`、developedPages、App.vue、briefs、i18n

## 2. 数据与页面

- [x] 2.1 `registrationRuleSettings.js`：五条默认规则 + 校验/更新/localStorage
- [x] 2.2 `RegistrationRuleSettingsView.vue`：对齐学籍规则表交互
```

### polish-credit-rule-numbered-lines

```
## 1. 实现

- [x] 1.1 学分规则两行编号展示
- [x] 1.2 两条统一加大字号
```

### replace-registration-rules-simple

```
## 1. 实现

- [x] 1.1 替换规则数据模型与校验（v2）
- [x] 1.2 规则设置页三列 UI
- [x] 1.3 学生端学分提示改读常量
- [x] 1.4 更新 i18n
```

### polish-r3-release-label（与 align-ge-me 联动）

```
## 1. 实现

- [x] 1.1 校级开关文案「第三轮选课新老生名额互释」；默认开；批次可覆盖
- [x] 1.2 校级规则页移除第一轮 r；容量细分改批次管理轮次
- [x] 1.3 互释并入规则表一行（CR205），去掉独立卡片
```
