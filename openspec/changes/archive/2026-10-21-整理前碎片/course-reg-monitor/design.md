# 选课管理-选课监控 — 设计要点（合并）

## 文档用途

汇总历史 design 中与本菜单相关的决策与约束，供写需求文档时对照。冲突处以较新变更及当前代码为准。

## 来源：merge-academic-alert-into-monitor

## Context

`buildAcademicAlerts` 从 `registrationMonitorQueue` 投影；监控有详情/催选，预警有严重度/建议/类型筛与补注册直达。

## Decisions

1. **单表增强**：一人一行；`issues` 多类型以标签并列；建议取主类型（首条或最高严重度对应）  
2. **筛选**：`problemsOnly` + `severity` + `alertType` 叠在原有 programme/intake/status/keyword 上  
3. **统计**：保留原 6 卡，追加 high/medium；点击写入对应筛选  
4. **菜单**：移除 `cr-alert`（同 hide-report 软隐藏）  
5. **导览**：阶段 H 仅关联 `cr-monitor`；删 alert 节点与 monitor→alert  

## Risks

- [Risk] 表列变宽 → 横向滚动 / 建议列截断  
- [Risk] 旧深链 `cr-alert` → 未开放页  

## Open Questions

（无）

## 增量 2026-09

- 白名单：操作与建议列统一「加入白名单」口径，确认框可保留新生说明。
- 详情学分两段统一排版：本学期用 `termElectiveProgress` 作 GE/ME 总分帽 + `getTermGeElectiveCategoryBars` / `getTermGeCategoryBars`；毕业用 `getGraduationGeBars` / `getGraduationMeBars`（总分由类别求和）。UI 共用 `g1-bar` / nested，不引入新组件。
- 列表收敛：去掉「建议操作」列；本学期 GE/ME 分两列（`formatTermGeSummary` / `formatTermMeSummary`）；表头 `white-space: nowrap`。
- 详情去掉「问题清单」（类型已在主表）；提醒弹框按钮样式对齐 `ApplicationDetailDrawer` footer（Teleport 后自写 `.btn` 规则）。
- 主表再收敛：去掉状态 / 预警类型 / 毕业缺口列；「学分」改为毕业学分，数据用 `getMonitorGraduationInsight` 的 `earned/required`（`formatGraduationCreditsSummary`）；GE/ME 表头带「（已选/要求）」。
- 统计卡：`getMonitorStats` 平均学分改为毕业已修均值；去掉 belowMin/aboveMax 卡；筛选/表头 Intake→入学批次；加入白名单一律 `confirm`。
