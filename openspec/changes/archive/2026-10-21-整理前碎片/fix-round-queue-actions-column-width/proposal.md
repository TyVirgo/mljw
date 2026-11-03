## Why

在线选课「排队中」表操作列宽度按单按钮（约 72px）设计，实际有「取消排队」「查看进度」两个链接触，右侧 sticky 导致第二按钮被裁切。

## What Changes

- 排队表（`data-table--queue`）操作列加宽，操作按钮竖排完整展示。
- 同步校正状态列 / 课程已选百分比列的 sticky `right` 偏移。
- 不改主表「退选」单按钮列宽。

## Non-goals

- 不删减排队操作能力。
- 不取消表横滑（中间列仍可滑）。

## Capabilities

### New Capabilities

- `round-queue-actions-column`: 排队表操作列可读完整

### Modified Capabilities

- （无）

## Impact

- `StudentRegistrationRoundStatusPanel.vue`
