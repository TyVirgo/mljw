## Why

详情「重修原课程」列文案与截断不佳；审批 demo 同课号退+重修易被误判为脏数据。产品口径：同课号允许，仅禁止同课同分组；重修可选不同分组为合法。

## What Changes

- （已有）加课/重修补充说明常显；详情重修表原课列 + 曾修成绩列
- **增量**：表头「重修原课程」改为「曾修课程」（申请汇总同 key）；列加宽/可换行，避免 `代码/名称` 省略
- **增量**：审批弹窗课程分组展示优先 `sectionName`，避免一律「分组名称01」
- **增量**：demo 增加/修正「退 MATH101-01 + 重修 MATH101-02」同课异组样例
- **增量**：提交校验对齐「同课同分组」禁、异组可；旧「退课与重修不能相同」文案改为弃用说明

## Non-goals

- 不放开同课同分组禁令
- 不删审批弹窗中同课号多行（退/加/重修意图不同属合法）

## Capabilities

### New Capabilities

- `adddrop-detail-notes-retake-original`: 详情说明常显 + 曾修课程列展示与同课异组 demo

### Modified Capabilities

- （无）

## Impact

- `AddDropApplicationDetailBody.vue`、`AddDropApprovalModal.vue`、`addDropFormSections.js`、demo seed、i18n
