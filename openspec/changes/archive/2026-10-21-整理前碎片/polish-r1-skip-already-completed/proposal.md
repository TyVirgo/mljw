# 变更：polish-r1-skip-already-completed

## Why

GE/ME 第一轮课库中，成绩单已修课程（如 demo 的 COMP101）会被 `alreadyCompleted`（「已修读该课程」）整课禁用提交志愿。产品口径：R1 **不得**因成绩单已修禁交；同课已交某一分组志愿时，其它分组仍可交。R2/R3 才因前面轮次已选/占用（及可选的已修）禁交。

## What Changes

- **R1 跳过成绩单「已修读」门禁**：`evaluateCourseEligibility` 在 `roundKey === preselect` 时不因 `passedCodes` 判不合格。
- **同课多分组**：确认 R1 `isCourseOccupied` 按 `sectionId` 占用；已交一组不影响其它组提交（规格写明）。
- **R2/R3**：仍可因已修读 / 已占用禁交（前面轮次已选走占用提示）。
- GE/ME 同步。

## Non-goals

- 不改成绩单数据本身
- 不改 R1 学分帽、硬冲突、批次范围等其它门禁
- 不新建菜单

## Capabilities

### New Capabilities

- `r1-volunteer-eligibility`：第一轮志愿提交资格（已修读豁免、同课多分组可交）

### Modified Capabilities

- （无主库已归档条目；以本 change 规格为准。）

## Impact

- `studentEligibility.js`
- （必要时）`StudentRegisterView.vue` / `studentRegistrationStore.js` 对齐
- OpenSpec 本 change
