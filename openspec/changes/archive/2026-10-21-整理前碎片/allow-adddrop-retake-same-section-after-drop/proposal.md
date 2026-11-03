## Why

「同组」指同一门课的同一课程分组（section）。加退必修由换组锁约束（默认同组、白名单可异组）；另有一道「退后再加同组一律禁止」与换组锁冲突。重修路径应允许同组且不套换组锁。

## What Changes

- 取消拟退∩拟加「同课同课程分组」提交拦截（`addDropSameCourseSameSection`）
- 取消拟退∩拟重修同课同分组拦截（已做）
- **保留**加课必修换组锁（无白名单禁异组；重修不套此锁）
- 学分 tip 合框两行（已做）

## Non-goals

- 不改选修「课程组」组内替代逻辑
- 不删 i18n 键（标弃用）

## Capabilities

### New Capabilities

- `adddrop-retake-same-section-after-drop`: 退+加/重修同课程分组规则与 tip 合框

## Impact

- `addDropFormSections.js`、i18n 注释、本变更 specs
