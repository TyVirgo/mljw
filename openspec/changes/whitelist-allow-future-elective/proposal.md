## Why

白名单已有「允许添加未来学期必修课申请」（布尔全开未来必修）。选修侧需单独授权：勾选后声明可加未来学期 GE/ME 的学分额度，并对 ME 限定课程组类别；GE 按学生可选范围视为一大课程组，无需再选组。

## What Changes

- 新增权限 `allowFutureElective`，文案：「允许添加未来学期选修课申请」
- 勾选后必填：GE 学分、ME 学分；ME 课程组类别多选（沿用现有 4 类：课程4选3 / 3选2 / 2选1 / 普通）
- GE 不单独选组：符合该生校选/选课范围的 GE 视为一个大课程组
- 必修权限 `allowFutureMandatory` 保持原样、互不替代
- 加课池：有有效选修权限时纳入 futureSession 的 GE/ME（按学分与 ME 类别配置过滤）；无权限仍排除
- Demo：补充未来学期 GE/ME 样例课

## Non-goals

- 不改未来学期必修权限形态
- 不新建课程组数据源（用现有 ME 类别键与批次 selectionGroups 映射）
- 不接培养方案动态展开

## Capabilities

### New Capabilities

- `whitelist-future-elective`: 白名单允许未来学期选修课申请（GE/ME 学分与 ME 类别）

### Modified Capabilities

- （无）

## Impact

- `supplementListQueue.js`、`SupplementEntryDrawer.vue`
- `addDropEligibleCourses.js`、加课 tip / `StudentAddDropView`
- i18n zh/en
