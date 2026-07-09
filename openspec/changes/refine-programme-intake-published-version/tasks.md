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
