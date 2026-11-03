## Why

学分条「已选总学分」与学期橙/毕业蓝不够区分；退课选课弹窗仅显示「已选择 N 门」，未体现退课合计学分，易与学分条「退后剩余」口径混淆。

## What Changes

- 「已选总学分」列改用青绿底，与学期橙、毕业蓝明显区分。
- 退课（及加退选退）选课弹窗选择说明改为：「已选择 {count} 门课程，退课合计学分{credits}分」。
- 学分条仍按「基线 − 拟退 = 退后剩余」；用合计学分文案对齐列表勾选，不改为拟退分项展示。

## Non-goals

- 不把学分条改成展示拟退学分分项。
- 不加课/重修选择说明仍用原短句（可无合计学分）。

## Capabilities

### New Capabilities

- `adddrop-drop-picker-credit-meta`: 总学分配色 + 退课选择说明

### Modified Capabilities

- （无）

## Impact

- `AddDropTermCreditStrip.vue`
- `AddDropCoursePickerModal.vue`
- i18n zh/en
