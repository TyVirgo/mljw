## Decisions

1. **触发**：`listMyResultCoursesByType('all')` 中 `!hasScheduleTime` 的课程（演示含 INT300）。
2. **位置**：`ApplicationDetailDrawer` footer：`justify-content: space-between`，左提示、右关闭。
3. **文案**：含课号名称列表 +「不在本课表 / 主表可见 / 联系老师确认」。

## Risks

- footer 文案过长 → 左区 `flex:1` + 小字号换行即可。
