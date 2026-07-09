# 学籍信息 Tab：专业优先选择与联动

## 背景
当前学籍信息 Tab 要求先选专业层次、再选学院、再选专业，与业务录入习惯不符。用户希望以「专业」为入口，一次选择后自动带出专业代码、专业层次与学院。

## 变更内容
- 调整前四个字段顺序：**专业 → 专业代码 → 专业层次 → 学院**
- 专业为唯一可选手动下拉；专业代码、专业层次、学院为只读联动字段
- 选择专业（programme intake）后，由 `resolveEnrollmentByProgrammeIntakeKey` 写入 code、level、faculty 等
- 编辑已有学生时仍可通过 `inferProgrammeIntakeKeyFromEnrollment` 还原 programmeIntakeKey
- 学籍 Tab 字段 tooltip：入学批次、注册时间、学期

## 影响
- `studentEnrollmentOptions.js` — 新增全量专业 picker 选项
- `EnrollmentTab.vue` — 字段顺序、联动逻辑、移除层次/学院级联 watch、字段 tooltip
- `studentProfileFieldLabels.js` — intake / registrationTime / semester hint 定义
- `zh-flat.js` — tooltip 中文文案
- `student-profile` spec — 学籍 Tab 字段顺序、联动与 tooltip 行为
