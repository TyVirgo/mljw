## Why

当前学籍新建/编辑抽屉将 **Student Category** 作为顶栏手选 radio，**Nationality（国籍）** 却放在 Basic Info Tab 内的普通文本框，两者无联动。业务上应先确定国籍，再按规则自动带出学生类别并展示对应字段；现有交互与 StudentSys 原型及异动模块已有的 `inferStudentCategory` 推断逻辑不一致，易造成类别选错、字段填错。

## What Changes

- 新建/编辑抽屉重构为两段式布局：
  - **国籍信息**：可搜索国籍下拉 + 只读学生类别（自动带出，不可手选）
  - **信息填写**：原有七 Tab（Basic Info → … → Others）
- 国籍 → 类别映射规则：**Malaysia = Local，China = China，其他任何国籍 = International**
- 国籍控件改为 **可搜索下拉**，全球通用国籍列表；**Malaysia、China 置顶**，其余按字母序
- **新建**时国籍未选前，七 Tab 内不展示可填字段（空白/占位提示）；选择国籍后按类别显隐各 Tab 字段
- **编辑**时预填国籍与类别；修改国籍若导致类别变化，确认后清空互斥字段并重算类别
- Basic Info Tab 内 **移除重复的国籍输入**（上移至「国籍信息」区）
- 详情 Drawer 同步两段式只读布局
- 抽取统一的 `resolveCategoryFromNationality()`，与异动模块 `inferStudentCategory` 对齐
- **BREAKING（交互）**：移除顶栏 Student Category radio；新建默认不再假定 Local

## Capabilities

### New Capabilities

（无新增独立 capability；变更集中在既有 student-profile 能力内）

### Modified Capabilities

- `student-profile`：新建/编辑/详情表单的国籍优先录入、类别自动推导、分区标题、未选国籍空态、编辑改国籍确认与字段清理

## Impact

- `src/components/studentRecords/StudentProfileFormDrawer.vue` — 布局与国籍/类别交互
- `src/components/studentRecords/StudentProfileDetailDrawer.vue` — 详情同步布局
- `src/components/studentRecords/tabs/BasicInfoTab.vue` — 移除国籍字段、字段分组排版
- `src/components/studentRecords/tabs/*.vue` — 未选国籍时的空态 gate（或通过 Drawer 传 `nationalitySelected`）
- `src/data/students.js` — 推导函数、默认空 category、校验国籍必填
- `src/data/nationalityOptions.js`（新）— 全球国籍列表
- `src/components/common/SearchableSelect.vue`（新，或等价组件）— 可搜索下拉
- `src/data/movementApprovalEngine.js` — 复用统一推导函数
- `src/i18n/locales/zh.js`、`en.js` — 国籍信息、信息填写、占位提示等文案

## Non-goals（非目标范围）

- Excel 导入模板列结构改造（仍保留 Student Category 列；一致性校验可后续迭代）
- 后端 API 或真实 codeSet 接口对接
- 列表页 Student Type 筛选项变更
- 异动申请表单中国籍字段交互改造（仍只读展示，继续复用推导逻辑）
