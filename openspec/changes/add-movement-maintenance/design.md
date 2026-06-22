## Context

`add-movement-approval-app` 已实现四 Tab 合并审批队列（`movementApprovalQueue.js` + `MovementApprovalView`），store 中已有 `implemented` 占位（Approved → Pending）。`sr-movement-maintenance` 菜单占位但未实现。

产品图示1–3 要求：**Approved 异动申请的教务实施宽表**，搜索/分页对齐审批页，扩展列偏转专业，尾部维护字段 + 三个下钻。

## Goals / Non-Goals

**Goals:**

- 合并四 Tab **Approved** 记录为单一维护列表（图示1–3）
- 搜索、分页、宽表横向滚动
- 实施 / 修改异动编号 / Export / Delete
- Edit（维护字段）、Details（复用 ReviewView）、Approval log（复用 LogModal）
- 扩展 store 维护字段 + 6 条 mock 种子
- Student Type 列用 Local / Chinese / International（中文 UI「中国」）

**Non-Goals:**

- 后端 API、真实学籍写入
- 异动查询/统计
- 非 Approved 状态进入维护列表
- 重新审批已实施记录

## Decisions

### 1. 队列层 — `movementMaintenanceQueue.js`

```javascript
// 模式同 movementApprovalQueue.js
export function mergeMovementMaintenanceQueue(t) {
  // 四 Tab store → filter status === 'Approved'
  // normalizeMaintenanceItem(sourceKey, item, t)
}

export function filterMaintenanceBySearch(items, search) {
  // academicSession, movementReason, status, studentId, studentName
}
```

`normalizeMaintenanceItem` 在 queue 项上附加：

| 字段 | 来源 |
|------|------|
| queueKey | `${sourceKey}:${id}` |
| movementDate | `item.movementDate` 或 `submittedAt` |
| passportIc | `nricPassport` 等 |
| studentType | `inferStudentCategory(item)` → 展示映射 Chinese |
| intake | `currentIntake` / type-specific |
| currentSchool / currentProgrammeCode | enrollment 或 record 字段 |
| newSchool / newProgrammeCode / newProgrammeName | PT: adminNewProgramme 解析；其它「—」 |
| englishName | `fullName` |
| cgpa / expectedGraduationTime / movementNumber / remark | 维护字段 |

### 2. Store 扩展字段（四 Tab 共用 shape 子集）

```javascript
{
  movementNumber: '',      // 异动编号
  cgpa: '',
  expectedGraduationTime: '',
  maintenanceRemark: '',     // 列表 Remark（区别于申请 detailedReason）
  movementDate: '',        // 异动日期 ISO 或 display string
  implemented: 'Pending' | 'Implemented' | '—',
}
```

写回：`updateMaintenanceFields(sourceKey, id, patch)` → `upsertInStore`

批量实施：`implementMaintenanceRecords(rows[])` → 设 `implemented: 'Implemented'`

### 3. UI 结构

```
MovementMaintenanceView.vue
  ├── .search-bar（5 条件，同审批）
  ├── .toolbar（实施 · 修改异动编号 · Export · Delete）
  ├── .table-wrap（超宽 table，sticky Actions 列）
  └── modals:
        MovementMaintenanceEditModal.vue
        MovementMaintenanceNumberModal.vue
        MovementApprovalReviewView.vue      // Details
        ApprovalLogModal.vue
        ConfirmDialog.vue
        ExportModal.vue（可选，或 alert mock）
```

列表布局参考 `MovementApprovalView.vue`；搜索复用 `list-page-search.css`。

### 4. Edit vs Details

| 操作 | 组件 | 内容 |
|------|------|------|
| Edit | MaintenanceEditModal | 异动编号、Remark、CGPA、Expected Graduation；PT 额外 New School/Programme |
| Details | MovementApprovalReviewView | 与审批只读一致，无审批按钮 |
| Approval log | ApprovalLogModal | `item.approvalLog` |

Edit Footer：**Cancel + Save**

### 5. 修改异动编号弹窗

- 打开时列出勾选行：Student ID、Name、当前编号、输入框
- Save 批量写回 `movementNumber`
- 首版不做自动编号规则生成（可手动输入 MV2025001 等）

### 6. 实施（Implement）

- 仅对 `implemented === 'Pending'` 的勾选行启用
- ConfirmDialog：「确定将选中的 N 条记录标记为已实施？」
- 写回 store `implemented: 'Implemented'`

### 7. Delete

- ConfirmDialog 后从对应 store 列表 `filter` 删除
- 不校验下游引用（mock）

### 8. Mock 种子（6 条 Approved）

| 类型 | Student Type | implemented | 说明 |
|------|-------------|-------------|------|
| Programme Transfer | Local | Pending | 完整 PT 扩展列 |
| Programme Transfer | Chinese | Pending | |
| Deferment | International | Implemented | 扩展列 mostly — |
| Deferment | Local | Pending | |
| Withdrawal | Chinese | Pending | |
| Resumption | Local | Implemented | |

在现有 `initialProgrammeTransfers` 等中 **追加或改造** 6 条 `status: 'Approved'`，避免 Draft/In Progress 污染维护列表。

### 9. 路由与 i18n

- `studentRecordsDevelopedPages.add('sr-movement-maintenance')`
- `App.vue` → `MovementMaintenanceView`
- 新增 `movementMaintenance.*` 命名空间

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 宽表列过多 | 横向 scroll + sticky Actions |
| 四 Tab 字段差异大 | 非适用列显示「—」；Edit 按 sourceKey 条件字段 |
| 与审批列表重复逻辑 | 抽取 queue normalize 模式，不合并两页面 |
| Nationality 列语义 | 规格明确为 Student Type，非 nationality 字段 |

## Migration Plan

1. 扩展四 Tab mock + maintenance field helpers
2. `movementMaintenanceQueue.js`
3. View + Edit + Number modals
4. 复用 ReviewView / ApprovalLogModal
5. i18n + 菜单注册
6. 冒烟 + `npm run build`

## Open Questions

- Export 用 ExportModal 还是 alert：首版与审批页一致（alert mock）即可
- CGPA 格式：自由文本，不做数值校验
