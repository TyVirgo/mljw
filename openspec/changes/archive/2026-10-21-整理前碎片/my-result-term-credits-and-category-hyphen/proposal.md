## Why

「我的课程」需在「我的课表」旁展示本学期累计学分；统一课程类别展示需由 GE01 改为 GE-01（ME 同理），菜单与详情凡走统一类别展示处一并调整。

## What Changes

- 我的课程工具条：「我的课表」右侧展示「本学期累计学分：{n}分」（本学期全部已选必修+选修学分和，不受 Tab/搜索筛选影响）。
- `formatUnifiedCourseCategoryLabel` 将 GE01–GE04 / ME01–ME04 展示为 GE-01…；筛选项 label 同步；内部码仍为 GE01。
- 相关 tip / 入口短标签等展示文案改为带连字符。

## Non-goals

- 不改筛选 value 与比对逻辑（仍用 GE01）。
- 不改学分业务帽计算。

## Capabilities

### New Capabilities

- `my-result-term-credits-category-hyphen`: 本学期累计学分 + 类别连字符展示

### Modified Capabilities

- （无）

## Impact

- `StudentMyResultView.vue`
- `unifiedCourseCategory.js`
- i18n zh/en（tip、GE 短标签等）
