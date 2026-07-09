## 背景与动机

专业批次（Programme Intake）新增/编辑弹框在选专业创建批次时，用户无法看到该专业当前使用的是哪个 **已发布版本**；同时培养方案版本列表缺少直观的 **版本发布** 开关，无法标记 `isCurrent` 发布版本供下游（专业批次、学籍 Enrollment 联动）引用。产品要求在新增/编辑专业批次时，于专业列表 School 列后增加 **版本** 列，并可打开版本详情确认内容。

## 变更内容

### 培养方案版本 — 版本发布列

- 版本嵌套表格增加 **版本发布** 列（`YnSwitch`），列头可配置（`versionPublish`）
- 同一专业下 **仅一个** 版本可处于发布（`isCurrent: true`）状态；打开 A 时自动关闭同专业其他版本
- 新增 helper：`setProgrammeVersionPublished(programme, versionId, published)`

### 专业批次 — 新增弹框

- `ProgrammeIntakeCreateModal` 专业选择表格在 School 列后增加 **版本** 列
- 按行 `programmeCode` 解析已发布版本；有则显示 **版本详情** 链接，无则 `—`
- 点击链接打开 `ProgrammeVersionDetailModal`（`layered` 嵌套于新增弹框之上）

### 专业批次 — 编辑弹框

- `ProgrammeIntakeFormModal` 摘要表格同样增加 **版本** 列与 **版本详情** 链接
- 编辑弹框底部 Active 表单项布局与新增弹框对齐（`form-field-active` 结构）

### 数据与公共组件

- 新增 `getProgrammePublishedVersion(programme)` — 返回 `isCurrent` 版本，无则 `null`
- 新增 `findProgrammeByCode(code)` — 从 `initialProgrammes` 按 code 查找
- `ProgrammeVersionDetailModal` 增加 `layered` prop，嵌套时 `z-index: 1100`

## 能力范围

### 新增能力

- `programme-intake`：专业批次新增/编辑弹框展示已发布专业版本并可预览详情

### 修改的能力

- `programme-version`（增量，无独立 main spec 文件时以 delta spec 记录）：嵌套版本表版本发布 YnSwitch 与互斥发布逻辑

## 影响范围

- **修改**
  - `ProgrammeVersionView.vue` — 嵌套表版本发布列 + `YnSwitch`
  - `programmeVersions.js` — `getProgrammePublishedVersion`、`findProgrammeByCode`、`setProgrammeVersionPublished`
  - `programmeVersionColumnHeaders.js` — `versionPublish` 列头（若尚未注册）
  - `ProgrammeIntakeCreateModal.vue`、`ProgrammeIntakeFormModal.vue` — 版本列 + 嵌套详情 Modal
  - `ProgrammeVersionDetailModal.vue` — `layered` 层级
- **依赖**
  - 学籍 Enrollment 专业联动（`add-student-profile-crud` §16）读取 `programmeCatalogue`；发布版本供批次创建时人工确认，首版不做自动绑定批次记录

## 实现状态（2026-06-30）

- 培养方案版本发布列 + helper：`2fe6934` 起已落地
- 专业批次编辑弹框版本列：`2fe6934`
- 专业批次**新增**弹框版本列：`f12c2ea`
- 详见 `tasks.md` 全部勾选

## 非目标（本变更不做）

- 创建专业批次时自动写入 `programmeVersionId` 到批次记录（首版仅 UI 展示）
- 复制专业批次弹框增加版本列（后续按需）
- GitHub Pages / Vercel 部署流水线（基础设施，非业务原型规格）
