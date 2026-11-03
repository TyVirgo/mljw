# 选课管理-选课日志 — 设计要点（合并）

## 文档用途

汇总历史 design 中与本菜单相关的决策与约束，供写需求文档时对照。冲突处以较新变更及当前代码为准。

## 来源：add-registration-log

## Context

选课结果页展示「谁最终选上了什么」；选课日志展示「每一次尝试」（含失败）。挂在「结果与预警」下、紧挨选课结果。

## Goals / Non-Goals

**Goals**

- 管理端可查全校选课操作轨迹
- 筛选与导出对齐现有列表页模式
- Demo 与批次/学生/课程实体一致，覆盖操作×结果矩阵

**Non-Goals**

- 实时写入学生选课/管理端代选事件（静态种子）
- IP 采集与脱敏

## Decisions

| 决策 | 说明 |
|------|------|
| 菜单位置 | `cr-result-group` 内，`cr-result` 与 `cr-alert` 之间；id = `cr-log` |
| 页面形态 | 单列表页，筛选 + 导出 + 分页表 |
| 时间筛选 | 第一行：学号/批次/课程/操作人/结果 + 查询重置；**第二行**：操作时间 `[开始] 至 [结束]` 联动区间；开始>结束时查询自动对调 |
| Demo 规模 | 约 25 条，覆盖操作×结果并分散日期便于分页演示 |
| 列 | 批次、学号、姓名、课程、**分组名称**、操作人、操作时间、备注、操作名称、操作结果（**无 IP**） |
| 分组名称 | 存 `sectionCode`（如 `01`），展示 `courseRegistration.courses.sectionNameDisplay` |
| 结果枚举 | `success` / `failure` |
| 操作名称 | `register` / `drop` / `adminAdd` |
| Demo 对齐 | 批次 `batch-2504-m1`；学生取自结果/名单（如 SWE2409001）；课程取自 `selectableCourses`（COMP201、IT102、ENGL201 等） |

## Demo 覆盖矩阵

| 操作 | 结果 | 典型备注 |
|------|------|----------|
| register | success | 选课成功 |
| register | failure | 超出一门限制 / 时间截止 / 课程已满 |
| drop | success | 退课成功 |
| adminAdd | success | 管理端代选成功 |
| adminAdd | failure | 代选失败（如目标班已满） |

## File Impact

```
src/config/courseRegistrationMenu.js
src/App.vue
src/views/.../RegistrationLogView.vue
src/data/.../registrationLog.js
src/data/.../courseRegistrationExportFields.js
src/utils/exportCourseRegistrationExcel.js
src/data/.../courseRegistrationModuleBriefs.js
src/i18n/locales/zh.js / en.js
```

## Risks

- Demo 与真实选课动作未联动：可接受，后续可接 store 写入。

## 来源：enrich-registration-log-round-monitor

## Decisions

1. 轮次 Tab：第一/二/三轮；切换重置页码。
2. 统计七卡平铺，无分组标题；demo 按轮次。
3. 方案甲四态结果；排队情况列在操作结果前，两列右冻结；无操作名称列。
4. 仅 `queueStatus === queuing` 显示纯文本顺位 `#N`（无卡片、无「您当前排名」）；已取消显示「已取消」；其余 —。
5. 搜索第二行（操作时间）默认收起，查询/重置旁「更多/收起」切换；仅选课日志页。
6. 表格横滑 + nowrap。
7. 主表在课程列后增加学分、课程类型（demo 写入日志行；类型用 `getRegistrationTypeLabel`）；导出字段同步。
8. 统计末两卡：`coursesWithCapacity`（有余量/未选满）、`coursesFull`（已满）；替换原成功/失败选课课程数量；仍为按轮次 demo。
9. 操作结果展示文案按轮次：第一轮 success→待分配、failure→选课失败；第二/三轮 success→选课成功、failure→选课失败；queuing/cancelQueue 不变。筛选下拉与导出使用同一套轮次文案。

## 增量：先批次后轮次（2026-07）

## Decisions

1. **双下拉**：页顶批次 → 轮次；去掉原三轮 Tab。
2. **轮次范围**：`listConfiguredRoundKeys` / 已配置时间；默认 `getStudentDefaultRoundKey`。
3. **搜索**：注释去掉批次关键词；过滤用 `batchId` 精确匹配。
4. **统计**：`getRegistrationLogStats(batchId, roundKey)`；主批用原 demo，其它批按系数缩放。
5. **宽度**：批次/轮次下拉 `measureSelectWidth` 自适应。

## 增量：右冻结列无缝（2026-07）

## Decisions

1. **两列仍右冻结**：排队情况在左、操作结果贴右。
2. **无缝**：为两列设固定 `width`/`min-width`；`col-queue` 的 `right` 等于操作结果列宽；表头背景与左侧阴影，避免横滑内容从两列之间露出。

## 增量：搜索区并入批次轮次 + 列调整（2026-08）

### Decisions

1. **位置**：去掉独立 `cr-log-context-bar`；批次、轮次作为搜索区 `.search-fields` 的前两项。
2. **宽度**：继续 `measureSelectWidth` 写 inline `width`，覆盖搜索区默认 180px；`flex-shrink: 0`。其余筛选项 wrap。
3. **重置**：只清空学号/课程/操作人/结果/时间，不重置批次与轮次。
4. **列顺序**：序号、批次名称、学号、姓名、课程、分组名称、学分、课程类型、操作人、操作时间、排队情况、操作结果。
5. **备注**：主表与导出均去掉 `remark`。
6. **Demo**：主批 `batch-2504-m1` 默认轮（第一轮）不少于 25 条；`pageSize` 默认 20。
