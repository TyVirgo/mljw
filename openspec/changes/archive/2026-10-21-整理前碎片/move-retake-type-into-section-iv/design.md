## Context

`needRetake === 'yes'` 时，「重修类型」目前在公共 `form-grid` 内；SECTION IV 已有选课表。

## Goals / Non-Goals

**Goals:** 仅调整 DOM 位置到 SECTION IV 首行。

**Non-Goals:** 不改 `onField('retakeType')`、池切换清行逻辑。

## Decisions

1. 删除公共区 `v-if="form.needRetake === 'yes'"` 的重修类型块。
2. 在 `sections.showIV` 的 `form-grid` 最前插入同一控件（含 hint）。
