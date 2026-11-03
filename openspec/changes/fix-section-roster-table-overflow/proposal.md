## 为何

课程班学生名单列多、上课时间地点多段单行拼接，易出现左右横向滚动条，演示观感差。

## 变更说明

- 名单表本页禁止横向滚动；`table-layout: fixed` 约束列宽
- 长文本列（课程班名称、姓名、修读方式、任课教师、负责人等）缩略 + `title` 全文
- 上课时间地点按时段分行展示，过长行内 ellipsis；导出仍用完整单行串
- Demo：课班 meetings 至多保留 2 段；负责人用较短姓名

## 非目标

- 不改筛选项与导出字段集合
- 不改公共 `.cr-list-page .table-wrap` 全局策略（仅本页覆盖）

## 能力

### 新增能力

- `section-roster-table-layout`：课程班学生名单表无横滑与长列展示

### 修改能力

- （无）

## 影响

- `SectionStudentRosterView.vue`
- `sectionStudentRoster.js`（demo 收窄）
