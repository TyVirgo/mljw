## Why

选课志愿在主表多为「—」，扫表噪音大；代选原因才是对账重点，却只在详情可见。同时原因/附件 demo 几乎为空，无法演示留痕。

## What Changes

- 学生维主表移除「选课志愿」列（详情抽屉仍展示）
- 学生维主表增加「原因」列（`adminAddReason`，空显示 —，过长省略）
- 丰富 demo：代选（admin）行轮转多套原因文案与附件名；监控展开行对 admin 来源同样补齐

## Non-goals

- 主表不增加「附件」列（附件仍仅详情）
- 不改搜索、导出字段集合、代选提交流程
- 不改非代选行业务语义（无原因时仍可为 —）

## Capabilities

### New Capabilities

- `result-student-reason-col`: 主表原因列、志愿回详情、demo 留痕内容

### Modified Capabilities

- （无）

## Impact

- `RegistrationResultView.vue`
- `registrationResult.js`（demo 种子）
- 可选：`ResultStudentDetailDrawer.vue`（无需改结构）
