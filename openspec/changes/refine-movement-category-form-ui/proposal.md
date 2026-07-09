## 背景与动机

异动类别编辑弹框当前将三个实施开关的功能说明以灰色文字常驻展示在开关下方，占用纵向空间；且「修改学籍状态 / 修改学籍类型」开关与「学籍状态 / 类别」下拉的联动语义与产品预期相反——开关 **开启** 时反而 **禁用** 下拉，开关 **关闭** 时始终展示下拉。产品要求：说明改为标签旁问号气泡；开关 **开启** 时才展示对应下拉并允许选择目标值；开关 **关闭** 时隐藏下拉但 **保留已存值**；列表与表单将「类别」统一为「学籍类型」。

## 变更内容

### 编辑弹框 — 功能说明（hint）

- 移除 `modifyStudentStatus`、`modifyStudentType`、`autoImplement` 开关下方的 `<p class="field-hint">` 常驻文案
- 在字段标签名称右侧增加 **问号图标**，hover / focus-within 显示气泡，文案复用现有 i18n：`modifyStudentStatusHint`、`modifyStudentTypeHint`、`autoImplementHint`
- 布局顺序：**字段名 ? : [开关]**（问号在标签列内，冒号后控件区为开关）

### 编辑弹框 — 开关与下拉联动（语义修订）

- `modifyStudentStatus === true` → 展示 **学籍状态** 下拉，可编辑，保存时必填
- `modifyStudentStatus === false` → **隐藏** 学籍状态下拉；数据层 **保留** 原 `studentStatus` 值，不做清空
- `modifyStudentType === true` → 展示 **学籍类型** 下拉，可编辑，保存时必填
- `modifyStudentType === false` → **隐藏** 学籍类型下拉；数据层 **保留** 原 `category` 值
- 移除 `:disabled="form.modifyStudentStatus"` / `:disabled="form.modifyStudentType"` 反向锁定逻辑

### 编辑弹框 — Row3 自适应布局

- 两个开关均 OFF → Row3 整行不渲染
- 仅学籍状态 ON → 学籍状态下拉 **单列满宽**（`grid-column: 1 / -1` 或等效）
- 仅学籍类型 ON → 学籍类型下拉单列满宽
- 两个均 ON → 恢复双列：学籍状态 | 学籍类型

### 文案统一

- 表单字段与列表表头：`movementCategory.fields.category` 中文由「类别」改为 **「学籍类型」**；英文由 `Category` 改为 **Track Category**（或 `Student Record Type`，与 track category 枚举一致）
- 列表页仍展示 `studentStatus` / `category` 列及现有值；仅标签描述变更，列数据与搜索逻辑不变

### 校验

- `validateMovementCategoryForm`：`studentStatus` 仅在 `modifyStudentStatus === true` 时 required；`category` 仅在 `modifyStudentType === true` 时 required

## 能力范围

### 修改的能力

- `movement-category-config`：编辑表单 hint 气泡、开关—下拉条件显隐、学籍类型标签、条件校验

## 影响范围

- **修改**
  - `MovementCategoryFormModal.vue` — tooltip、条件 `v-if`、Row3 自适应、移除 disabled 反向逻辑
  - `movementCategories.js` — 条件校验
  - `MovementCategoryView.vue` — 列表表头 i18n key（若直接引用 `fields.category` 则自动同步）
  - `src/i18n/locales/zh.js`、`en.js` — `fields.category` 文案
- **不变**
  - 种子数据结构、`modifyStudentStatus` / `modifyStudentType` 实施 mock 逻辑
  - 处理选课三 checkbox、允许学生申请、Set Reason
  - 列表列仍显示学籍状态与学籍类型值

## 非目标（本变更不做）

- 新增通用 `FieldHintTooltip` 公共组件（本变更可在弹框内联 CSS，与 `ProgrammeVersionCreateModal` 模式一致）
- 变更列表搜索字段或列顺序
- 变更 `category` 数据字段名（仍存 track category 枚举值）
- 恢复 Create 入口或删除功能
