## Why

换组锁「？」掉到下一行；本单拟退并入的必修「原上课学期」为空显示「—」。

## What Changes

- 「？」紧接锁文案句号后，不单独换行。
- 拟退并入加课池时补齐 `originalAcademicSession`（拟退行学期 / 课表学期 / 当前申请学期），不得为「—」。

## Non-goals

- 不改换组锁判定与白名单 tip 文案内容。

## Capabilities

### New Capabilities

- `adddrop-lock-tip-inline-original-session`: tip 贴句号 + 原上课学期补值

### Modified Capabilities

- （无）

## Impact

- `AddDropCoursePickerModal.vue`
- `addDropEligibleCourses.js` / `StudentAddDropView.vue`
- demo 必修可补 `academicSession`
