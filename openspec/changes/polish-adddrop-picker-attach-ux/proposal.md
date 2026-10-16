## Why

退课选课弹窗搜索拆行导致右侧空白；加课名额列长文案被裁切；退课附件仅单文件且按钮样式弱，详情不同步多附件。

## What Changes

- 选课弹窗搜索条件合并同一 `search-fields`，流式换行
- 名额列加宽并允许换行展示完整状态文案
- 退课附件：浅蓝按钮、多文件、大小/预览/删除；详情同步列表

## Capabilities

### New Capabilities

- `adddrop-picker-attach-ux`: 选课搜索布局、名额列与多附件 UX

## Impact

- `AddDropCoursePickerModal.vue`
- `AddDropApplicationFormSections.vue`、`StudentAddDropView.vue`、`addDropFormSections.js`
- `AddDropApplicationDetailBody.vue`、i18n
