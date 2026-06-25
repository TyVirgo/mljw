## 1. 数据层

- [x] 1.1 创建 `movementStatisticsColumns.js`：11 计数 key、`SOURCE_TO_COLUMN`、supplement 列集合
- [x] 1.2 创建 `movementStatisticsSeeds.js`：15–25 条 supplement，覆盖约 6 个分组、后 7 列合理非零
- [x] 1.3 实现 `resolveStatDimensions` + `SCHOOL_CODE_MAP`（复用 programme 映射）
- [x] 1.4 创建 `movementStatisticsQueue.js`：`buildStatisticsRows`（非 Draft 聚合 + supplement merge）
- [x] 1.5 复用/对齐 `filterQueryBySearch`；supplement 平行 5 字段过滤；**applicationSession** 口径

## 2. 导出

- [x] 2.1 创建 `movementStatisticsExportFields.js`（3 维度 + 11 计数列）
- [x] 2.2 创建 `exportMovementStatisticsExcel.js`（xlsx，模式对齐 exportMovementQueryExcel）
- [x] 2.3 ExportModal 三档范围：当前页 / 全部 / 选中行

## 3. i18n

- [x] 3.1 `movementStatistics.columns.*`（School Code、Programme Code、Intake、11 计数列）
- [x] 3.2 搜索 label 复用或新增 `movementStatistics.search.*`

## 4. 列表页

- [x] 4.1 创建 `MovementStatisticsView.vue`：双行搜索 + 收起（默认展开）
- [x] 4.2 聚合宽表（图示1–2 列序）、横向滚动、无行操作
- [x] 4.3 勾选列 + Export 工具栏 only
- [x] 4.4 集成 `ExportModal` + `TablePagination`
- [x] 4.5 确认无 Details / Edit / 实施 / Delete / 写操作

## 5. 路由与菜单

- [x] 5.1 `studentRecordsDevelopedPages` 加入 `sr-movement-statistics`
- [x] 5.2 `App.vue` import + `isMovementStatistics` + 渲染 `MovementStatisticsView`

## 6. 验证

- [x] 6.1 冒烟：约 6 个有过异动的分组行可见
- [x] 6.2 Session 过滤：applicationSession 生效；前 4 列与查询同条件可对照
- [x] 6.3 后 7 列 supplement 显示合理非零 mock
- [x] 6.4 Export：当前页 / 全部 / 选中行 → xlsx
- [x] 6.5 搜索收起：次行 Student ID/Name 可隐藏
- [x] 6.6 `npm run build` 通过

## 7. 搜索：专业代码替换异动原因

- [x] 7.1 `filterStatisticsSeeds` + `filterQueryBySearch`：`programmeCode` 替换 `movementReason`
- [x] 7.2 `MovementStatisticsView.vue`：首行原因 → 专业代码
- [x] 7.3 i18n：`movementStatistics.search.programmeCode`
- [x] 7.4 冒烟 + `npm run build` 通过

## 8. 菜单暂缓：隐藏学籍异动统计

- [x] 8.1 `studentRecordsMenu.js`：移除 `sr-movement-statistics` 菜单项
- [x] 8.2 `studentRecordsDevelopedPages`：移除 `sr-movement-statistics`
- [x] 8.3 确认侧栏无统计入口；`MovementStatisticsView` 代码保留
- [x] 8.4 `npm run build` 通过
