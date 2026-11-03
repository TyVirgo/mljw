# 基础数据-课程信息与开课申请 — 设计要点（合并）

## 文档用途

汇总历史 design 中与本菜单相关的决策与约束，供写需求文档时对照。冲突处以较新变更及当前代码为准。

## 来源：add-course-application

## 背景说明

项目为 Vue 3 + Vite 单页应用。Course Info 下 **Course Information** 已实现简单 CRUD（单页 Modal + General tab），而 **Course Application** 是独立的申请/审批流程，复杂度接近 Lecturer Information 四步向导 + Programme Version 嵌套表格。

原型要点：
- 列表页带 **Status** 彩色标签与 **Approval Stage**
- **Apply New Course** 为 **主内容区全页向导**（顶部 Back + Cancel/Previous/Next），非居中 Modal
- 三步：General Information → CLO → SLT
- CLO Step 2：表格 + Create/Delete + 行内 Edit/Delete；Create 弹窗含 Bloom（单选）、Teaching Methods（多选）、Assessment Methods（多选）
- SLT Step 3：含「课程内容大纲及子主题」「Continuous Assessment」「Final Assessment」三类子实体，各有 Learning Time（F2F Physical/Online、NF2F、Total SLT 汇总）
- 字段选项（产品说明）：Bloom A1–A5 / C1–C6 / P1–P7；Teaching Methods 多选 Lecture / Practical / Others；Assessment Methods 多选 8 项

## 目标 / 非目标

**目标：**
- 实现与原型截图一致的 UI 结构与交互
- 复用 Course Information 已有枚举与 Offering 数据源
- 提供完整 mock 数据（6 条列表 + CLO 样本 6 条 + SLT 子项样本）
- 支持 Temporary saved 草稿、Submit 进入 In Progress、Details 只读、Approval Log 时间线

**非目标：**
- 真实工作流引擎、邮件通知、与 Course Information 自动同步入库
- Senate / HoD 端独立审批页（本页仅展示 Approval Stage 与 Log）
- Step 1 以外部系统预填（首版手工录入）
- 附件上传（原型未体现）

## 设计决策

### 1. 视图模式 — 列表 / 向导 / 详情 三态

```
CourseApplicationView
├── viewMode: 'list' | 'apply' | 'detail'
├── list      → 搜索 + 工具栏 + 表格 + 分页
├── apply     → CourseApplicationWizard (create | edit draft)
└── detail    → CourseApplicationWizard (readonly) 或 DetailView
```

**理由**：原型 Apply 流程占满 main-content，与 ProgrammeVersion 的 `detailsView` 内嵌 panel 模式一致，而非 Lecturer 的 Modal 向导。

### 2. 文件结构

```
src/
├── data/courseApplications.js       # mock、枚举、校验、ID、status 流转
├── utils/exportCourseApplicationExcel.js
├── views/CourseApplicationView.vue
└── components/courseApplication/
    ├── CourseApplicationWizard.vue      # 三步 stepper + 步骤内容路由
    ├── steps/
    │   ├── GeneralInformationStep.vue
    │   ├── CloStep.vue
    │   └── SltStep.vue
    ├── CloFormModal.vue
    ├── CourseContentOutlineModal.vue
    ├── ContinuousAssessmentModal.vue
    ├── FinalAssessmentModal.vue
    └── ApprovalLogModal.vue
```

**理由**：与 `lecturer/`、`programme/` 分包一致；SLT 三个弹窗字段差异大，独立组件更清晰。

### 3. 数据模型

```javascript
{
  id,
  status: 'In Progress' | 'Approved' | 'Temporary saved' | 'Rejected',
  approvalStage: 'HoD/HoP Review' | 'Senate Review' | 'Approved' | '--',
  courseCode: string,           // 申请阶段可为空或临时码
  courseName: string,
  offering: string,             // department code → label via getOfferingLabel
  courseClassification: string,
  credit: number,
  applicant: string,
  applicationDateTime: string,  // 展示 DD.MM.YYYY HH:

## 来源：add-course-change-application

## 背景说明

Vue 3 + Vite 单页应用。Course Info 下已有：
- **Course Information** — 正式课库 CRUD + 详情四步（含 changeRecords）
- **Course Application** — 新课程申请（三步：General / CLO / SLT）
- **New Course Approval** — 新课程审批

**Course Change Application**（菜单 id `course-change-application`）是**变更申请端**：仅针对 Course Information 中**已生效**课程，带出基线后填报变更并送审。

```
┌─────────────────────┐   选择基线    ┌──────────────────────────┐
│ Course Information  │ ────────────▶ │ Course Change Application │
│ (正式课库)           │ ◀── 终审回写 │ (变更申请)                │
└─────────────────────┘               └───────────┬──────────────┘
                                                  │ Submit
                                                  ▼
                                      ┌──────────────────────────┐
                                      │ Course Change Review      │
                                      │ (后续独立变更，本 spec 不含) │
                                      └──────────────────────────┘
```

原型要点（见截图）：
- 列表 UI 与 Course Application 高度一致；工具栏为 **Create / Delete / Export / Submit / Withdraw**
- 四步 Stepper：**Change Description → Basic Information → CLO → SLT**
- Step 1 变更说明：`* Course Name` + **Choose** 按钮；MAIN / OTHER COMPONENTS 表格，每行 **Major Changes (N)** / **Minor / No Changes (Y)** 切换
- Step 2 基础信息：与 Course Information 相同双列表单（Course Code 等只读或可编辑按字段规则）
- Step 3/4：与 Course Application 的 CLO / SLT 一致

## 目标 / 非目标

**目标：**
- 实现与原型一致的列表 + 四步向导 UI
- 从 `courses` store 选择基线并深拷贝到申请单
- 变更说明逐步标注 major/minor
- 支持 Temporary saved、Submit → In Progress、Withdraw → Temporary saved
- Submit 后进入 In Progress / HoD/HoP Review；**阶段推进与终审回写不在申请端 UI 实现**，由 Review 模块调用 helper
- 提供 **`applyApprovedChangeToCourse`** helper（`buildCourseChangeLogs` + 更新 `courses`）
- Rejected 为**只读终态**，不可 Edit / 重提；需修改内容须新建变更申请
- 终审回写由 **`applyApprovedChangeToCourse` helper** 实现；完整审批 UI 在 **Course Change Review** 后续模块

**非目标：**
- **Course Change Review** 审批端完整实现（独立菜单 `course-change-review`，后续变更）
- 真实工作流引擎、RBAC、附件
- 按 major/minor 自动路由不同审批路径（首版仅存储标注，审批逻辑与 New Course 类似）
- 同一课程并发多笔变更冲突检测（首版允许，文档标注）

## 设计决策

### 1. 页面与路由

```
CourseChangeApplicationView
├── viewMode: 'list' | 'create' | 'edit' | 'detail'
├── list   → 搜索 + 工具栏 + 表格 + 分页
├── create/edit → CourseChangeWizard
└── detail → CourseChangeWizard readonly（四步只读，复用 CourseGeneralInfoDetail + 变更说明只读表）
```

`App.vue`：`pageId === 'course-change-application'` → `CourseChangeApplicationView`。

### 2. 数据模型 — `courseChangeApplications.js`

```javascript
{
  id,
  status: 'In Progress' | 'Approved' | 'Temporar

## 来源：add-new-course-approval

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
- 展示字段**含 Course Code 列

## 来源：align-change-description-step-ui

## 背景说明

`ChangeDescriptionStep.vue` 已在 `add-course-change-application` 变更中实现，功能上支持 MAIN/OTHER COMPONENTS 的 major/minor 标注，但视觉与信息架构与原型不符：

```
当前实现                          原型要求
─────────────────────────────────────────────────────────
┌──────────────┬────────────┐    ┌──────────┬─────────────┬─────────────┐
│ 组件名       │  N    Y    │    │ 组件名   │ Major (N/Y) │ Minor (N/Y) │
│ 单行 hint    │ Major Minor│    │          │ • bullet 1  │ • bullet 1  │
└──────────────┴────────────┘    │          │ • bullet 2  │ • bullet 2  │
                                   └──────────┴─────────────┴─────────────┘
```

数据层 `changeDescriptionComponents` 目前只有 `key / label / hint` 单字段，无法承载原型中每列独立的判定标准列表。

## 目标 / 非目标

**目标：**

- 三列表格布局严格对齐原型（表头 + 行分隔线 + 组件名列浅灰背景）
- 每行 Major / Minor 列各自展示 bullet criteria 文案（来自原型）
- Pill Toggle Switch 互斥选择（Y = 选中该列，N = 未选中）
- 分区标题左侧蓝色竖条（`border-left: 3px solid #2563eb`）
- 只读模式展示相同表格结构，高亮已选列
- 数据模型 `changeDescription` 不变（仍为 `{ [key]: 'major' | 'minor' }`）

**非目标：**

- 不改变 Step 2–4 向导逻辑
- 不新增变更组件项
- 不实现按 major/minor 自动路由审批路径
- 不修改列表页或其他模块

## 设计决策

### 1. 数据结构扩展 — `changeDescriptionComponents`

```javascript
{
  key: 'courseName',
  label: 'Course Name',
  majorCriteria: [
    'Change course name to reflect the change in course content.',
  ],
  minorCriteria: [
    'Improve the grammar of the course name.',
    'No change.',
  ],
}
```

- 移除 `hint` 字段，改用 `majorCriteria` / `minorCriteria` 字符串数组
- 文案以原型英文为 key，走 `tr()` i18n
- 10 个组件完整 criteria 见 spec delta

### 2. 组件拆分 — `ChangeLevelToggle.vue`

抽取可复用 pill toggle 子组件：

```
┌─────────────────────────┐
│  [N]────○  或  [Y]────●  │  ← 44×24px pill, active=#2563eb
└─────────────────────────┘
```

Props: `active: Boolean`, `disabled: Boolean`（readonly 时）
Emit: `toggle`

每行渲染两个 toggle（major / minor），点击 active=false 的列时 emit 切换；点击已 active 列无操作（保持互斥选中）。

### 3. 表格布局 — CSS Grid

```html
<div class="change-table">
  <div class="table-header">...</div>   <!-- 3 cols: 1fr 1fr 1fr -->
  <div class="table-row">...</div>
</div>
```

- `grid-template-columns: minmax(180px, 1fr) 1fr 1fr`
- 表头：Major Changes / Minor / No Changes 居中
- 组件名列：`background: #fafafa`
- 行间：`border-bottom: 1px solid #e5e7eb`
- criteria bullets：`font-size: 12px; color: #6b7280; list-style: disc; padding-left: 16px`

### 4. 只读模式

- 隐藏 toggle，在选中列顶部显示蓝色 badge「Y」，未选中列显示灰色「N」
- 或保留 toggle 外观但 `pointer-events: none` + 仅 active 列高亮（与原型 detail 态一致）

**决策**：保留 toggle 视觉、禁用交互，active 列蓝色 — 与编辑态一致，减少两套样式。

### 5. i18n 策略

- criteria 文案 key 格式：`changeDesc.<key

## 来源：polish-course-library-import-footer

## Context

课程库导入弹窗页脚已有「分页 + 操作」结构，但缺 `footer-pagination` 包装与按钮 CSS，观感偏离同仓库选择类弹窗。

## Decisions

| 决策 | 说明 |
|------|------|
| 对齐模板 | `StudentSelectModal` / `CourseSelectModal` |
| 布局 | 同一 `modal-footer` 行：左分页、右取消+导入 |
| 分页样式 | `:deep(.table-pagination)` 去掉 `margin-top` / `border-top` / `padding-top` |
| 按钮 | 高度 36px、主色蓝、次要描边；未选中时 primary disabled |

## File Impact

- `src/components/courseRegistration/CourseLibraryImportModal.vue`

## 来源：polish-course-list-pager-filter

## Decisions

1. 感叹号用现有 `hint-popover`，内容为 `eligibilityDetailLabel(course)`。
2. 先修拆分：`prerequisiteNotTaken`（未修读）、`prerequisiteFailed`（不及格）；`failedCourses` 来自监控行 demo。
3. 分页：`TablePagination`，默认 pageSize=10；筛选变化重置页码。
4. 漏斗：表头图标 + 弹出选项（全部/各学分），有筛选时图标高亮。

## 来源：redesign-prerequisite-modal

## 背景说明

`CoursePrerequisiteModal` 被 Course Information 与 Course Application 的 Step 1 共用。当前实现为窄弹窗（640px）、实时 filter、三列简易列表，不符合最新原型。

原型 **Add** 弹窗特征：

```
┌────────────────────────────────────────────────────────────────────────── Add ─┐
│ Course Name: [____]  Course Code: [____]  Offering: [▼____]  [Search][Reset] │
├──────────────────────────────────────────────────────────────────────────────┤
│ ☐ │ No. │ Course code │ Course Name │ Offering │ Credit Value │ 课程性质      │
│ ☑ │  1  │ PHY101      │ ...         │ SOAIR... │ 2            │ 必修课        │
│ ☑ │  2  │ PHY102      │ ...         │ SOAIR... │ 2            │ 选修课        │
├──────────────────────────────────────────────────────────────────────────────┤
│ Total 6 records          [Home][<][1][>][End]  10 records/page  Jump to [1]  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                    [Discard]  [Confirm]        │
└──────────────────────────────────────────────────────────────────────────────┘
```

项目已有 `CourseInformationView` 列表检索 + `TablePagination` 模式，可复用交互范式（draft search vs applied search）。

## 目标 / 非目标

**目标：**

- UI 与原型一致：宽弹窗、三字段检索 + Search/Reset、七列表格、分页、Discard/Confirm
- 保留现有集成契约：`selectedCodes` 字符串 ↔ 多选 courseCode 数组
- Offering 列展示院系英文名（`getOfferingLabel`）；Course Classification 列展示 `tr(courseClassification)`
- 排除 `excludeCode`（当前正在创建/编辑的课程）

**非目标：**

- 修改向导 Step 1 先修课只读输入框 + Choose 按钮布局
- 服务端分页或远程 Search
- 弹窗内排序列头

## 设计决策

### 1. 弹窗尺寸与结构

| 属性 | 值 |
|------|-----|
| `max-width` | `1000px`（可微调，需明显大于现 640px） |
| `max-height` | `calc(100vh - 48px)`，body 内表格区 `flex:1; min-height:0` |
| 标题 | `tr('Add')` |
| 关闭 X | 保留右上角 ×，行为同 Discard |

**理由**：原型表格列多（Offering 名称长），需宽屏；与 `ExportModal` 等大弹窗一致。

### 2. 检索区布局

```javascript
// draft（输入中） vs applied（点击 Search 后生效）
searchDraft = { courseName, courseCode, offering }
searchApplied = { ... }
```

- **第一行 grid**：3 列字段 + 右侧 Search / Reset（与 `CourseInformationView` search-row 类似，标签左对齐、冒号对齐）
- **Search**：`searchApplied = { ...searchDraft }`，`currentPage = 1`
- **Reset**：清空 draft & applied，恢复全量
- 打开弹窗时：恢复 `checkedCodes` 来自 `selectedCodes`，**清空检索**（与列表页 Reset 一致）

过滤逻辑（client-side）：

```javascript
available = courses.filter(c => c.courseCode !== excludeCode)
filtered = available.filter(match applied courseName, courseCode, offering)
paginated = slice(filtered, (page-1)*pageSize, page*pageSize)
```

### 3. 表格与选择

| 列 | 数据源 |
|----|--------|
| Checkbox | `checkedCodes: string[]` |
| No

## 来源：refine-approval-modal-action-labels

## 背景说明

审核弹框由两个结构相同的组件承载，均渲染：

```vue
<label v-for="opt in approvalActionOptions">
  <input type="radio" :value="opt" />
  <span>{{ tr(opt) }}</span>   <!-- 当前：走 zh-flat 全局键 -->
</label>
```

全局 `zh-flat` 中 `Approved: '已通过'`、`Rejected: '已驳回'` 同时被 **状态筛选、列表徽章** 等复用，不能直接改全局键。

```
┌─────────────────────────────────────────────────────────┐
│                    文案使用场景                          │
├──────────────────────┬──────────────────────────────────┤
│ 审核弹框 Action 单选  │  通过 / 不通过 / 驳回  ← 本次改  │
├──────────────────────┼──────────────────────────────────┤
│ 列表 Status 徽章      │  已通过 / 已驳回 / 需修改  ← 不改 │
├──────────────────────┼──────────────────────────────────┤
│ 时间线 approvalTimeline │ approved / rejected … ← 不改   │
└──────────────────────┴──────────────────────────────────┘
```

## 目标 / 非目标

**目标：**

- 两个 Modal 统一三档操作中文：通过、不通过、驳回
- 存库 action 值不变，引擎零改动
- 英文 Pass / Not Pass / Return（或项目既有习惯）

**非目标：**

- 改 `Update Required` 枚举值为 `Return`
- 时间线 / 列表 status 文案联动修改

## 设计决策

### D1：专用 i18n 键，不碰 zh-flat 全局 Approved/Rejected

```js
// zh.js
approvalModal: {
  action: {
    approved: '通过',
    rejected: '不通过',
    updateRequired: '驳回',
  },
}
```

Modal 内映射：

```js
const APPROVAL_ACTION_LABEL_KEYS = {
  Approved: 'approvalModal.action.approved',
  Rejected: 'approvalModal.action.rejected',
  'Update Required': 'approvalModal.action.updateRequired',
}
```

或抽取 `src/utils/approvalActionLabels.js` + `getApprovalActionLabel(action, t)` 供两 Modal 共用。

### D2：两 Modal 共用 helper（推荐）

避免 `MovementApprovalModal` 与 `CourseApprovalModal` 各写一份 map；helper 单点维护。

### D3：语义对照（产品确认）

| 操作 | 业务含义 |
|------|----------|
| 通过 | 本节点同意；非终审则推进下一 stage |
| 不通过 | 终态拒绝（Rejected），流程终止 |
| 驳回 | 退回修改（Update Required），申请人可 Resubmit |

与 `add-new-course-approval` design 中 Rejected vs Update Required 区分一致。

## 风险与应对

| 风险 | 缓解 |
|------|------|
| 改 zh-flat 误伤状态筛选 | 使用专用 key，不改全局 |
| 两 Modal 漏改一处 | tasks 列出全部引用点 + 冒烟 |
| 英文文案不统一 | en.js 同步三键 |

## 迁移说明

纯展示层变更，无 mock 数据迁移。

## 来源：refine-course-list-status-ux

## Decisions

1. **名额列**：只展示 `剩余/总量 · 有余量|已满`，占用状态不覆盖。
2. **选课状态列**：占用 → 蓝标「已选/排队中」；否则可选绿 / 不可选红（title=完整原因）。
3. **操作**：占用仅「详情」；不可选为弱文案+title 原因；可选为「立即选课」。
4. **行样式**：去掉整行 opacity，详情始终可点。
5. **学分筛选**：表头内嵌 select，写入 appliedSearch.credits，在 `filterStudentCourseList` 过滤。
