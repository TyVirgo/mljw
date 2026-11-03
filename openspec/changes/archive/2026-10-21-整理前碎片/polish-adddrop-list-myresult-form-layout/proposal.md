## Why

学生加退课列表账单筛多余；我的课程累计学分不够醒目；申请弹框重修类型提示冗余；申请信息学期与三是否排版浪费空间。

## What Changes

- 学生加退课列表去掉「账单」搜索条件（审批端保留）。
- 我的课程「本学期累计学分」整句加粗放大一号，分数部分红色。
- 申请弹框去掉重修类型前置提示文案。
- 申请信息：学年学期 + 三是否同一行四字段。

## Non-goals

- 不改审批端账单筛选。
- 不改重修类型切换清空已选课的行为逻辑。

## Capabilities

### New Capabilities

- `adddrop-list-myresult-form-layout`: 列表/我的课程/申请弹框布局与文案微调

### Modified Capabilities

- （无）

## Impact

- `StudentAddDropView.vue`、`StudentMyResultView.vue`、`AddDropApplicationFormSections.vue`、i18n（可选拆分学分文案）
