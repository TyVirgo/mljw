## Why

选课结果「添加特殊学生」代选流程缺表头全选、原因/附件留痕，学生维无法按课程来源筛选；第三轮课程维工具栏也看不到学期配置中的名额互释时间，运维需来回切页核对。

## What Changes

- 「选择学生」弹窗表头增加全选复选框（当前筛选结果一键勾选）
- 学生维度搜索增加「课程来源」条件（preselect / main / supplement / admin）
- 「新增学生选课」增加必填「原因」与可选「上传附件」
- 课程维度 · 第三轮工具栏（导出按钮旁）只读展示学期配置的互释时间与标签描述

## Non-goals

- 不改选课时间配置表单字段结构（不新增独立「描述」配置项）
- 不改 R3 互释容量计算 / CR205 开关逻辑
- 不把原因/附件回显到结果列表列（本变更仅保证录入写入）
- 不改「选择课程」弹窗搜索条件

## Capabilities

### New Capabilities

- `result-admin-add-and-r3-cross-release`: 代选全选/原因附件、学生维课程来源筛选、R3 互释时间工具栏展示

### Modified Capabilities

- （无）

## Impact

- `AdminAddStudentPickModal.vue`
- `AdminAddCourseForStudentModal.vue`
- `RegistrationResultView.vue`
- `registrationResult.js`（筛选 + 代选写入字段）
- `zh.js` / `en.js`
- 只读依赖：`resolveEffectiveCrossReleaseAt`（`sessionRegistrationSchedules.js`）
