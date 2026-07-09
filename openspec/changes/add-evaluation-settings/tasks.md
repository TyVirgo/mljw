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
