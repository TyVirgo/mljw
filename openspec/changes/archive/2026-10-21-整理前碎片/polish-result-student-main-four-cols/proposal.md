## Why

学生维瘦表后，课程来源、选课志愿、操作人、操作时间仅在详情可见，扫表对账不便；主表「操作结果」文案与业务口语「选课结果」不一致；回加列后需自适应列宽，避免再次被迫横向滚动。

## What Changes

- 学生维主表在课名后增加四列：课程来源、选课志愿、操作人、操作时间
- 主表结果列表头文案由「操作结果」改为「选课结果」（新 i18n 键；不改搜索区等处的 `log.resultLabel`）
- 主表列宽/间距自适应（`table-layout: auto` + 长文本省略），右冻仍为「选课结果 + 详情」
- 详情抽屉保留上述字段完整展示（可与主表重复）

## Non-goals

- 不改学生维搜索条件、删除/代选流程
- 不改课程维度表与导出字段集合
- 不改全局 `courseRegistration.log.resultLabel` 文案

## Capabilities

### New Capabilities

- `result-student-main-four-cols`: 学生维主表回加四列、选课结果文案与列宽自适应

### Modified Capabilities

- （无）

## Impact

- `RegistrationResultView.vue`（学生维表头/表体/样式）
- `ResultStudentDetailDrawer.vue`（可选：详情结果标签同步为「选课结果」）
- `zh.js` / `en.js`
