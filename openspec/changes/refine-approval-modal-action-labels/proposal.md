## 背景与动机

审核弹框（图示「操作」单选行）当前中文为 **已通过 / 已驳回 / 驳回**，偏结果态描述，与产品期望的操作语义不一致。产品要求统一为 **通过 / 不通过 / 驳回**，且所有使用该审核弹框的入口保持一致。

## 变更内容

### 操作选项文案（仅审核弹框内）

| 存库值 `action` | 当前中文 | 目标中文 | 英文（建议） |
|-----------------|----------|----------|--------------|
| `Approved` | 已通过 | **通过** | Pass |
| `Rejected` | 已驳回 | **不通过** | Not Pass |
| `Update Required` | 驳回 | **驳回** | Return |

- **数据层不变**：`approvalActionOptions` 仍为 `['Approved', 'Rejected', 'Update Required']`；校验、流转引擎、mock log 的 `action` 字段不改
- **仅改弹框展示**：`MovementApprovalModal`、`CourseApprovalModal` 内 Action 单选标签

### 统一覆盖范围（2 个 Modal → 全部入口）

```
MovementApprovalModal ──┬── MovementApprovalView（列表 Approve）
                        ├── MovementApplicationDetailDrawer（抽屉 Review）
                        └── MovementApprovalReviewView（遗留整页，若仍引用）

CourseApprovalModal ────┬── CourseApprovalView
                        ├── CourseChangeReviewView
                        └── CourseApplicationDetailDrawer
```

### 与状态/日志文案分离（重要）

以下场景 **不改为**「通过/不通过」，仍用结果态或模块内 status i18n：

- 列表 Status 徽章（如「已通过」「已驳回」「需修改」）
- 审批时间线 `approvalTimeline.*` 徽章
- 搜索区 Status 下拉 `tr('Approved')` 等
- Export / approvalLog 历史记录中的 action 展示（若走 `tr(action)` 需单独评估，默认保持结果态）

## 能力范围

### 新增能力

- `approval-modal`：审核弹框 Action 单选的操作态文案约定

### 修改的能力

- `movement-approval-app`：审批弹框操作选项展示文案
- `course-application` / `course-change-application`（经 `add-new-course-approval`）：课程/变更审批弹框操作选项展示文案

## 影响范围

- **新增**
  - `src/utils/approvalActionLabels.js` — `getApprovalActionLabel(action, t)` 映射三档 action
- **修改**
  - `MovementApprovalModal.vue`、`CourseApprovalModal.vue` — 使用 `getApprovalActionLabel`，不再 `tr(opt)` 直译
  - `src/i18n/locales/zh.js`、`en.js` — 新增 `approvalModal.action.*`
- **不变**
  - `src/i18n/zh-flat.js` 全局 `Approved`/`Rejected`（保护状态筛选与徽章）
  - `movementApprovalEngine.js`、`courseApproval.js` 及各 `*Approval.js` 的 options 数组与 validate 逻辑

## 实现状态（2026-06-30）

代码已实现；详见 `tasks.md` 全部勾选。关联入口：异动审批列表/抽屉、新课程审批、课程变更审批。

## 非目标（本变更不做）

- 修改三态业务语义（Approved 推进、Rejected 终拒、Update Required 退回修改）
- 修改 Comments 必填规则（Rejected / Update Required 仍必填）
- 合并两个 Modal 为单一组件（可后续 refactor）
