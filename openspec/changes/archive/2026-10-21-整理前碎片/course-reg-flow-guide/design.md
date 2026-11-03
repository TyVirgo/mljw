# 选课管理-流程说明 — 设计要点（合并）

## 文档用途

汇总历史 design 中与本菜单相关的决策与约束，供写需求文档时对照。冲突处以较新变更及当前代码为准。

## 来源：move-flow-guide-and-register-page-size

## Context

菜单见 `courseRegistrationMenu.js`；流程说明原在菜单顶部 `cr-guide-group`。在线选课 `pageSize` 默认 10。

## Decisions

1. 将 `cr-guide-group`（含 `cr-flow-guide`）整组移到 `cr-result-group` 之后。
2. 一级标题 `menu.crGuideGroup` 附带「正式页面可以去掉」；子项「流程说明」文案不变。
3. `StudentRegisterView` 默认 `pageSize = 20`。

## Risks

- 无；路由 id 不变。
