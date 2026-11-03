## Why

加退课学分条「毕业必修已选」用历史 prior（如 54），与退课表本学期必修求和（9）不一致；确认口径排除 admin 代选导致条上总学分（29）与退课合计（30）差 1；右侧「已选总学分」跨行一格，无法分别表达学期总与毕业总。

## What Changes

- 「毕业必修已选」与「学期必修已选」同源（本学期可退/已选必修求和），拟退光本学期后归零；分母仍用培养方案要求。
- 学分条 GE/ME/总学分基线纳入可展示的 admin 代选课（如 BUS201），退课表继续展示代选，不隐藏。
- 右侧「已选总学分」拆成两行一列：「学期已选总学分」「毕业已选总学分」，分别为各自行选修+必修之和；青绿配色保持。

## Non-goals

- 不改为隐藏或禁止退 admin 代选课。
- 不把 tip「毕业累计未修」改回依赖 prior 必修已选（随毕业必修改同源后 tip 自动用新 current）。
- 不改退课选择说明文案键（仍用合计学分短句）。

## Capabilities

### New Capabilities

- `adddrop-credit-strip-admin-and-totals`: 必修同源 + admin 计入 + 总学分拆行

### Modified Capabilities

- （无）

## Impact

- `StudentAddDropView.vue`（termCreditStripBaseline）
- `studentRegistrationContext.js` / 学分 bar 取数（confirmed 是否含 admin）
- `addDropMultiItems.js`（strip 字段：学期总 / 毕业总）
- `AddDropTermCreditStrip.vue` + i18n zh/en
- 审批/详情若共用 strip 结构需兼容新字段
