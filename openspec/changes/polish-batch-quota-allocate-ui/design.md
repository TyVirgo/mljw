## Context

`BatchCourseQuotaAllocateModal` 用可改 `headFreshman/headSenior` + 手动 `splitByHeadcount`；确认时把同一对绝对名额写到所有勾选分组。`BatchCoursesDrawer` 用 `已选/容量` 分式展示。

## Decisions

1. 在册人数只读，取 `DEMO_HEADCOUNT`（展示用）。
2. 打开弹窗：优先回填目标已存新老配额；无已存则按 `splitQuotaByHeadcount` 初分。`auto*` 始终按公式计算，供 dirty 判断与「配额重置」。
3. 编辑校验：仅拦截 `senior + freshman > effectiveCap`；允许合计小于有效容量。写回只改 `quota`，不改 `capacity` / `totalCapacity`。
4. 多组保存：按弹窗绝对值写入；仅当某组合计超过该组容量时按比例压回。
5. 主表三列只渲染容量分母/配额；`enrichCourse` 不得因合计≠容量而强制重跑初分。
6. 弹窗公式条底色 callout；手改配额点确定先二次确认；页脚「配额重置」强制回填初分。

## Risks

- 多组容量不同时，弹窗预览的是第一组；确定后各组各自 clamp——依赖 callout 中的有效容量提示。
