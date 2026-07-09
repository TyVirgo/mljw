## 背景说明

Vue 3 + Vite 单页应用。Course Application 已实现申请端：Submit 后 status=`In Progress`、approvalStage=`HoD/HoP Review`。New Course Approval 是**审批端镜像**，菜单 id 为 `course-approval-process`，label **New Course Approval**。

原型要点（见截图）：
- 列表与 Course Application 高度相似，但工具栏为 **Approval + Export**，无 Apply/Delete/Import/Submit
- 操作列：**Details**、**Approval Log**（无 Edit）
- 审批弹窗：表格化表单（左灰底标签、右白底输入），Action 三选一 + Comments 100 字

```
┌──────────────────────┐     Submit      ┌──────────────────────┐
│  Course Application  │ ──────────────▶ │ New Course Approval  │
│  (申请人)             │                 │  (审批人)             │
│  Temporary saved     │ ◀── Update Req  │  In Progress …       │
└──────────────────────┘                 └──────────┬───────────┘
                                                      │ Final Approved
                                                      ▼
                                           ┌──────────────────────┐
                                           │ Course Information   │
                                           └──────────────────────┘
```

## 目标 / 非目标

**目标：**
- 实现与原型一致的列表 + Approval 弹窗 UI
- 数据源：Course Application 已提交单据（status ≠ Temporary saved，或专门 `submittedAt` 标记）
- 支持三态审批动作及 approvalLog 追加
- 终审通过后 mock 写入 `courses` 列表
- Update Required 退回申请端草稿

**非目标：**
- 真实角色权限、待办推送、会签/加签
- 按登录用户过滤「仅我的节点」— 首版展示全部 mock 单据，弹窗标题展示**当前模拟节点**（如 HoD/HoP Review）
- 常用意见维护后台（首版 **3–5 条静态模板**，见 Resolved）
- Course Change Application / Review 模块

## 设计决策

### 1. 页面与路由

```
CourseApprovalView
├── viewMode: 'list' | 'detail'
├── list   → 搜索 + Approval/Export + 表格 + 分页
├── detail → CourseApplicationWizard readonly
└── modals → ApprovalLogModal, CourseApprovalModal, ExportModal
```

`App.vue` 中 `pageId === 'course-approval-process'` 渲染 `CourseApprovalView`。

### 2. 数据共享策略

**方案 A（推荐）**：在 `App.vue` 或 lightweight composable 中持有 `applications` ref，通过 provide/inject 或 props 传给 Course Application 与 Course Approval 两视图。

**首版简化**：`courseApplications.js` 导出 `initialCourseApplications` + 审批 helper；两页面各自 `ref` 拷贝 mock，**审批页读取同一模块函数** `getApprovalQueue(applications)` 过滤。实现阶段优先 **单页内共享 store 式 module state**（`courseApplicationStore.js` 可变 ref）避免双页数据不同步。

### 3. 列表数据过滤

```javascript
function getApprovalQueue(allApplications) {
  return allApplications.filter((item) => item.status !== 'Temporary saved')
}
```

Temporary saved 草稿仅出现在 Course Application。

### 4. 列表列与样式

对齐 Course Application 近期 UI：
- Status 深色底白字 badge
- 行高加大、`white-space: nowrap`、操作列 sticky
- 展示字段**含 Course Code 列**（位于 Approval Stage 与 Course Name 之间，与 Course Application 列表一致）

### 5. 搜索布局

与 Course Application 一致：
- 第一行：Course Code、Course Name、Offering + Search / Reset / More（按钮靠右）
- 第二行：Course Classification；More 展开 Status、Applicant（可选，与申请页对齐）

### 6. Approval 弹窗 — `CourseApprovalModal.vue`

| 区域 | 内容 |
|------|------|
| Header | Approval / 审核 |
| Intro | `Please fill in the following information before submitting (Current {stage})` |
| Action | Radio: Approved \| Rejected \| Update Required |
| Comments | textarea maxlength 100，counter `n/100`；**Common Comments** 下拉/弹层选择 **3–5 条静态预设** 填入文本框 |
| Footer | Cancel（default）、Confirm（primary） |

**校验**：Confirm 时 Action 必选；Comments 在 Rejected / Update Required 时必填（Approved 可选，首版可统一必填以简化）。

### 7. 审批动作与阶段机

| Action | status | approvalStage | 其他 |
|--------|--------|---------------|------|
| Approved @ HoD/HoP | In Progress | Senate Review | log |
| Approved @ Senate | Approved | Approved | **archiveToCourseInformation** |
| Rejected | Rejected | 保持或 `--` | log，不可再 Approve |
| Update Required | Temporary saved | `--` | log，从审批队列消失，回申请页可 Edit+Submit |

```javascript
const STAGE_FLOW = {
  'HoD/HoP Review': { next: 'Senate Review', final: false },
  'Senate Review': { next: 'Approved', final: true },
}
```

弹窗展示 `Current ${approvalStage}` 作为「当前 QA/环节」。

### 8. 归档至 Course Information

`archiveApprovedApplication(application, courses)`：
- 若 `courseCode` 不存在于 courses，调用 `buildCourseCreatePayload` 追加
- 若已存在，跳过或更新（首版：跳过并 message）

需 App 级共享 `courses` ref，或事件总线 — 与 applications 同样用 shared store。

### 9. 工具栏 Approval 按钮（批量）

- 选中 ≥1 条 **可审批** 记录（status=In Progress 且当前节点可审）时可用
- **支持批量审核**：勾选多条后点 Approval，打开**同一**审批弹窗；Confirm 时对所选全部记录应用相同 Action 与 Comments
- 批量约束（首版）：
  - 所选记录须均为 **In Progress** 且 **approvalStage 相同**（同一审批节点）；否则禁用 Approval 或提示「请选择同一审批环节的申请单」
  - 逐条执行 `applyApprovalDecision`；归档/退回逻辑与单条一致
- 弹窗 intro 展示当前节点（取自所选记录的 approvalStage，批量时须一致）

原型倾向列表行内无 Approve，仅工具栏 **Approval** — 勾选后点 Approval 打开弹窗。

### 10. Actions 列

- **Details** → `CourseApplicationWizard` mode=detail
- **Approval Log** → `ApprovalLogModal`（Temporary saved 不显示 — 审批队列无此项）

### 11. Export

`exportCourseApprovalExcel.js`，字段与列表列一致（**含 Course Code**）。

### 12. i18n

新增键：`Approval`、`Action`、`Comments`、`Common Comments`、`Update Required`、`Please fill in the following information before submitting (Current {stage})`、中文「审核」「请选择审核结果」「办理意见」「常用意见」「驳回」等。

## 风险与应对

| 风险 | 缓解 |
|------|------|
| 两页面 mock 数据不同步 | shared store / provide-inject |
| Course Application「Rejected 不可重提」与「驳回回草稿」语义冲突 | **Rejected**=终态拒绝；**Update Required**=退回草稿，二者分开 |
| 无 RBAC 时所有单据可见 | 文档标注 demo；弹窗显示 mock 当前节点 |
| 归档与 Course Information 列表分离 | 实现 shared courses state |

## 迁移说明

纯前端新增。合并后验证菜单 **New Course Approval** 可访问、Submit 后单据出现在审批列表、Approved 后 Course Information 可见新课程。

## 待定问题

（无）

## 已确认

- **Common Comments**（2026-06-02）：首版使用 **3–5 条静态模板**，点击填入 Comments 文本框；无维护后台。
- **批量 Approval**（2026-06-02）：**支持批量审核**；所选记录须同一 approvalStage，Confirm 后统一 Action/Comments 逐条生效。
- **Course Code 列**（2026-06-02）：列表**展示 Course Code 列**（Approval Stage 之后、Course Name 之前）。
- **Current QA 文案**：使用 approvalStage 原值（如 HoD/HoP Review）。
