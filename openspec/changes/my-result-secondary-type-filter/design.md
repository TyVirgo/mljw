## Decisions

1. 默认 `activeTypeTab = 'all'`；二级 UI 含 all + elective + required + other；all 文案用「全部」而非「全部课程」。
2. 列表：`listMyResultCoursesByType(activeTypeTab)`。
3. 课表：固定 `listMyResultCoursesByType('all')` + `schedulePreviewFinalHintAll`。
4. 搜索/重置不改变二级筛；切筛重置页码。
