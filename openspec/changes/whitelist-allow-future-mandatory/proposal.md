## Why

转专业等学生需在加课申请中提前加选未来学期必修课；默认加课池仅含曾退选/休学落下的本学期课，看不到后续学期必修。需在白名单增加对应权限并打通加课选课器。

## What Changes

- 白名单新增权限 `allowFutureMandatory`，文案：「允许添加未来学期必修课申请」。
- 新增/编辑白名单表单右侧勾选该权限（与突破本学期学分同级）。
- `getEligibleAddCoursesForStudent`：有有效权限时纳入 `futureSession` 且为必修的课；无权限仍排除。
- 加课选课器提示：有权限时展示例外说明。
- Demo：后续学期样例改为必修课（如 PHYS101）。

## Non-goals

- 不改在线选课先修/开课池规则。
- 不从培养方案动态展开全部未来学期课（仍用 demo seed）。
- 不强制课程清单或学年学期截止（布尔权限，对齐 bypassCreditMin）。

## Capabilities

### New Capabilities

- `whitelist-future-mandatory`: 白名单允许未来学期必修加课申请

### Modified Capabilities

- （无）

## Impact

- `supplementListQueue.js`、`SupplementEntryDrawer.vue`
- `addDropEligibleCourses.js`、`StudentAddDropView` / `AddDropCoursePickerModal`
- i18n zh/en
