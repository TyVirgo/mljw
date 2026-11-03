## Why

加课必修换组锁依赖「原分组」上下文。当前弹窗在存在任意拟退课（`dropLines`）时整表改用拟退原组，丢弃资格种子 `originalSectionCode`。加退课常见路径先选退课再选加课，导致 CHEM101 等「曾退 · 原组 01 / 异组 02 应置灰」的 demo 看不到「本学期必修课默认不可换组重修。」。

## What Changes

- 加课 / 加退换组锁原组：`dropLines` 与资格种子按课号合并（同课拟退优先，其余课保留种子）。
- 不改白名单换组放行、不改重修（已不加换组锁）。
- Demo 验收：加退已选其他拟退时，CHEM101-02 仍灰显并显示短原因。

## Non-goals

- 不把 CHEM101 塞进课表 DEMO_REQUIRED。
- 不改换组白名单配置（MATH101-02 仍演示可换组）。

## Capabilities

### New Capabilities

- `adddrop-core-lock-origin-merge`: 换组锁原组合并

### Modified Capabilities

- （无）

## Impact

- `addDropFormSections.js`（合并辅助）
- `AddDropCoursePickerModal.vue`（`originLinesForCoreLock`）
