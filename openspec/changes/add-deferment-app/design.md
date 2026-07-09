## 背景说明

`add-deferment-app` Phase 1–2 已交付休学列表 + 简化 Pending 审批 + 中英文 i18n。产品要求对齐 `add-programme-transfer-app` **6 态流转语义** 与 **流程日志外置**。

项目内参考：

- **状态机 + Actions**：`programmeTransfers.js` + `ProgrammeTransferView.vue`
- **审批**：`programmeTransferApproval.js`（Approved / Update Required / Rejected）
- **流转日志**：`ApprovalLogModal.vue`（Phase 4 四模块统一）

## 目标 / 非目标

**目标：**

- 6 态状态机（Draft / In Progress / Cancelled / Update Required / Rejected / Approved）
- 每状态 ≥2 条 Mock（≥12 条）
- 列表状态驱动 Actions + **各状态流转日志**
- Create / Edit Form Modal（Save Draft / Submit / Resubmit）
- Details 只读 + In Progress 内嵌审批；**不含内嵌 log**
- 对齐 Programme Transfer 交互模式

**非目标：**

- Expired 双 mock（可选保留单条演示）
- 真实后端、角色权限
- 独立审批菜单页
- 审批通过后回写 Student Profile

## 设计决策

### 1. 数据模型 — `src/data/deferments.js`

在 Phase 1 模型基础上扩展：

```javascript
{
  // ... Section I–III、attachment 等同 Phase 1 ...

  status: 'Draft' | 'In Progress' | 'Update Required' | 'Approved' | 'Rejected' | 'Cancelled',
  approvalStage: 'Pending Review' | 'Academic Affairs' | 'Approved' | '--',
  archived: boolean,
  applicationDeadline: string | null,  // 可选，Expired 演示

  approvalLog: ApprovalLogEntry[],
}
```

**`archived`**：`Approved` | `Rejected` | `Cancelled` 时为 `true`（或 `archived` 字段显式设置）。

**ACTIVE_STATUSES**：`Draft`、`In Progress`、`Update Required` — 同一 `studentId` 仅一条。

### 2. 状态机与权限 helper

| Status | 可 Edit | 可 Delete | 可 Cancel | 可 Resubmit | 可审批 | 列表 Actions |
|--------|---------|-----------|-----------|-------------|--------|--------------|
| Draft | ✓ | ✓ | ✗ | ✗ | ✗ | Details · Edit · Delete · 流转日志 |
| In Progress (Pending Review) | ✗ | ✗ | ✓ | ✗ | ✓ | Details · Cancel · 流转日志 |
| In Progress (审批已开始) | ✗ | ✗ | ✗ | ✗ | ✓ | Details · 流转日志 |
| Update Required | ✓ | ✗ | ✗ | ✓ | ✗ | Details · Edit · 流转日志 |
| Cancelled | ✗ | ✗ | ✗ | ✗ | ✗ | Details · 流转日志 |
| Rejected | ✗ | ✗ | ✗ | ✗ | ✗ | Details · 流转日志 |
| Approved | ✗ | ✗ | ✗ | ✗ | ✗ | Details · 流转日志 |

**Cancel 规则**（同转专业）：仅 `status === 'In Progress' && approvalStage === 'Pending Review'` 且 log 尚无 Approved / Rejected / Update Required 决策；Cancel 后记录保留，变为 Cancelled 只读。

**导出 helper**：

- `canEditDeferment`、`canDeleteDeferment`、`canCancelDeferment`、`canResubmitDeferment`、`canApproveDeferment`
- `isArchivedDeferment`、`statusBadgeClass`
- `hasActiveDefermentForStudent(studentId, list)`
- `buildStudentSnapshotForDeferment`、`validateDefermentForm(data, mode)`（draft / submit / resubmit）
- `saveDraftApplication`、`submitApplication`、`cancelApplication`、`resubmitApplication`

### 3. 审批流 — `src/data/defermentApproval.js`

对齐 `programmeTransferApproval.js`：

```javascript
const STAGE_FLOW = {
  'Pending Review': { next: 'Academic Affairs', final: false },
  'Academic Affairs': { next: 'Approved', final: true },
}
```

| 动作 | 结果 |
|------|------|
| Approved（非终审） | 推进至下一阶段，status 保持 In Progress |
| Approved（终审） | Approved，archived |
| Update Required | Update Required，允许 Edit + Resubmit |
| Rejected | Rejected，archived，需 comment |

审批 UI 嵌在 `DefermentDetailModal.vue`，仅 `In Progress` 时显示。

### 4. UI 结构

```
DefermentView.vue
  ├── .search-bar
  ├── .history-header（+ New Deferment）
  ├── Table 10 列 + 状态驱动 Actions + 流转日志
  └── Modals:
        DefermentFormModal.vue     (Create / Edit / Resubmit)
        DefermentDetailModal.vue   (Details + Approval；无 log)
        ApprovalLogModal.vue       (复用)
```

**Form Footer（按模式）**：

| 模式 | 按钮 |
|------|------|
| Create | Close · Save Draft · Submit |
| Edit (Draft / Update Required) | Close · Save Draft · Submit / Save · Resubmit |
| — | Resubmit 仅 Update Required 编辑后 |

### 5. Mock 矩阵（Phase 3 — ≥12 条）

| applicationId | status | approvalStage | 演示要点 |
|---------------|--------|---------------|----------|
| DEF003 | Draft | -- | 空字段草稿 |
| DEF006 | Draft | -- | 部分填写 |
| DEF002 | In Progress | Pending Review | 可 Cancel |
| DEF007 | In Progress | Pending Review | 可 Cancel（不同学生） |
| DEF008 | In Progress | Academic Affairs | 不可 Cancel，可审批 |
| DEF009 | Cancelled | -- | 学生撤销 1 |
| DEF010 | Cancelled | -- | 学生撤销 2 |
| DEF004 | Update Required | -- | 打回修改 1 |
| DEF011 | Update Required | -- | 打回修改 2 |
| DEF012 | Rejected | -- | Pending Review 拒绝 |
| DEF013 | Rejected | -- | Academic Affairs 拒绝 |
| DEF001 | Approved | Approved | 已通过 1 |
| DEF014 | Approved | Approved | 已通过 2 |

**学生 ID 约束**：非终态同一 `studentId` 仅一条。

### 6. Phase 4 — 流程日志外置

- 列表每行 Actions 增加 **流转日志**（Draft / In Progress / 终态均显示）
- `ApprovalLogModal` 展示原 Detail 内 log 表格
- Detail Modal 删除 log section

### 7. i18n 扩展

`deferment.*` 补充 6 态徽章：Draft、In Progress、Update Required、Cancelled、Approved、Rejected。

操作：Save Draft、Cancel、Resubmit、Edit、Delete。

`zh-flat.js`：`Update Required` →「需修改」等。

### 8. 文件影响（Phase 3 + 4）

```
修改:
  src/data/deferments.js
  src/data/defermentApproval.js
  DefermentFormModal.vue
  DefermentView.vue
  DefermentDetailModal.vue
  src/i18n/locales/zh.js, en.js, zh-flat.js

复用:
  src/components/studentRecords/ApprovalLogModal.vue
```

## 风险与应对

| 风险 | 缓解 |
|------|------|
| Phase 1 简化 3 态与 Phase 3 迁移冲突 | Phase 3 tasks 明确 refactor 路径；保留 applicationId 序列 |
| 与转专业代码重复 | 克隆 helper / Actions 模式；字段层独立 `deferments.js` |
| Cancel 与审批并发 | 仅 Pending Review 且无审批决策时可 Cancel |

## 迁移说明

1. 扩展 `deferments.js` 状态枚举与 helper
2. 升级 `defermentApproval.js` 多段流
3. 改造 Form / View / Detail Modal
4. 扩展 Mock 至 6 态各 2 条
5. 确认流转日志外置（Phase 4，可与转专业共用组件）
6. 冒烟 + `npm run build`

## 待定问题

1. 休学审批是否必须两阶段（Pending Review → Academic Affairs），或首版可单段 Pending Review + Update Required（当前 design 采用两阶段以对齐转专业 Cancel/不可 Cancel 演示）
2. Expired 是否在休学场景保留（建议可选单条 mock）
