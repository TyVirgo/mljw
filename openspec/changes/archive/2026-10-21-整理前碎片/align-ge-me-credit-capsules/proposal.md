## Why

在线选课入口卡中，毕业学分与本学期学分两行类别胶囊因文案长短不一而错位；GE「文/商/理/AI与开放选修」长短差更大。

## What Changes

- GE 短标签改为 GE01 / GE02 / GE03 / GE04（中英一致）
- 入口卡毕业/学期学分改共用 CSS grid，使上下对应胶囊列对齐
- 列表顶栏沿用同一短标签（共用 i18n）

## Non-goals

- 不改 ME 类别短标签文案
- 不改学分计算逻辑

## Capabilities

### New Capabilities

- （无）

### Modified Capabilities

- `course-reg-student-register`：入口卡学分胶囊对齐与 GE 短标签

## Impact

- `StudentRegisterView.vue` 入口卡结构/样式
- `zh.js` / `en.js` `geDemand.short`
