## Why

课程变更申请向导 Step 1（变更说明）已实现基础功能，但 UI 布局与原型差距较大：当前为两列简化布局（组件名 + 单行提示 + 矩形 N/Y 按钮），原型要求标准三列表格（组件名 | 重大变更 | 轻微/无变更），每列含 pill 开关与分项说明 bullet list。老师无法清晰对照原型中的变更判定标准进行选择，影响申请准确性与审批一致性。

## What Changes

- 重构 `ChangeDescriptionStep.vue` 为三列表格布局，含表头行（Component Name / Major Changes / Minor / No Changes）
- 将 `changeDescriptionComponents` 数据结构扩展为每行独立的 `majorCriteria[]` 与 `minorCriteria[]` 说明文案（对齐原型英文原文）
- 将 N/Y 矩形按钮替换为 pill 形 Toggle Switch（互斥：选中列 Y 蓝色，未选中列 N 灰色）
- 分区标题（MAIN COMPONENTS / OTHER COMPONENTS）增加左侧蓝色竖条装饰
- 只读模式（详情页）同步展示三列结构与选中状态
- 补充 i18n 翻译（中英文）覆盖全部 criteria bullet 文案

## Capabilities

### New Capabilities

（无 — 本变更为既有能力的 UI 对齐，不引入新业务域）

### Modified Capabilities

- `course-change-application`: 细化「变更说明标注」需求 — 明确三列表格结构、每组件 major/minor 判定标准文案、Toggle Switch 交互与视觉规范

## Impact

- `src/components/courseChange/ChangeDescriptionStep.vue` — 模板与样式重写
- `src/data/courseChangeApplications.js` — `changeDescriptionComponents` 数据结构扩展
- `src/i18n/zh-flat.js`（及 en 如有）— 新增 criteria 文案 key
- 无 API / 数据模型 breaking change（`changeDescription` 仍存 `'major' | 'minor'`）
