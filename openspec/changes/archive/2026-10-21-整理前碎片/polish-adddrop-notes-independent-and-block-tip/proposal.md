## Why

退课/加课/重修三处「补充说明」文案雷同且加课与重修共用 `addNotes`；详情重修区不展示说明；二次申请拦截提示夹在三是否下方，且禁用操作时滚动区 `pointer-events: none` 导致无法滑动查看。

## What Changes

- 三处标签改为「退课补充说明」「加课补充说明」「重修补充说明」；新增独立字段 `retakeNotes`，与 `addNotes` / `dropReason` 互不覆盖。
- 表单 SECTION IV 与详情重修区在类型/学分下展示重修补充说明。
- 二次申请提示移到学分条估算提示下一行；表单内容区仍可上下滚动（仅禁用编辑）。

## Non-goals

- 不改说明必填规则（仍选填）。
- 不改二次申请拦截业务条件本身。

## Capabilities

### New Capabilities

- `adddrop-notes-independent-block-tip`: 三说明独立与二次提示位置

### Modified Capabilities

- （无）

## Impact

- FormSections / DetailBody / addDropFormSections / approvalQueue submit / i18n / 可选 modal 滚动样式
