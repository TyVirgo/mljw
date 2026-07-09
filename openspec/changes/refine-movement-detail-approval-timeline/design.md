## 布局

```
MovementApplicationDetailDrawer / PDF 渲染根
┌────────────────────────────────────┐
│ ApprovalTimeline（流程图，在上）    │
│ ─────────────────────────────────  │
│ MovementDetailContent（申请在下）   │
│ ProgrammeTransferOfficeUseSection    │  条件显示
└────────────────────────────────────┘
```

对齐 `CourseApplicationDetailDrawer`：先流程、后详情。

## 实现

### D1：共享片段

`MovementDetailExportBody.vue` 组装：

- `buildMovementTimelineNodes(item, sourceKey)` → `ApprovalTimeline`
- `MovementDetailContent`
- `ProgrammeTransferOfficeUseSection`（editable / readonly 由 props 控制）

抽屉 `ref="exportContentRef"` 与 PDF 弹窗隐藏渲染宿主均引用同一组件，保证 WYSIWYG。

### D2：废弃详情内表格

详情抽屉与 PDF 不再 import `MovementApprovalLogTable`。`movementApprovalLogDisplay.js` 保留供列表「最近审批时间」等列。

### D3：时间展示

流程图节点时间沿用 `ApprovalTimeline` 的 `formatMovementDate`（`dd.Mmm.YYYY`），与异动全局日期格式一致。
