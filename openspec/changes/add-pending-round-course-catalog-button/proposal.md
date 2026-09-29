## Why

R1 待开放「查看课程」预览页已有完整课表，但缺少与正式选课列表同款的「课程一览」入口。学生需要在搜索栏与表格之间一键打开精简课程抽屉，点击课号查看详情，体验与 R1–R3 一致。

## What Changes

- 在 `StudentPendingRoundPreviewPanel` 搜索区与表格之间增加「课程一览」按钮。
- 点击打开既有 `StudentCourseCatalogDrawer`，课程源为当前预览批次/轮次可选课；课号经 `CourseCodeSourcePopover` 可看详情。

## Non-goals

- 不改入口时间轴按钮（不在「查看课程」旁再加按钮）。
- 不改正式列表顶栏「课程一览 / 我的课表」行为。
- 不开放待开放轮次的选课提交。

## Capabilities

### New Capabilities

- `pending-round-course-catalog`：待开放轮次预览页提供课程一览抽屉入口

### Modified Capabilities

- （无）

## Impact

- `src/components/courseRegistration/StudentPendingRoundPreviewPanel.vue`
- 复用 `StudentCourseCatalogDrawer.vue`、既有 i18n 键
- OpenSpec 本 change
