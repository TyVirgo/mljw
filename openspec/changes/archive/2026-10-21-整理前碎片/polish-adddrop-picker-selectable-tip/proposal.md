## Why

加课选课器在「必修课」Tab 隐藏名额列后，灰色不可选行看不到原因；重修选课器缺少与加课同类的「替换规则」顶部说明，学生不清楚必修仅同课、公选/专选可组内替代。

## What Changes

- 加课（含加退）与重修选课表增加「是否可选」列：可选显示「是」，否则显示不可选原因（复用现有冲突/已满/超学分等同课同组逻辑）
- 选修/重修仍保留「可选名额/总名额」列；必修加课仅出「是否可选」
- 重修选课弹框顶部增加替换规则温馨提示（版式对齐加课 eligibility tip）

## Capabilities

### New Capabilities

- `adddrop-picker-selectable-tip`: 是否可选列 + 重修替换说明 tip

## Impact

- `AddDropCoursePickerModal.vue`、i18n zh/en
