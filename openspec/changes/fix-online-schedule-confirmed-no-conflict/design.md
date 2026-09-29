## Context

在线选课课表预览：`buildPreviewSchedule` = 必修实线 ∪ 已确认实线（含 R1 公示 hit）∪ 本轮虚线。  
演示冲突根因：`DEMO` COMP101 含 `Fri 10–12`，R1 中签绑 `course-comp201` + `sec-2`（同为 `Fri 10–12`）。  
行级加入志愿已走 `getHardScheduleConflictGate`（R1 基线=必修）；「确认志愿顺序」`canConfirmOrder` 尚未复检硬冲突。

占用锚点（修完后仍须遵守）：

| 日 | 已占（实线） |
|----|----------------|
| Mon | IT102 09–11；BUS301 14–16；BUS302 16–18；AI110 若中签见课库 |
| Tue | BUS201 14–17 |
| Wed | MATH101 09–11；MPU402 16–18 |
| Thu | COMP101 14–16 |
| Fri | COMP101 10–12；AI110 08–10（中签） |
| Sat | PHYS101 18–20 |

## Goals / Non-Goals

**Goals:**

- 演示环境下，在线选课 R2（及结果页终态）实线层无同天时间重叠。
- R1：撞必修不可加入志愿；若列表中仍存在撞必修项，「确认志愿顺序」置灰并提示。
- R1 志愿互撞仍为软冲突。

**Non-Goals:**

- 不改课表 lane 算法。
- 不改 COMP201 `sec-1`/`sec-2` 作为加退「撞确认表」样例的时段（中签改绑空档班次即可）。

## Decisions

1. **中签改绑 `sec-3`（Wed 11–13），不挪 `sec-2`**  
   - `sec-2` Fri 10–12 仍服务加退冲突 demo。  
   - `sec-3` 不与必修/确认半池重叠。  
   - 替代：挪 COMP101 周五段 → 占用锚点牵连大，否决。

2. **同步三处种子班次**：`seedVolunteerSheetDemo` / `seedVolunteerResultSheetsDemo` / `seedVolunteerReleasedDemo` 中 `course-comp201` 的 `sectionId` 均为 `sec-comp201-3`。

3. **确认志愿硬闸：`getPendingVolunteersHardConflictGate`（`volunteerPendingConflict.js`）**  
   - 基线=必修（与行级 R1 硬闸一致）；避免经 `studentRegistrationScheduleConflict` 再引 store 造成环依赖。  
   - CartDrawer：`canConfirmOrder` 要求闸门 ok；失败时展示 `scheduleConflictHard`。  
   - `confirmVolunteerPreferenceOrder({ required })` 内再断言一次，防绕过 UI。

4. **文案**：沿用 `scheduleConflictHard`（已含课号/时段）；不另造「必修」专用键，除非验收要求。

## Risks / Trade-offs

- [Risk] localStorage 旧志愿仍带 `sec-2` → Mitigation：清缓存或 reseeding；验收时刷新。  
- [Risk] `sec-3` 4 学分可能触学分帽 → Mitigation：中签展示与加入志愿学分闸本就存在；确认集学分单独验收。  
- [Risk] 加退仍用 `sec-2` 撞 COMP101 → 属 Non-goal，保留。

## Migration Plan

- 纯前端 demo：改种子后硬刷新即可；无需后端迁移。

## Open Questions

- （无）R2 虚线 vs 已确认提示策略维持现状硬挡于提交行，本次不改课表角标规则。
