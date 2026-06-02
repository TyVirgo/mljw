## Why

Lecturer Info → **Evaluation Settings**（评估设置）菜单目前为占位页，无法配置教师教学评估的触发规则。该页面是标记「需评估教师」（Requires Evaluation）的业务来源之一，需尽快提供与静态原型一致的全局规则与类型变更规则配置能力，以支撑 Lecturer Information 列表中的评估筛选与标签展示。

## What Changes

- 新增 **Evaluation Settings** 配置页：无搜索区，单页表单式布局（参考中英文静态设计图）
- **全局提示横幅**：说明新入职教师或教师类型变更会触发评估需求
- **New Lecturer（新入职教师）**：区块标题、说明文案、全局启用/禁用开关
- **Change in Lecturer Category（教师类型变更）**：可增删多条规则行，每行包含：
  - 变更前类型（Category change from / 教师由）
  - 变更后类型（to / 变更为）
  - Delete（删除）
  - 规则启用/禁用开关
- **+ Create / + 新增**：新增一条类型变更规则（默认空 from/to，启用态可配置）
- **Save / 保存**：右下角主按钮，持久化配置；首版使用本地 mock / localStorage
- 将 `evaluation-settings` 加入 `developedPages`，并在 `App.vue` 注册视图
- 保存成功后可选轻量更新 mock `requiresEvaluation`（新入职 = 有入职时间 + 无授课记录；类型变更 = previousCategory 匹配），**不过度实现规则引擎**
- **本页无查询检索功能**（系统配置页，非列表页）

## Capabilities

### New Capabilities

- `evaluation-settings`: 教师评估规则配置——全局新入职评估开关、类型变更规则 CRUD、规则行启用/禁用、保存与 mock 持久化、保存后刷新评估标记

### Modified Capabilities

- `lecturer-information`: `requiresEvaluation` 字段由 Evaluation Settings 保存后的规则计算结果驱动（mock 阶段客户端重算，非手工编辑）

## Impact

- **新增文件**
  - `src/views/EvaluationSettingsView.vue`
  - `src/data/evaluationSettings.js`（默认规则、校验、load/save、applyRulesToLecturers）
- **修改文件**
  - `src/App.vue` — 注册 `evaluation-settings` 视图
  - `src/config/menu.js` — `developedPages` 加入 `evaluation-settings`
  - `src/data/lecturers.js` — 暴露可被规则引擎更新的 lecturers 列表（或 evaluationSettings 回调更新）
  - `src/i18n/zh-flat.js`、`src/i18n/locales/en.js`、`src/i18n/locales/zh.js` — 页面文案（若尚未覆盖）
- **复用组件**
  - `YnSwitch` 或项目内蓝色 Toggle 样式、`ConfirmDialog`（删除规则确认，可选）
- **无后端依赖**：首版 mock；人事入职/类型变更事件对接留作后续集成
