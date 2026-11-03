## 1. i18n

- [x] 1.1 在 zh.js / en.js 增加 `courseRegistration.result.selectionResult`（选课结果 / Selection result）

## 2. 学生维主表

- [x] 2.1 RegistrationResultView 导入并使用 formatStudentResultPreferenceLabel、formatStudentOperatorDisplay
- [x] 2.2 主表增加四列；结果列表头改用 selectionResult；空行 colspan 更新为 12
- [x] 2.3 调整 student-dim-table 样式：auto 布局、长文本省略、冻结偏移保持

## 3. 详情对齐

- [x] 3.1 ResultStudentDetailDrawer 结果行标签改用 selectionResult
