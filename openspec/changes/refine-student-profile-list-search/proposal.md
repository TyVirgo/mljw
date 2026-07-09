# 学生基本信息列表搜索与表格优化

## 背景
学籍管理人员需要在学生基本信息列表中快速模糊检索（学号、姓名、NRIC、电话等），并通过多维度下拉筛选；主表需展示国籍、欠费、学籍状态等关键字段，并在横向滚动时冻结序号/学号/姓名列。

## 变更内容
- 统一模糊搜索框（Student ID | Name | Chinese Name | NRIC | Phone，OR 匹配）
- 第一行下拉：Programme、Intake、Status（Status 取 Status Log 最新一条）
- 折叠区：Student Type、Nationality、Registration Time、Programme Level、Programme Structure、Expected Completion Batch、Expected Graduation Batch、Outstanding Fee、Student Pass Expiry 日期范围
- 主表补列：Status、Nationality、Outstanding Fee；Status 来自最新 Status Log；Student Type = Student Category
- **搜索字段与列表列对齐**：搜索区出现的字段（含 keyword 的 NRIC/Phone 与折叠区 Registration Time 等）主表均展示，便于筛后核对
- 左侧冻结：复选框、序号、学号、姓名
- Programme Level 展示与筛选统一为 Foundation / Undergraduate / Postgraduate（去掉 L3-/L6- 等 catalogue 前缀；与 Enrollment 表单一致）
- 不改新建表单（Application No 保留，Phone 仍在 Contact）

## 影响
- `src/data/students.js` — 扁平字段、最新状态、筛选 helpers
- `src/views/studentRecords/StudentProfileView.vue` — 搜索 UI、表格列、sticky、Programme Level 展示
- `src/utils/formatProgrammeLevel.js` — Programme Level 归一化与展示
- `src/data/students.js` — Programme Level 筛选归一化比较
- `src/utils/exportStudentProfileExcel.js` — 列表导出列
- `src/i18n/locales/en.js`、`zh.js`
