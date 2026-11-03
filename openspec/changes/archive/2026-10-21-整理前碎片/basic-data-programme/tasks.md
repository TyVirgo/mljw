# 基础数据-培养方案与年级专业 — 任务清单（合并归档）

> 历史 tasks 已在各次 apply 中完成。本清单仅作追溯；**无需再次实现**。

- [x] 1. 合并本菜单下历史变更包为中文需求包
- [x] 2. 保留合并来源列表便于需求文档回溯
- [x] 3. 删除已被合并的旧变更目录

## 历史来源任务摘要

### add-programme-intake-planned-enrollment

```
## 1. 数据与校验

- [x] 1.1 `programmeIntakes.js`：字段 `plannedEnrollment`；seed 默认 120；create/edit 校验与 build 写入

## 2. UI

- [x] 2.1 `ProgrammeIntakeCreateModal`：Intake 下必填数字框
- [x] 2.2 `ProgrammeIntakeFormModal`：同步字段
- [x] 2.3 列头/文案（计划招生人数）
```

### add-school-elective-category

```
## 1. 数据

- [x] 1.1 校选类别枚举与院系/专业 demo 默认值
- [x] 1.2 专业 form programmeInfo.schoolElectiveCategory

## 2. 院系信息

- [x] 2.1 表单必填下拉（Email 与 Active 之间）
- [x] 2.2 主表列 + 详情展示

## 3. 专业版本

- [x] 3.1 步骤 1 必填下拉 + 校验
- [x] 3.2 主表列 + 列头配置
```

### refine-enrollment-cascade-programme-intake

```
## 1. 数据层

- [x] 1.1 扩展 `studentEnrollmentOptions.js`：级联选项、批次解析、编辑回显 infer
- [x] 1.2 在 `students.js` 增加 `programmeIntakeKey`、扩展 `validateStudentForm` 校验层次/学院/专业
- [x] 1.3 在 `programmeIntakes.js` 补充演示用 SWE、ACC 批次种子

## 2. 界面
- [x] 2.1 `StudentFormField.vue` 增加 `derived` 置灰样式
- [x] 2.2 重构 `EnrollmentTab.vue`：级联顺序、watch 清空、派生只读字段

## 3. 演示数据

- [x] 3.1 更新 `initialStudents` 演示学籍 enrollment 与批次对齐（含 programmeIntakeKey）

## 4. 规格

- [x] 4.1 编写 `specs/student-profile/spec.md` delta
```

### refine-programme-intake-published-version

```
## 1. 培养方案版本 — 发布逻辑

- [x] 1.1 `programmeVersions.js`：新增 `getProgrammePublishedVersion`、`findProgrammeByCode`、`setProgrammeVersionPublished`
- [x] 1.2 `ProgrammeVersionView.vue`：嵌套表增加版本发布列 + `YnSwitch` 接线
- [x] 1.3 `programmeVersionColumnHeaders.js`：注册 `versionPublish` 列头（若缺失则补）

## 2. 版本详情 Modal 嵌套

- [x] 2.1 `ProgrammeVersionDetailModal.vue`：新增 `layered` prop 与 `z-index: 1100` 样式

## 3. 专业批次 — 新增弹框

- [x] 3.1 `ProgrammeIntakeCreateModal.vue`：表格 Version 列 + 版本详情链接
- [x] 3.2 接入 `ProgrammeVersionDetailModal`（layered）；关闭新增弹框时重置详情状态
- [x] 3.3 空态 colspan 与 `min-width` 调整

## 4. 专业批次 — 编辑弹框

- [x] 4.1 `ProgrammeIntakeFormModal.vue`：摘要表 Version 列 + 版本详情链接
- [x] 4.2 Active 表单项布局对齐 `form-field-active` 结构
- [x] 4.3 接入 layered `ProgrammeVersionDetailModal`

## 5. 验证

- [x] 5.1 培养方案版本：切换发布开关互斥
- [x] 5.2 新增专业批次：选学院后表格显示版本列；有发布版本可开详情
- [x] 5.3 编辑专业批次：摘要行版本详情可开
- [x] 5.4 Node 18+ `npm run build` 通过
```
