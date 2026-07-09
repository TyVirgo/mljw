## 1. 数据层

- [ ] 1.1 创建 `src/data/lecturers.js`：mock 记录（≥6 条，对齐原型）、选项枚举（category、title、academicPosition、degree、employmentStatus、gender、nationality、country）、ID helper、`normalizeLecturer()`
- [ ] 1.2 定义嵌套结构：`qualifications[]`、`workingExperiences[]`、`cpdByYear[]`，含 Loh Yoong Keong 等样例
- [ ] 1.3 创建 `src/utils/exportLecturerExcel.js`：导出 field 定义，对齐列表列

## 2. 列表页

- [ ] 2.1 创建 `src/views/LecturerInformationView.vue`：搜索栏（Staff ID、Name、Department、Category + More 行 Title、Academic Position、Degree、Employment Status）
- [ ] 2.2 新增评估筛选 toggle 行，接入筛选逻辑（AND + requiresEvaluation）
- [ ] 2.3 实现数据表格：全部列表列、Requires Evaluation 标签、行选择、Actions（Details、Edit、Delete）
- [ ] 2.4 工具栏：Create、Delete、Export、Sync Cache（提示）、Refers to EMS system（提示）
- [ ] 2.5 集成 `TablePagination`、`ConfirmDialog`、`ExportModal`

## 3. Create / Edit 向导

- [ ] 3.1 创建 `src/components/lecturer/LecturerFormModal.vue`：四步 Stepper 与导航（Cancel / Previous / Next / Confirm）
- [ ] 3.2 实现 Step 1：Personal Information + Employment Information + Others，必填字段校验
- [ ] 3.3 创建 `QualificationSection.vue`（Step 2）：学历卡片增删改，PDF 附件 mock
- [ ] 3.4 创建 `WorkingExperienceSection.vue`（Step 3）：工作经历卡片增删改，DatePicker
- [ ] 3.5 实现 Step 4 CPD 占位（说明文案，无手动录入）
- [ ] 3.6 接入 Create / Edit 模式：Edit 预填、保存/更新至父列表、Staff ID 重复校验

## 4. 详情 Modal

- [ ] 4.1 创建 `src/components/lecturer/LecturerDetailModal.vue`：四步只读 Stepper
- [ ] 4.2 Step 1：展示 Personal、Employment、附件下载卡片、Remarks
- [ ] 4.3 Step 2：列出学历及附件下载
- [ ] 4.4 Step 3：只读工作经历卡片
- [ ] 4.5 Step 4：按年分组 CPD，可折叠面板、汇总统计、活动表格与 Evidence 链接

## 5. 应用集成

- [ ] 5.1 在 `App.vue` 注册 `LecturerInformationView`（import、computed、template 分支）
- [ ] 5.2 在 `src/config/menu.js` 的 `developedPages` 加入 `lecturer-information`
- [ ] 5.3 手动冒烟：侧边栏进入、CRUD 流程、搜索/导出、详情四步浏览
