## 背景

公共样式 `.cr-list-page .table-wrap { overflow-x: auto }`；本页表头 `nowrap`；`formatRosterClassTimeVenue` 用 `; ` 拼多时段，易撑宽。

## 决策

1. 本页覆盖：`overflow-x: hidden` + `table-layout: fixed; width: 100%`
2. 时间地点：模板按行渲染（复用 `displayClassTimeVenueLines` / meetings 映射），不改导出单行格式
3. Demo：`meetings` 截断为最多 2 段；`OWNER_POOL` 缩短

## 风险

- [窄屏信息变少] → title 悬停保留全文；导出完整
