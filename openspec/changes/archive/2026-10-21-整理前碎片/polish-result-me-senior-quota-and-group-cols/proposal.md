## Why

选课结果第二/三轮课程维仍为一行一课，缺少与第一轮、在线选课一致的「课程分组 / 课程组」列；ME 批次「老生容量已选」亦无法查看该课老生年级占比配置，管理端核对配额不便。

## What Changes

- R2/R3 课程维对齐第一轮字段展示：**一行一课程分组**，课级列（序号、批次、代码、名称、学分、容量类、特殊新加）rowspan
- GE：增加「课程分组」列；ME：增加「课程分组」+「课程组」列（课程组展示对齐在线选课）
- ME：「老生容量已选」可点击，只读弹窗展示该课老生年级占比配置（同源 `resolveMeQuotaRowsForCourse`，参考批次「第一轮老生年级占比」）
- R1 ME 老生容量列同步可点（同一只读弹窗）

## Non-goals

- 不在结果页改写批次/课级 meQuota 配置（只读）
- 不改学生在线选课主表结构
- 不改特殊新加名单抽屉与删除/导出业务语义（仍按课聚合）
- 不把 GE 批次挂上 ME 年级占比弹窗

## Capabilities

### New Capabilities

- `result-me-senior-quota-and-group-cols`: 结果页 R2/R3 分组/课程组列与 ME 老生容量只读配额弹窗

### Modified Capabilities

- （无）

## Impact

- `RegistrationResultView.vue`
- `registrationResultByRound.js`（课→分组展平摘要）
- `MeQuotaRowsEditor.vue`（readonly）或新建只读弹窗组件
- `zh.js` / `en.js`
- 复用 `sectionTableRowSpans`、`resolveSelectionGroup` / `getSelectionGroupsForBatch`、`resolveMeQuotaRowsForCourse`
