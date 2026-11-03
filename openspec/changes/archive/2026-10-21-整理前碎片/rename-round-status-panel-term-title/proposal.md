## Why

在线选课「选课情况」面板标题需改为「学期选课情况」，GE/ME 的 R1–R3 共用同一面板，应一并调整。

## What Changes

- `roundStatusPanel.panelTitle` / `titleWithSelected` / `titleWithPending`：中文改为「学期选课情况…」；英文对齐为 Term registration status。
- 不改「本轮选课情况」等入口/工具条文案。

## Non-goals

- 不改分块标题「本轮志愿 / 本轮已选 / 历轮已选」。
- 不改 cartToolbarButton、myCoursesTitle 等「本轮选课情况」键。

## Capabilities

### New Capabilities

- `round-status-panel-term-title`: 学期选课情况标题

### Modified Capabilities

- （无）

## Impact

- i18n zh.js / en.js
