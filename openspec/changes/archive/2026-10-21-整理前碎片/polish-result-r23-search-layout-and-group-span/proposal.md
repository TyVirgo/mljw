## Why

选课结果 R2/R3 搜索区标签在上、区间换行，与列表页横向搜索规范（图示 2）不一致；ME 课程组列位置偏后且同组重复展示，不利于按组扫读。

## What Changes

- 课程维搜索区：标签与控件同一行（对齐 `list-page-search` / 图示 2）；区间「标签 + 最小 至 最大」横排
- ME R2/R3：课程组列移到勾选后第一内容列；同组课程合并单元格（rowspan）；组内课排序相邻；分页尽量不拆组（groupAware）
- GE：无课程组列；搜索排版同样横向化

## Non-goals

- 不改筛选项语义与容量区间过滤逻辑
- 不改 R1 志愿表列结构
- 不改老生容量只读弹窗

## Capabilities

### New Capabilities

- `result-r23-search-layout-and-group-span`: 结果页搜索横向排版与 ME 课程组一级 rowspan

### Modified Capabilities

- （无）

## Impact

- `RegistrationResultView.vue`（搜索样式、R2/R3 表列序与分页）
- `sectionTableRowSpans.js`（组级 selectionGroup 列 span）
