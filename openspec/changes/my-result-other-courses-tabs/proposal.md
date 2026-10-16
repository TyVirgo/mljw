## Why

「我的课程」类型 Tab 仍为「全部课程结果 / 选修 / 必修 / 申请 / 管理员添加」，与页面命名不一致；课表四色也与即将合并的「其他课程」分类不对齐。

## What Changes

- Tab 改为：全部课程、选修课、必修课、其他课程（申请 ∪ 管理员添加）。
- 「我的课表」在全部视图下改为三色：必修课 / 选修课 / 其他课程；图例与副标题同步。
- 内部 `resultType` 仍可保留 application/admin，仅 Tab 过滤与着色层合并为 `other`。

## Non-goals

- 不改加退课课表预览文案（除非后续单独变更）。
- 不改列表列结构、去重优先级数值语义（必修 > 选修 > 管理员 > 申请 可保留）。

## Capabilities

### New Capabilities

- `my-result-other-courses-tabs`: 我的课程四 Tab + 三色课表图例

### Modified Capabilities

- （无）

## Impact

- `studentMyResultCourses.js`、`WeekScheduleGrid.vue`、`StudentMyResultView.vue`、zh/en i18n
