# 设计：加退课审批对齐学籍异动审批布局

## Context

| 维度 | 学籍异动审批（参考） | 加退课审批（现状） |
|------|----------------------|-------------------|
| Tab | 待我审批 / 已提交 / 历史 | 待审批 / 已提交 / 历史 |
| 搜索 | 学年学期、专业代码、状态、学号、姓名 | 专业、申请类型、申请单号 |
| 工具栏 | 审批（待办）+ 导出 | 仅导出 |
| 表格 | 待办勾选；操作「详情」 | 无勾选；待办行内「审批」 |
| 壳层 | `movement-approval-page` 自有样式 | `cr-list-page` + callout |

加退课详情已有 `AddDropApprovalDetailDrawer`（pending 可审、其它只读），批量可通过多选后逐条或一次确认后循环更新。

## Goals / Non-Goals

**Goals**：交互骨架与学籍一致（Tab 语义、搜索分栏、批量审批工具栏、勾选+详情）。  
**Non-Goals**：复制学籍列模型；改造审批规则引擎。

## Decisions

### 1. Tab 文案

- `courseRegistration.approval.tabs.pending`：中文改为「待我审批」；英文建议 `Pending My Approval`（与 `movementApproval.tabs.pending` 对齐）。

### 2. 搜索字段

推荐（单行，参考学籍分栏习惯，保留加退课特有类型）：

- 专业（或专业代码，文案可改为与学籍接近的「专业代码」若数据即为 code）
- 申请类型（下拉，全部 + 现有类型）
- 学号、姓名（分栏；替代或补充原「申请单号」——**建议保留申请单号**，共 4～5 项；过密时学号/姓名优先，申请单号可放同行末）
- 查询 / 重置右对齐

过滤逻辑扩展 `filterAddDropQueue` 支持 `studentId` / `studentName`（及既有 programme/type/keyword）。

### 3. 批量审批

- 仅 `pending` Tab 显示勾选列与「审批」按钮。
- 选中且均为可审状态时启用按钮；点击后：
  - **方案 A（推荐）**：打开轻量确认 Modal（通过/驳回 + 意见），确认后对选中行批量写回队列。
  - **方案 B**：仅允许单类型批量，或打开第一条详情——不推荐。
- 实现优先方案 A；可复用学籍 `MovementApprovalModal` 的交互模式，但文案/字段用加退课自己的（不必共用组件）。

### 4. 行操作

- 各 Tab 操作列均为「详情」；pending 进入可审抽屉，其它只读（与现状 `readonly` 一致）。

### 5. 样式

- Tab-bar / toolbar / table 视觉向 `MovementApprovalView` 靠拢（字号 13、表头灰底、主按钮蓝）。
- Callout 可保留在 Tab 上方（学籍无 callout，属选课模块差异，允许保留）。

## Risks

- 批量驳回/通过需统一意见字段；demo 队列字段若不支持 comments，确认框可只演示通过/驳回状态变更。
- 搜索项变多导致换行 → 用 `list-page-search` 单行 + 压缩 input 宽，对齐近期选人弹窗做法。

## Open Questions

无（按学籍范式落地；申请单号是否保留默认「保留」）。
