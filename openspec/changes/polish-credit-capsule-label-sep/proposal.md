# 变更：polish-credit-capsule-label-sep

## Why

GE/ME 学分胶囊总分为「毕业学分(已选/要求)(ME)」后缀形式，且总分与课程组/分类明细之间缺少 `|` 分隔（规格曾要求但列表模板未挂上）。需改为类型码前置，并在总分与细分之间展示 `|`，各明细仍保留独立胶囊样式。

## What Changes

- **总分文案**：`ME毕业学分(已选/要求)` / `ME学期学分(已选/要求)`（GE 对称）；数字仍跟在标签后。
- **分隔符 `|`**：总分胶囊与其后第一颗明细胶囊之间；毕业行、学期行各一处。
- **入口卡同步**；明细胶囊仍各自一颗（未满橙/满绿不变）。
- **不合并**成单行长字符串胶囊。

## Non-goals

- 不改学分计算与胶囊色规则
- 不改课程组短名文案（课程组4选3 等）
- 不加退课选课页以外的无关页面（除非同源组件）

## Capabilities

### New Capabilities

- `credit-capsule-label-sep`：学分总分标签格式与总分–明细 `|` 分隔

### Modified Capabilities

- （无）

## Impact

- `src/i18n/locales/zh.js` / `en.js`
- `StudentRegisterView.vue`（列表顶栏 + 入口卡）
- OpenSpec 本 change
