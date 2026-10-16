## Why

选课多页搜索区主行与次行拆开，宽屏第一行右侧大片空白；次行条件即使主行有空位也不会上移。

## What Changes

- 公共搜索 CSS：略缩控件宽、流式换行。
- 我的课程、加退选申请/审批、选课监控、白名单、课程班名单：条件合并到同一 `search-fields`，次要项随收起显示/隐藏，放不下再换行。

## Non-goals

- 不改各页筛选字段语义与查询逻辑。
- 不强制改造未在图示范围内的其它列表页（可顺带受益于 CSS）。

## Capabilities

### New Capabilities

- `cr-search-bar-flow-layout`: 选课列表搜索区流式填满布局

### Modified Capabilities

- （无）

## Impact

- `list-page-search.css`、上述 6 个 View
