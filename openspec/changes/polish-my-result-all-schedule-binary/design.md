## Context

曾将我的选课课表收成必修/选修双色；现改为四色以对齐「多类型选课结果」可读性。

## Decisions

1. **`resolveMyResultScheduleLayer`**：`required | elective | application | admin`；`buildMyResultSchedule` 使用该层。
2. **`resolveBinaryScheduleLayer`**：内部委托四色解析后折叠为必修/选修，供监控演示保留双色。
3. **图例**：`myResult` 固定四项色块（紫 / 蓝 / 橙 / 青），样式沿用既有 `is-application` / `is-admin`。
4. **说明**：全部 Tab 用 `schedulePreviewFinalHintAll`（四色）；其它 Tab 用类型过滤 hint。
