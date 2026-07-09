## 背景说明

```
申请侧（已实现）                    审批侧（本 change）
─────────────────                  ─────────────────
StudentMovementApplicationView     MovementApprovalView
  4 Tab 嵌入 *View                   统一表 + 异动类别列
  Details = 只读                     View = 只读 | 审批 | Recall
  流转日志                           流转日志（同 ApprovalLogModal）
  *Approval.js 保留未用 UI           movementApprovalEngine
```

参考实现：`CourseApprovalView.vue`（搜索、勾选、Approve、Export、Details + Approval Log）。

## 目标 / 非目标

**目标：**

- 三 Tab 按 **当前 mock 审批角色** 分桶：Submitted / Pending / History
- 主表仅共性字段；类型差异字段在 View 内
- 审批修改四 store 中对应记录的状态与 log
- 四异动 workflow 可演示 Local / Intl 分支（至少 ISAO 差异）

**非目标：**

- 真实组织架构与权限
- v1 完整并行会签（见 Decision 4）

## 设计决策

### 1. 归一化队列项 `MovementApprovalQueueItem`

```javascript
{
  id,                    // 原 store id
  sourceKey,             // programme-transfer | deferment | resumption | withdrawal
  applicationId,
  status,
  approvalStage,
  implemented,           // Pending | Yes | No
  studentId,
  fullName,
  studentCategory,       // Local | China | International
  applicationSession,    // 申请 Session
  effectiveSession,      // 生效 Session
  movementCategory,      // i18n key / 展示用
  movementReason,        // 摘要（mainReason / transferReason 等）
  submittedAt,
  raw,                   // 原对象引用
}
```

**字段映射（mock 补全）：**

| 列 | 转专业 | 休学 | 复学 | 退学 |
|----|--------|------|------|------|
| movementReason | transferReason | mainReason | — | mainReason |
| applicationSession | startSemester 或新增 | dateOfApplication 学期 | dateOfApplication | dateOfApplication |
| effectiveSession | adminNewIntake / startSemester | defermentPeriod | resumptionSemester | lastDateOfAttendance 派生 |
| implemented | 新增，默认 Pending | 同左 | 同左 | 同左 |

### 2. 三 Tab 分桶 `classifyApprovalBucket(item, currentRole)`

**输入：** 归一化项 + 当前 mock 角色（如 `AC`、`HOD/HOP`、`Finance`、`AAO`…）

| Tab | 条件 |
|-----|------|
| **submitted** | `status === 'In Progress'` 且 `approvalStage !== currentRole.activeStage(item)` 且当前用户本轮 **未** 在 log 中审批过 |
| **pending** | `status === 'In Progress'` 且 `approvalStage === currentRole.activeStage(item)` |
| **history** | ① log 含当前角色 actor 在本轮 submit 之后的记录；或 ② `status === 'Cancelled'`；或 ③ 终态 `Approved`/`Rejected`/`Expired` 且用户曾参与；或 ④ `Update Required`（只读归档，可选进 History） |

**Update Required：** 进 **Submitted** Tab，View 只读（等学生 Resubmit）。

**Draft：** 不出现在审批队列。

**Toolbar Approve：** 仅 **Pending** Tab 显示；勾选需 **同 sourceKey + 同 approvalStage**。

### 3. View 模式

| Tab | 打开 View | 内容 |
|-----|-----------|------|
| Submitted | `mode=readonly` | 申请只读（`*DetailModal` 等价区块） |
| Pending | `mode=approve` | 只读申请 + `MovementApprovalForm`（Action/Comment/Submit）；转专业 + Section VII |
| History | `mode=history` | 只读申请 + **Recall** 按钮（条件满足时） |

列表 Actions 文案：**View | Approval log**（与课程审批 Details 对齐时可 i18n 为 View）。

### 4. Workflow 定义（v1 串行化）

`movementApprovalWorkflows.js` 为每种 `{ sourceKey, studentCategory }` 返回有序 stage 数组。

**Deferment — Local:**

```
Submit → AC → HOD/HOP → AA HOD → Admissions → Library → IT Office
  → Accommodation → AAO → Approved
```

**Deferment — China/International:** 在 AA HOD 后插入 **International Student Affairs Office**，再进并行块（v1 串行：Admissions → Library → IT）。

**Resumption — Local:**

```
Submit → AC → HOD/HOP → Finance → Admissions → Accommodation → AAO → Approved
```

**Resumption — Intl/China:** Finance 后增加 **ISAO**，再 Admissions / Accommodation（v1 串行）。

**Withdrawal — Local:**

```
Submit → AC → HOD/HOP → AA HOD → Finance → Admissions → Library → IT Office
  → Counselling Center → Accommodation → AAO → Approved
```

**Withdrawal — Intl/China:** AA HOD 后 **ISAO**，再上述并行块串行。

**Programme Transfer（四异动同表）：**

```
Submit → Pending Review → Academic Affairs → Dean/HoP → Approved
```

（沿用现有 `programmeTransferApproval.js` 语义；Dean/HoP 终审校验 Section VII。）

**studentCategory 分支：**

```javascript
import { isLocalCategory, isChinaOrInternationalCategory } from './students.js'
// ISAO 等节点：isChinaOrInternationalCategory(category)
```

### 5. Recall 规则（History Tab）

**允许 Recall 当：**

- `approvalLog` 最后一条为 **当前角色** 的 `Approved`
- 流程已推进到 **下一 stage**，且下一 stage **无任何** log 记录
- `status === 'In Progress'`
- **不允许**：Cancelled / Rejected / Approved 终态；Rejected 的 Recall 不在 v1

**动作：** 回退 `approvalStage` 到上一节点；标记或移除该 log  entry；记录 `Recalled` 可选；项回到 **Pending**（当前角色）。

### 6. Mock 当前审批角色

页内 **Role 下拉**（默认 `AC`）：`AC | HOD/HOP | AA HOD | Finance | ISAO | Admissions | Library | IT Office | Counselling Center | Accommodation | AAO | Academic Affairs | Dean/HoP`

切换角色时 Tab 计数与列表刷新，便于 demo Submitted ↔ Pending 切换。

首版 **System Admin 模拟单角色**，不实现登录。

### 7. 数据写回

```javascript
applyMovementApproval({ sourceKey, id, action, comment, adminFields? })
  → 更新对应 store 数组项 + approvalLog + status/stage

recallMovementApproval({ sourceKey, id, currentRole })
  → 回退 stage + log
```

四申请 View 的列表通过共享 reactive store（现有 `initial*` + ref 模式）自动反映审批结果。

### 8. UI 布局（对齐原型）

```
┌ MovementApprovalView ─────────────────────────────────────┐
│ [Submitted] [Pending] [History]     Role: [AC ▼]          │
│ 搜索区（Academic Session | 异动原因 | Status | ID | Name）│
│ [Approve] [Export]                                        │
│ 表格（共性列 + View | Approval log）                       │
│ TablePagination                                           │
└───────────────────────────────────────────────────────────┘
```

### 9. i18n 新增（示例）

| key | ZH | EN |
|-----|----|----|
| movementApproval.tabs.submitted | 已提交 | Submitted |
| movementApproval.tabs.pending | 待审 | Pending |
| movementApproval.tabs.history | 历史 | History |
| movementApproval.columns.approvalStage | 审批环节 | Approval Stage |
| movementApproval.columns.implemented | 是否实施 | Implemented |
| movementApproval.actions.view | 查看 | View |
| movementApproval.actions.recall | 撤回 | Recall |
| movementApproval.stages.* | 各节点名 | |

## 风险与应对

| 风险 | 缓解 |
|------|------|
| 四 store 合并查询性能 | 前端 mock，全量 merge + filter |
| 并行节点串行化与流程图不一致 | design 标注 v2 parallelGroup；log 仍写真实节点名 |
| 角色切换 demo 与真实权限差距 | OpenSpec Non-goal；UI 标明 mock |
| Recall 边界复杂 | v1 仅「下一节点未动」可 Recall |

## 迁移说明

1. `movementApprovalWorkflows.js` + `movementApprovalEngine.js`
2. 扩展 mock 数据 stage / session / implemented
3. `MovementApprovalView` 列表 + Tab + 搜索
4. `MovementApprovalDetailPanel` + 批量 `MovementApprovalModal`
5. Recall + Export mock
6. 注册 App + i18n + build 冒烟
7. §8：ExportModal + xlsx 替换 CSV（见 tasks §8）

## 待决问题

1. **Cancelled 可见性**：History 是否对所有审批角色可见？→ 首版 **是**（便于审计）
2. **Export 字段**：是否与列表列一致？→ 首版是
3. **是否实施**：AAO 终审后手动改 Yes/No，还是 Approved 自动 Pending？→ 首版默认 Pending，AAO 可改

### 10. §8 Export via ExportModal

**替换** `handleExport()` CSV Blob 为 ExportModal 流程：

```
MovementApprovalView
  ├── openExportModal() → 无数据 alert
  ├── ExportModal（useListPageI18n(movementApprovalExportFields)）
  └── handleExportConfirm({ selectedFields, exportScope })
        → exportMovementApprovalToExcel(..., columnMeta, { implementedAsYn: true })
```

**字段定义** — `movementApprovalExportFields.js`：

```javascript
export const movementApprovalExportColumnMeta = [
  { key: 'no', ... },
  { key: 'status', selectedByDefault: true },
  { key: 'approvalStage', selectedByDefault: true },
  { key: 'studentId', ... },
  { key: 'fullName', ... },
  { key: 'applicationSession', ... },
  { key: 'effectiveSession', ... },
  { key: 'movementCategory', ... },
  { key: 'applicationDate', ... },
  { key: 'implemented', selectedByDefault: false }, // History 列表列；Export 可选
]
```

**formatApprovalExportRow**：status i18n、`tr(approvalStage)`、`t(movementCategoryKey)`、`applicationDateDisplay`；implemented 用 Y/N（`formatImplementedYn`）。

**非目标**：Passport/IC 脱敏、超出列表的扩展 Export 列（以后加列再议）。
