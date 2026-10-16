## Why

必修课加课现也有名额限制；原先为补「必修无名额列看不到原因」而加的「是否可选」列与选修「可选名额/总名额」重复，且名额列仍用「时间冲突」等短文案。应统一为一列：名额数字 + 不可选时展示完整原因。

## What Changes

- 删除加课/重修选课器「是否可选」列（申请侧选课弹框；审批明细本无该列）
- 加课必修 Tab 恢复展示「可选名额/总名额」（与选修一致）
- 名额列不可选时改用详细描述（冲突含对方课码时段、学分超限含数值等），取代短标签
- 重修选课器同步；重修顶部 tip 保留，措辞去掉对「是否可选」列的引用
- 覆盖/取代 `polish-adddrop-picker-selectable-tip` 的列策略，并反转 `align-adddrop-add-core-seat-retake-pools` 中「加课必修隐藏名额」

## Capabilities

### New Capabilities

- `adddrop-seat-detail-replace-selectable`: 名额列统一承载余量与详细不可选原因

## Impact

- `AddDropCoursePickerModal.vue`、i18n zh/en（重修 tip 文案）
