## 背景说明

`add-resumption-app` Phase 1 已交付复学列表 + 简化 Pending 审批 + 中英文 i18n。产品要求对齐 `add-deferment-app` Phase 3 / `add-programme-transfer-app` **6 态流转语义** 与 **流程日志外置**。

项目内参考：

- **6 态状态机**：`deferments.js` + `DefermentView.vue`（Phase 3 已落地）
- **审批**：`defermentApproval.js`（Pending Review → Academic Affairs → Approved）
- **流转日志**：`ApprovalLogModal.vue`

复学特有：Section I–II、双声明 checkbox、蓝底 Note（无 Section III 家长）。

## 目标 / 非目标

**目标：**

- 6 态状态机 + 每状态 ≥2 条 Mock（≥12 条）
- 列表状态驱动 Actions + **各状态流转日志**
- Create / Edit Form Modal（Save Draft / Submit / Resubmit）
- Details 只读 + In Progress 内嵌审批；**不含内嵌 log**
- 对齐 Deferment / Programme Transfer 交互

**非目标：**

- Expired 双 mock
- Deferment Semester 联动休学 DEF 记录
- 后端 API、独立审批菜单页

## 设计决策

### 1. 数据模型 — `src/data/resumptions.js`

在 Phase 1 模型基础上扩展：

```javascript
{
  // Section I–II、attachment、declarationCorrect、declarationMaxDuration 等同 Phase 1 ...

  status: 'Draft' | 'In Progress' | 'Update Required' | 'Approved' | 'Rejected' | 'Cancelled',
  approvalStage: 'Pending Review' | 'Academic Affairs' | 'Approved' | '--',
  archived: boolean,
  applicationDeadline: string | null,

  approvalLog: ApprovalLogEntry[],
}
```

**`archived`**：`Approved` | `Rejected` | `Cancelled` 时为 `true`。

**ACTIVE_STATUSES**：`Draft`、`In Progress`、`Update Required`。

**列表列**：Original Intake → `originalIntake`；Resume Intake → `resumptionSemester`。

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

**Cancel 规则**：仅 `In Progress` + `Pending Review` 且 log 尚无 Approved / Rejected / Update Required。

**导出 helper**：

- `canEditResumption`、`canDeleteResumption`、`canCancelResumption`、`canResubmitResumption`、`canApproveResumption`
- `isArchivedResumption`、`statusBadgeClass`
- `hasActiveResumptionForStudent`、`buildStudentSnapshotForResumption`
- `validateResumptionForm(data, mode)` — draft 仅校验 studentId；submit 含双声明 + 附件
- `saveDraftApplication`、`submitApplication`、`cancelApplication`、`resubmitApplication`

### 3. 审批流 — `src/data/resumptionApproval.js`

```javascript
const STAGE_FLOW = {
  'Pending Review': { next: 'Academic Affairs', final: false },
  'Academic Affairs': { next: 'Approved', final: true },
}
```

动作：Approved / Update Required / Rejected。

### 4. UI 结构

```
ResumptionView.vue
  ├── .search-bar + .history-header
  ├── Table 9 列 + 状态驱动 Actions + 流转日志
  └── ResumptionFormModal / ResumptionDetailModal / ApprovalLogModal（复用）
```

**Form Footer（按模式）**：

| 模式 | 按钮 |
|------|------|
| Create | Close · Save Draft · Submit |
| Edit (Draft / Update Required) | Close · Save Draft · Submit / Resubmit |

### 5. Mock 矩阵（Phase 2 — ≥12 条）

| applicationId | status | approvalStage | 演示要点 |
|---------------|--------|---------------|----------|
| RES003 | Draft | -- | 空字段草稿 |
| RES006 | Draft | -- | 部分填写 |
| RES001 | In Progress | Pending Review | 可 Cancel |
| RES007 | In Progress | Pending Review | 可 Cancel（不同学生） |
| RES008 | In Progress | Academic Affairs | 不可 Cancel |
| RES009 | Cancelled | -- | 学生撤销 1 |
| RES010 | Cancelled | -- | 学生撤销 2 |
| RES004 | Update Required | -- | 打回修改 1 |
| RES011 | Update Required | -- | 打回修改 2 |
| RES012 | Rejected | -- | Pending Review 拒绝 |
| RES013 | Rejected | -- | Academic Affairs 拒绝 |
| RES002 | Approved | Approved | 已通过 1 |
| RES014 | Approved | Approved | 已通过 2 |

**学生 ID 约束**：非终态同一 `studentId` 仅一条。

### 6. Phase 3 — 流程日志外置

- 列表每行 Actions 增加 **流转日志**（全状态）
- Detail Modal 删除 log section；审批区不变

### 7. i18n 扩展

`resumption.*` 补充 6 态徽章与 Save Draft / Cancel / Resubmit / Edit / Delete。

`resumption.deleteOne`、`resumption.cancelOne`、`resumption.activeApplicationExists`。

### 8. 文件影响

```
修改:
  src/data/resumptions.js
  src/data/resumptionApproval.js
  ResumptionFormModal.vue
  ResumptionView.vue
  ResumptionDetailModal.vue
  src/i18n/locales/zh.js, en.js, zh-flat.js

复用:
  src/components/studentRecords/ApprovalLogModal.vue
```

## 风险与应对

| 风险 | 缓解 |
|------|------|
| 与 deferment 代码重复 | 克隆 deferment Phase 3 模式；字段层独立 `resumptions.js` |
| 双声明校验与 Draft 模式 | draft 模式不强制声明；submit/resubmit 严格校验 |

## 迁移说明

1. 扩展 `resumptions.js` 6 态与 helper
2. 升级 `resumptionApproval.js`
3. 改造 Form / View / Detail Modal
4. 扩展 Mock 至 6 态各 2 条
5. 确认流转日志外置（Phase 3）
6. 冒烟 + `npm run build`

## 待定问题

1. Deferment Semester 是否在后续 change 联动已 Approved 休学记录
2. Consent Letter 静态文件路径（首版占位）
