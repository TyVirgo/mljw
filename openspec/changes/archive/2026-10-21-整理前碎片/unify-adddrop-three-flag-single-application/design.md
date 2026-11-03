## Context

现网用 `primaryType` + `needDrop` 推导 action，且禁止加+重修同单；加/重修共用 `addLines`。二次互斥按主类型三分。

## Goals / Non-Goals

**Goals:** 三是否驱动分区；一单可组合；详情/审批类型文案同步；整单二次禁交。

**Non-Goals:** 不重做审批业务规则。

## Decisions

1. **表单 flags**：`needDrop` / `needAdd` / `needRetake` ∈ `{yes,no}`，默认 `no`；至少一 `yes`。
2. **action 推导**：由 flags → `Drop|Add|Retake|AddDrop|RetakeDrop|AddRetake|AddDropRetake`。
3. **行集合**：`dropLines` / `addLines` / `retakeLines`；学分条 `addCourses = addLines ∪ retakeLines`。
4. **类型展示**：`resolveAddDropIntentFlags(app)`（优先存盘 flags，否则扫 items）→ `退课+加课+重修` 拼接；详情/审批/列表共用。
5. **二次限制**：`pendingLedgerApps.length > 0` 即禁交；文案改为整单再交限制；表单可看、操作锁。

## Risks / Trade-offs

- [Risk] 列表筛「加课」对组合单 → Mitigation：`matchesPrimaryTypeFilter` 按 flags/items 判断是否含该意图。
- [Risk] 旧 primaryOption「加课（退课）」文案 → 学生端不再用；详情改用 flag 拼接。
