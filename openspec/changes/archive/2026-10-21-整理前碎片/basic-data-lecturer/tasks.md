# 基础数据-教师与评教设置 — 任务清单（合并归档）

> 历史 tasks 已在各次 apply 中完成。本清单仅作追溯；**无需再次实现**。

- [x] 1. 合并本菜单下历史变更包为中文需求包
- [x] 2. 保留合并来源列表便于需求文档回溯
- [x] 3. 删除已被合并的旧变更目录

## 历史来源任务摘要

### add-evaluation-settings

```
## 1. 数据层

- [ ] 1.1 创建 `src/data/evaluationSettings.js`：默认设置、localStorage load/save、校验 helper、轻量 `applyEvaluationRules()`（仅演示）
- [ ] 1.2 在 lecturers 上补充可选 mock 字段：`hasTeachingRecord`、`previousCategory`（最小样例数据）
- [ ] 1.3 在 `zh-flat.js`、`locales/en.js`、`locales/zh.js` 补充 Evaluation Settings 页面 i18n

## 2. Evaluation Settings 页面

- [ ] 2.1 创建 `src/views/EvaluationSettingsView.vue`：page-card 布局（无搜索区）
- [ ] 2.2 实现全局 info 横幅（蓝色），文案本地化
- [ ] 2.3 实现 New Lecturer 区块：标题、说明、右对齐启用 toggle
- [ ] 2.4 实现 Change in Lecturer Category 区块：规则行（from/to 下拉、行内句式模板、Delete、规则 toggle）
- [ ] 2.5 接入 "+ Create" 追加规则；Delete 使用 `ConfirmDialog` 确认；category 选项来自 `categoryOptions`
- [ ] 2.6 右下角 Save 按钮：校验、持久化、成功提示，并调用 `applyEvaluationRules`

## 3. UI 组件与样式

- [ ] 3.1 复用或新增紧凑蓝色 ON/OFF toggle，对齐静态设计（与列表 Y/N 筛选区分）
- [ ] 3.2 规则行、区块标题、Save 底栏样式与 University Info / Lecturer 表单页一致
- [ ] 3.3 Delete 规则时使用 `ConfirmDialog` 二次确认（必需）

## 4. 应用集成

- [ ] 4.1 在 `App.vue` 注册 `EvaluationSettingsView`
- [ ] 4.2 在 `src/config/menu.js` 的 `developedPages` 加入 `evaluation-settings`
- [ ] 4.3 手动冒烟：中英文切换、编辑规则、Save、验证 Lecturer Information Requires Evaluation 标签与筛选

## 5. 验证

- [ ] 5.1 运行 `npm run build` 并修复 lint 问题
- [ ] 5.2 确认 Evaluation Settings 页面无搜索/查询 UI
```

### add-lecturer-information

```
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
- [ ] 4.5 Step 4：按年分组 CPD，可折叠面板、汇总统计、活动表格与 Evidence 链
```
