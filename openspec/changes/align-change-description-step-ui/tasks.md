## 1. 数据层

- [x] 1.1 扩展 `courseChangeApplications.js` 中 `changeDescriptionComponents`：将全部 10 个组件的 `hint` 替换为 `majorCriteria[]`、`minorCriteria[]`（文案取自原型）
- [x] 1.2 确认 `createEmptyChangeDescription()` 默认值与校验逻辑不变

## 2. 切换组件

- [x] 2.1 新建 `ChangeLevelToggle.vue`：胶囊形 N/Y 开关，props `active` / `disabled`，激活态蓝色（#2563eb）
- [x] 2.2 支持只读模式（disabled，无 pointer events）

## 3. ChangeDescriptionStep 重构

- [x] 3.1 重写模板为三列表格：表头行 + 数据行（Component Name | Major Changes | Minor / No Changes）
- [x] 3.2 在各列切换下方以 bullet 列表渲染 `majorCriteria` / `minorCriteria`
- [x] 3.3 互斥切换逻辑：点击未激活列 → 设为 `major` 或 `minor`
- [x] 3.4 区块标题增加蓝色竖向强调条（MAIN COMPONENTS / OTHER COMPONENTS）
- [x] 3.5 表格样式：行边框、组件名列 `#fafafa` 背景、12px 灰色 criteria 文案

## 4. i18n

- [x] 4.1 在 `zh-flat.js` 为全部 criteria bullet 补充中文（10 组件 × major + minor 列表）
- [x] 4.2 补全表头 key：`Component Name`、`Major Changes`、`Minor / No Changes`

## 5. 验证

- [x] 5.1 视觉检查：Step 1 对齐原型布局（三列、胶囊切换、bullet criteria）
- [x] 5.2 功能检查：切换互斥、默认 minor、只读详情模式
- [x] 5.3 运行 `npm run build`
