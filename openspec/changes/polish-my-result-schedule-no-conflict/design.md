# 设计：polish-my-result-schedule-no-conflict

## Context

「我的选课」`finalScheduleSlots` = 必修 ∪ 在线确认（含 `syncAllVolunteerHitsToHistory` 写入的 R1 中签）。  
冲突：`IT102` Mon 09–11（`DEMO_ROUND`）∩ `AI110` `sec-ai110-1` Mon 10–12（课库 → 志愿中签）。

演示确认集大致占用：

| 日 | 已占 |
|----|------|
| Mon | 09–11 IT102；14–16 BUS301；16–18 BUS302 |
| Tue | 08–14 CST/COMP201；14–17 BUS201 |
| Wed | 09–11 MATH101；16–18 MPU402 |
| Thu | 08–12 CYS；14–16 COMP101 |
| Fri | 10–12 COMP101 |
| Sat | 18–20 PHYS101 |

## Goals / Non-Goals

**Goals:** 终态演示课表无同天时间重叠。

**Non-Goals:** 不改 UI、不改筛选、不改冲突 lane 逻辑。

## Decisions

1. **挪 AI110，不动 IT102**  
   - IT102 在加退 demo 多处硬编码 `Mon 09:00–11:00`；改 AI110 影响面更小。  
   - 替代：改 IT102 → 需同步加退文案，否决。

2. **新时段：`Fri 08:00–10:00`**  
   - 周五 08–10 空档，与 COMP101 Fri 10–12 相邻不重叠，且避开必修。  
   - 替代：`Thu 16–18` / `Wed 14–16` 也可；选周五上午便于视觉验收。

3. **改课库 `sec-ai110-1`**  
   - 志愿 `buildSelectedRowFromCatalog` 读课库；改班次后中签同步自然无冲突。  
   - `sec-ai110-2`（Wed 10–12）保持不动（未进确认集；且与 MATH101 会撞，勿误用）。

## Risks / Trade-offs

- [Risk] 在线选课若曾依赖 AI110 Mon 演示冲突 → Mitigation：本变更明确只保证「我的选课」终态无冲突；在线预览冲突仍可用其它课对。  
- [Risk] localStorage 旧种子仍带旧时段 → Mitigation：demo reseeding 条件或清缓存后刷新即可。
