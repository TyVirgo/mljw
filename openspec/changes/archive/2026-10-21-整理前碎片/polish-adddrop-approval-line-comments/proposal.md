## Why

单条加退课审批弹窗用表下一块全局 Comments，多门课时无法对应到具体课程行；需改为每行独立评价意见，操作列末尾按需打开意见弹层。

## What Changes

- 有课程行汇总时：**去掉**表下全局 Comments
- 操作列在「通过 / 不通过 / 驳回」之后增加「添加评价意见」；已填则文案为「编辑评价意见」
- 点击后弹出二级意见框（复用现有 textarea + 常用意见 + 200 字），写入该行
- 该行决策为「不通过」或「驳回」时，该行评价意见 **必填**
- 提交时写入各行 `lineComment`，并拼成整单 `approvalLog.comment` 摘要
- **批量**无行表时仍用整单 Action + Comments（不变）

## Non-goals

- 不改行决策三态与整单推导规则（全部通过 / 部分通过 / 全部不通过 / 全部驳回）
- 不恢复行内常驻 textarea
- 不改学籍异动等其它审批弹窗

## Capabilities

### New Capabilities

- `adddrop-approval-line-comments`: 审批弹窗行级评价意见（按钮 + 二级弹层）

### Modified Capabilities

- （无独立 main spec 增量目录外；覆盖旧「表下公共 Comments」增量语义）

## Impact

- `AddDropApprovalModal.vue`
- `AddDropApprovalView.vue`（透传 `lineComments`）
- `addDropApprovalQueue.js`（行上 `lineComment` + log 摘要）
- `zh.js` / `en.js`
