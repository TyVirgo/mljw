# 变更：polish-type-entry-card-layout

## Why

GE/ME 入口卡「选课说明」占高且与进入后体验重复；剩余时间与状态挤在标题行，截止时间行信息密度不够；状态胶囊不够醒目。

## What Changes

- 去掉入口卡「选课说明」整块（GE/ME 同步）。
- 「剩余 x 天 x 小时」移到「选课轮次截止时间」同一行末尾，括号包裹。
- 「进行中 / 暂无开放」仅留卡片右上角，字号大一号更显眼。

## Non-goals

- 不改进入列表后的上下文条。
- 不删除 i18n `conditionBody`（轮次 tip 等仍可能复用）。

## Capabilities

### Modified Capabilities

- `course-registration`：学生选课入口卡信息架构与状态展示

## Impact

- `StudentRegisterView.vue` 目录卡模板与样式
- `zh.js` / `en.js` 剩余时间括号文案
