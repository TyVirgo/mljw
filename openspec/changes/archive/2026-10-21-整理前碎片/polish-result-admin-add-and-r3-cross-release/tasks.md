## 1. 选择学生表头全选

- [x] 1.1 `AdminAddStudentPickModal` 表头增加全选复选框，勾选/取消作用于当前筛选全部学生（跨页）

## 2. 学生维课程来源筛选

- [x] 2.1 `emptyStudentSearch` / 搜索表单增加 `courseSource`；`filterStudentResults` 精确匹配
- [x] 2.2 `RegistrationResultView` 学生维搜索区增加课程来源下拉（全部 + 四类来源）

## 3. 代选原因与附件

- [x] 3.1 `AdminAddCourseForStudentModal` 增加必填原因、可选附件；确定时校验原因
- [x] 3.2 `addAdminStudentRegistrations`（及调用链）写入 `adminAddReason` / 附件元数据

## 4. 第三轮互释时间展示

- [x] 4.1 课程维第三轮工具栏导出旁只读展示互释标签 + `resolveEffectiveCrossReleaseAt`（空则 —）
- [x] 4.2 补充 zh/en 文案（若缺）

## 5. 验收

- [x] 5.1 对照 spec 四条场景自检勾选 tasks
