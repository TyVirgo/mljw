# 学籍管理-异动审批 — 设计要点（合并）

## 文档用途

汇总历史 design 中与本菜单相关的决策与约束，供写需求文档时对照。冲突处以较新变更及当前代码为准。

## 来源：add-movement-admin-cancel

## 两套 Cancel 并存

| 入口 | 条件 | 说明 |
|------|------|------|
| 学生列表 | In Progress + Pending Review + 未开始审批 | 保留 add-*-app |
| 管理列表 | In Progress | 本次新增 |

## 组件

```
MovementAdminCancelAction.vue
  props: sourceKey, item (raw)
  canAdminCancelMovement(item) → status === 'In Progress'
  点击 → ConfirmDialog → adminCancelMovement → upsertInStore

movementApplicationCancel.js
  canAdminCancelMovement / adminCancelMovement / applyAdminCancelInStore
  actor 默认 'AC'；log comment 区分 学生/ AC
```

Cancel 仅出现在管理端列表 Actions，不在详情抽屉 Footer。

## 来源：add-movement-approval-app

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
|-----|-----------|------

## 来源：add-movement-approval-list-columns-and-documents-hint

# 设计
## 历史申请次序

同 `studentId` + `sourceKey`（四异动），排除 Draft，按 `submittedAt` 升序排名；始终从 1 开始显示。

## Last Action Time

`approvalLog` 中 action 为 Approved / Rejected / Update Required 的最新 `dateTime`，格式 `YYYY-MM-DD HH:mm:ss`（与 Created At 一致）。无审批动作显示 —。

## 表头 Tooltip

`MovementApprovalTableHeaderLabel`：列名 + `?` 图标，i18n `movementApproval.columnHints.*` 说明含义与 — 规则。

## 附件 hint

每附件行 `.file-row` 下方展示 `hintKey` 文案，class `hint-text`。

## 来源：add-movement-approval-log-parallel-branches

## 节点类型

| type | 含义 |
|------|------|
| `step`（默认） | 串行节点（申请人 / AC / HOD / AAO…） |
| `branch-start` | 「分支开始，并行审批」 |
| `parallel-item` | 会签分支卡片 |
| `branch-join` | 「分支汇聚：等待所有分支完成」或汇聚完成 |

## 构建规则

1. 遍历 workflow stages；命中 `getParallelGroups` 首成员时整组折叠一次  
2. 组内每 stage：`resolveStageNode`（有 log 用动作；当前/组内未完成 → pending；否则 upcoming）  
3. `branch-join`：组内全部 Approved（无 Rejected/Update Required 未关闭）→ completed；否则 pending  

## Demo

`DEF016`：Local 休学，已过 AA HOD；Admissions 已通过、Library 待审、IT 需修改、Accommodation 待审；`approvalStage: 'Library'`。

## 来源：inline-movement-approval-search-fields

## 背景说明

```
当前（refine-movement-approval-search-ui）     目标（本 change）
─────────────────────────────────────────     ─────────────────────────────
Academic Session                              Academic Session  [________]
[______________]                              Movement Reason   [________]
（标签与输入分两行）                            Status            [▼ All    ]
                                              （标签与输入同一行）
```

全局样式 `list-page-search.css` 已定义 inline 布局；`MovementApprovalView` scoped 样式覆盖了该行为。

## 目标 / 非目标

**目标：**

- 每个搜索项：标签 + 输入/下拉 **同一行**，标签 `white-space: nowrap`
- 搜索区整体与课程审批等模块视觉一致
- 删除冗余 scoped 搜索样式，避免再次覆盖全局规范

**非目标：**

- 强制 5 个字段永不折行（窄屏时字段组可 wrap，但组内不换行）
- 搜索逻辑变更

## 设计决策

### 1. 采用全局 `list-page-search.css`，删除 scoped 覆盖

**删除** `MovementApprovalView.vue` scoped 中的：

- `.search-fields` grid 定义
- `.search-item { flex-direction: column }`
- `.search-item label` 小字号覆盖（改用全局 13px）
- `.search-input, .search-select` 重复定义（全局已有）
- `.search-row { align-items: flex-end }`（改为全局 `align-items: center`）

**保留**（页面特有、不与 `.search-bar` 冲突）：

- `.search-bar { margin-bottom: 16px }` 可删除（全局已有 border-bottom）；若与 page-card 间距需微调可留 `margin-bottom` only

### 2. 模板结构

保持现有 DOM 结构不变（已符合全局选择器）：

```html
<div class="search-bar">
  <div class="search-row">
    <div class="search-fields">
      <div class="search-item">
        <label>...</label>
        <input class="search-input" />
      </div>
      ...
    </div>
    <div class="search-actions">...</div>
  </div>
</div>
```

### 3. 标签冒号（可选）

与 `CourseApprovalView` 对齐时，英文 flat key 常带 `:`（如 `学生ID:`）。当前 movement 搜索 label 使用 i18n nested key 无冒号——**v1 不改文案**，仅调布局；若视觉需冒号可在 i18n 或 label 模板追加。

### 4. 窄屏行为

| 层级 | 行为 |
|------|------|
| 单字段内 | 标签 + 控件始终同行，`label { white-space: nowrap }` |
| 字段之间 | `search-fields` flex-wrap，空间不足时整组换行 |
| 操作按钮 | `search-actions` 保持右侧，`margin-left: auto` |

## 风险与应对

| 风险 | 缓解 |
|------|------|
| 长中文标签挤压输入框 | `label` nowrap + 输入固定宽度 180px；必要时缩短 i18n |
| scoped 删除后与其他页面样式耦合 | 有意复用全局规范，降低维护成本 |

## 迁移说明

1. 删除 `MovementApprovalView.vue` scoped 搜索相关 CSS
2. 目视对比 `CourseApprovalView` 搜索区
3. `npm run build` + 浏览器缩放冒烟

## 待决问题

（无阻塞项。）

## 来源：refine-movement-admin-cancel-to-approval-history

# 设计

## 入口矩阵（变更后）

| 页面 | 撤销 |
|------|------|
| 申请（管理端） | ✗ |
| 维护 | ✗ |
| 审批 · 历史 Tab 列表行 | ✓（In Progress） |
| 审批 · 已提交/待我审批 | ✗ |
| 查询 | ✗ |

复用 `MovementAdminCancelAction` + `applyAdminCancelInStore`；`entryPoint: 'approval-history'`。

## 与「撤回」区分

- **撤销**：终止流程 → Cancelled（`movementAdminCancel`）
- **撤回**：撤回上一笔通过（`movementApproval.recall`，详情 footer，不变）

## 来源：refine-movement-admin-detail-export

## 抽屉布局

```
MovementDetailContent（申请详情 + 附件）
MovementApprovalLogTable（四列，日志顺序）
Footer: [导出 PDF]* [关闭] …   *仅 enableExportPdf
```

## Approval Log 列

| Description | Action By | Action By Role | Created At |
| Submitted → Application Submitted | actor | actorRole / 映射 | YYYY-MM-DD HH:mm:ss |
| 其他 | actor | 映射 | 同上 |

## 导出命名

- PDF：`{序号}. {学号} {姓名大写} - {FormType} Form {可选 YYYYMM}`
- 附件：`{序号}. {学号} {姓名}_ {DocType}_{MovementType}.ext`
- Approved：`resolveExportArchiveNumber` 稳定随机；否则 `NA`

FormType / MovementType：`Programme Transfer` | `Deferment` | `Resumption` | `Withdrawal`

## 详情附件与声明

- 详情（抽屉 / DetailModal）**不展示**「Download Consent Letter / 下载同意书」；该按钮仅在 `*FormModal` 新增/编辑上传区保留
- 详情声明：`MovementDeclarationSection` 只读时 checkbox 视觉与新增表单一致（蓝色勾选），不可交互
- Footer 按钮顺序（管理端 PDF）：`[导出 PDF] [关闭] [撤销?] [审批?]`

## 来源：refine-movement-approval-search-ui

## 背景说明

```
变更前（add-movement-approval-app）          §1–§5 已交付              §6–§10 目标态
────────────────────────────────────        ─────────────────          ─────────────────────────
[Role: Pending Review ▼]                    （已移除）                  —
[Submitted][Pending][History]               同左（顺序未改）            [Pending][Submitted][History]
搜索：3 字段 + 更多 → 2 字段                   5 字段响应式栅格           4 字段（无异动原因）
表格：含异动原因；状态 badge 不可见            同左                       去原因 + 加申请日期；历史 Tab 才 Y/N
```

审批引擎 `classifyApprovalBucket(item, currentRole)` 仍依赖角色；UI 不再暴露切换，v1 使用固定默认角色 `Pending Review`。

## 目标 / 非目标

**目标：**

- 列表页视觉与产品图示一致：无 Current approver role
- 搜索字段在同一区域自适应换行（§8 后 **4 字段**）
- Search / Reset 始终右对齐于搜索区
- Tab 顺序 **待我审批 → 已提交 → 历史**；仅待我审批显示角标
- 表格：状态 badge 可见；去异动原因；加申请日期；历史 Tab 才显示是否实施 Y/N

**非目标：**

- 权限系统、Header 角色切换
- ~~搜索字段增删或 Tab 逻辑变更~~（§6 允许搜索减字段、Tab 顺序/角标与列展示调整；**不**改 `classifyApprovalBucket` 语义）

## 设计决策

### 1. 默认审批角色

```javascript
// movementApprovalEngine.js（或 MovementApprovalView 顶部常量）
export const DEFAULT_APPROVER_ROLE = 'Pending Review'
```

- `MovementApprovalView` 使用 `const currentRole = DEFAULT_APPROVER_ROLE`（非 `ref` 亦可，除非未来从 composable 注入）
- `MovementApprovalReviewView` 继续接收 `:current-role="currentRole"`
- 批量审批、`applyMovementDecision`、`canRecallMovement` 入参不变

**权衡：** 失去页内多角色 demo；开发调试可改常量或后续接 auth mock。

### 2. 页面结构顺序（§6–§10 目标态）

```
┌ MovementApprovalView ─────────────────────────────────────┐
│ [Pending (7)] [Submitted] [History]   ← 仅 Pending 角标   │
│ ┌ search-fields (grid, 4) ───────────┐ [Search] [Reset]   │
│ │ Academic Session | Status           │                     │
│ │ 学生ID | 学生Name         │                     │
│ └────────────────────────────────────┘                     │
│ [Review] [Export]  （仅 Pending Tab 显示 Review）          │
│ 表格 + 分页（History 多「是否实施 Y/N」列）                 │
└────────────────────────────────────────────────────────────┘
```

Tab 栏置于搜索区之上（与图示一致）。

### 3. 搜索区 CSS

参考 `CourseApprovalView.vue` 的 `.search-row` + `.search-fields` 模式，本页采用：

```css
.search-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
  justify-content: space-between;
}

.search-fields {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px 16px;
  flex: 1;
  min-width: 0;
}

.search-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  align-self: flex-end;
}
```

- 移除 `.search-row-secondary`、`searchExpanded`、`toggleSearchExpanded`
- 移除 `.role-ba

## 来源：refine-movement-approval-stage-department-labels

## 映射（摘录）

| stage key | 部门展示名（EN） | 中文直译 |
|-----------|------------------|----------|
| Pending Review | Degree Academic Coordinator | 学位教务协调员 |
| HOD/HOP | Degree Head of Department/Head of Programme | 学位系主任/项目主任 |
| Academic Affairs | UG Academic Coordinator | 本科教务协调员 |
| … | 见 `STAGE_ROLE_MAP` | zh-flat 直译 |

`Applicant` / `Submission` 时间轴首节点保持「申请人」语义（既有 tr）。

列表/导出：`formatApprovalStageLabel(stage, tr)` → `tr(STAGE_ROLE_MAP[stage] || stage)`。
时间轴：对 `node.stageLabel` 同样格式化（申请人节点仍用 Applicant）。

## 来源：refine-movement-cancel-entry-points

## 三套操作

| 操作 | 入口 | 文案 | 条件 |
|------|------|------|------|
| 学生取消 | 学籍异动申请（学生） | 取消 | Pending Review + 审批未开始 |
| AC 撤销 | 学籍异动申请（管理端） | 撤销 | In Progress（进行中/审批中） |
| AC 撤销 | 学籍异动维护 | 撤销 | In Progress |

## 组件

```
MovementStudentCancelAction.vue  — 学生申请列表「取消」+ tooltip
MovementAdminCancelAction.vue    — 管理端申请 + 维护列表「撤销」+ tooltip（两条，对齐原型）
```

**撤销 tooltip（管理端申请）**
1. AC 在「学籍异动申请（管理端）」列表对 In Progress（进行中/审批中）申请执行撤销。
2. 确认撤销后，申请流程被终止结束，通知流程的各个部门该流程已终止。

维护页第一条改为「学籍异动维护」列表，第二条相同。

四类 `*View.vue` 按 `applicantMode` 二选一展示上述组件；Query / Approval 不引用 管理员Cancel。

## 来源：refine-movement-detail-approval-timeline

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

## 来源：remove-movement-approval-last-action-time-column

## 列顺序（移除后）

```
序号 | 状态 | 审批阶段 | [实施] | 学号 | 姓名 | 申请学期 | 生效学期 | 异动类别 | 申请次数 | 申请日期 | 操作
```

`[实施]` 仅历史 Tab 显示；待办 Tab 含勾选列。

## 清理

- 删除 `resolveLastApprovalActionTime` 及仅被其使用的 `APPROVER_ACTIONS` / `parseApprovalLogTimestamp`
- `tableColspan` 基数由 12 调整为 11

## 来源：restore-movement-approval-last-action-time-column

## 列顺序

```
… | 申请次序 | 最近审核时间 | 申请日期 | 操作
```

## 最近审核时间语义

相对 `approvalStage`（当前审批节点）：

1. **首节点**（Pending Review）：前一节点 = 学生提交 → 取 `Submitted` 时间  
2. **当前节点在会签组内**：前一节点 = 会签组之前的串行节点 → 取该节点审批动作最新时间  
3. **当前节点在会签组之后**：前一节点 = 整组会签 → 取组内各分支审批动作的 **max** 时间  
4. **其它串行**：前一节点 = `getPreviousStage` 对应 stage → 取该 stage 审批动作最新时间  

审批动作：`Approved` / `Rejected` / `Update Required`。格式同日志 Created At。

## 会签分组（逻辑组，v1 仍串行推进）

| sourceKey | parallelGroup |
|-----------|---------------|
| deferment | Admissions / Library / IT / Accommodation |
| resumption | Admissions / Accommodation |
| withdrawal | Admissions / Library / IT / Counselling / Accommodation |
| programme-transfer | （无） |

Finance / ISAO / HOD 等保持串行节点。

## History / 终态

- `approvalStage === 'Approved'`：相对 Approved，前一节点为末级审批（或会签后的 AAO）  
- `approvalStage` 无效（如 `--`）：回退为 Submitted，再否则整单审批动作最新时间
