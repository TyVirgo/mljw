## Why

加退 demo 的管理员代选 BUS201 把学期总抬到 30（GE 7/6），与期望的 29 不一致；右侧总学分青绿与学期橙/毕业蓝割裂；退课选择说明只有勾选合计，缺少「原来学期总 / 还剩」对照。

## What Changes

- 从 demo 确认课中移除管理员代选 BUS201，学分条回到 GE6 + ME14 + 必修9 = 29。
- 「学期已选总学分 / 毕业已选总学分」底色分别跟同行橙 / 蓝，去掉青绿覆盖。
- 退课选择说明改为：已选择 N 门，退课合计 X，原来合计学分 Y（基线学期已选总），还剩合计学分 Z（Y−X）。

## Non-goals

- 不删除课库/成绩单等其它 BUS201 引用（仅确认课 demo 代选段）。
- 不改加课/重修选择说明短句。
- 不撤销 `includeAdmin` 能力开关（无 admin 确认课后自然等于 29）。

## Capabilities

### New Capabilities

- `adddrop-strip-color-drop-meta`: 去 admin demo + 总学分行色 + 退课原来/还剩文案

### Modified Capabilities

- （无）

## Impact

- `studentDemoSeed.js`
- `AddDropTermCreditStrip.vue`
- `AddDropCoursePickerModal.vue`
- i18n zh/en
