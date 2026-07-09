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
  status: 'In Progress' | 'Approved' | 'Temporary saved' | 'Rejected',
  approvalStage: 'HoD/HoP Review' | 'Senate Review' | 'Approved' | '--',
  sourceCourseId,           // 基线课程 id（courses 中）
  sourceCourseCode,         // 冗余便于列表/搜索
  courseCode, courseName, offering, courseClassification, credit,
  applicant, applicationDateTime,
  changeDescription: {
    courseName: 'major' | 'minor',
    credit: 'major' | 'minor',
    courseClassification: 'major' | 'minor',
    clo: 'major' | 'minor',
    synopsis: 'major' | 'minor',
    prerequisite: 'major' | 'minor',
    teachingMethods: 'major' | 'minor',
    courseContent: 'major' | 'minor',
    assessmentMethods: 'major' | 'minor',
    references: 'major' | 'minor',
  },
  form: { /* 与 createEmptyCourseForm 同结构 */ },
  clos: [],
  slt: {},
  baselineSnapshot: {},    // 选课时的 courses 项快照，用于 diff / 回写对比
  approvalLog: [],
}
```

默认 `changeDescription.* = 'minor'`；Step 1 切换 Major 时存 `'major'`。

### 3. 基线选课 — `CourseSelectModal.vue`

- 数据源：`courses` ref（仅 **已生效** 课程；首版即 courses 列表全部）
- 展示：Course Code、Course Name、Offering、Classification
- 单选；Confirm 后 wizard 深拷贝 `course` → `form` / `clos` / `slt` / `baselineSnapshot`
- 编辑草稿时不可更换基线课程（Choose 禁用）或换课需二次确认清空 — **首版：草稿创建后不可换基线**

### 4. 四步向导 — `CourseChangeWizard.vue`

| Step | 组件 | 校验 |
|------|------|------|
| 1 Change Description | `ChangeDescriptionStep.vue` | 已选基线课程；各组件已选 major/minor |
| 2 Basic Information | 内嵌 form-grid（复用 Course Application 字段布局） | 同 `validateApplicationGeneralForm`；**Course Code 只读**（与基线一致，不可修改） |
| 3 CLO | CLO 表格 + modal | ≥1 CLO |
| 4 SLT | `CourseSLTStepPanel` | 同申请模块 |

Stepper：复用 `CourseDetailStepper`（4 步定义 `courseChangeSteps`）。

顶栏按钮：
- **Back**：ConfirmDialog 离开确认
- **Cancel**：同 Back
- **Previous / Next**：步骤导航；Next 校验当前步
- **Save**：任意步可 Save → status = Temporary saved

### 5. 变更说明 UI（Step 1）

**MAIN COMPONENTS**（原型）：
- Course Name、Credit Value、Course Classification、CLO

**OTHER COMPONENTS**：
- Synopsis、Pre-requisite / co-requisite、Teaching Methods、Course Content、Assessment Methods、References

每行两列切换：**Major Changes (N)** | **Minor / No Changes (Y)** — 互斥单选/切换，选中项蓝色高亮（与原型一致）。

说明文案（原型英文）作为每行 helper text，写入 i18n。

### 6. 列表页

**列**（用户规格 + 原型）：
No.、Status、Approval Stage、Course Name、Offering、Course Classification、Credit、Applicant、Application Date and Time、Actions

**搜索**：
- Row1：Course Code、Course Name、Offering + Search / Reset / More
- Row2：Course Classification；More 展开 Status、Applicant（与 Course Application 对齐）

**工具栏**：
| 按钮 | 规则 |
|------|------|
| Create | 进入 wizard create |
| Delete | 仅 Temporary saved；批量；ConfirmDialog |
| Export | ExportModal |
| Submit | 仅选中 Temporary saved；ConfirmDialog 二次确认 |
| Withdraw | 仅选中 In Progress；ConfirmDialog；退回 Temporary saved + approvalStage `--` + log |

**Actions 列**：
| status | 操作 |
|--------|------|
| Temporary saved | Edit、Approval Log |
| In Progress / Approved / Rejected | Details、Approval Log |

Status badge：与 Course Application 一致（深色底白字）。

### 7. 送审与审批（申请端 mock）

**Submit**：
- status → `In Progress`
- approvalStage → `HoD/HoP Review`
- 追加 approvalLog（Submitted by applicant）
- 单据进入后续 **Course Change Review** 队列（首版可在 store 标记，Review 页未实现时不影响申请端演示）

**Withdraw**：
- In Progress → Temporary saved
- approvalStage → `--`
- approvalLog 追加 Withdrawn

**终审回写** — 首版仅导出 **`applyApprovedChangeToCourse(changeApp, courses)`** helper，供后续 **Course Change Review** 模块在终审 Approved 时调用；申请端**不包含**审批弹窗与阶段推进 UI。

```javascript
/** Called by Course Change Review on final Approved (not from Application UI in v1). */
function applyApprovedChangeToCourse(changeApp, courses) {
  const index = courses.findIndex(c => c.id === changeApp.sourceCourseId)
  const before = courses[index]
  const payload = buildChangePayload(changeApp)
  const changeRecords = buildCourseChangeLogs(before, payload)
  courses[index] = { ...before, ...payload, changeRecords: [...before.changeRecords, ...changeRecords] }
  changeApp.status = 'Approved'
  changeApp.approvalStage = 'Approved'
}
```

### 8. 详情只读

- Step 1：变更说明表只读展示 major/minor 标签
- Step 2–4：复用 `CourseGeneralInfoDetail`、CLO 分页表、SLT readonly panel
- 顶栏：Back、Previous、Next、Export（占位 alert）

### 9. 共享状态

扩展 `courseStore.js`：

```javascript
export const courseChangeApplications = ref([...initialChangeApplications])
export const courses = ref([...])  // 已有
```

Course Change Application 与 Course Information 共用 `courses` ref 以实现回写。

### 10. i18n

新增：Change Description、Basic Information、Major Changes、Minor / No Changes、MAIN COMPONENTS、OTHER COMPONENTS、Credit Value、Teaching Methods、Course Content、Withdraw、变更说明、重大变更、无变更/轻微变更、撤回 等；菜单已有 `courseChangeApplication`。

## 风险与应对

| 风险 | 缓解 |
|------|------|
| 四步向导与三步申请代码重复 | 抽取 CLO/SLT/General 表单子组件；SLT 已共享 |
| Review 模块未实现导致 Submit 后无法审批 | 首版仅实现申请端；回写由 `applyApprovedChangeToCourse` helper 供 Review 调用；Submit 后单据等待 Review 模块 |
| 回写与 Course Information 详情 changeRecords 不同步 | 共用 courses ref + buildCourseChangeLogs |
| Step 1「Course Content」vs SLT 大纲语义重叠 | Step 1 仅标注变更类型；实际内容在 Step 4 SLT 编辑 |

## 迁移说明

纯前端新增。合并后验证：菜单 Course Change Application 可访问、Create 选课带出数据、Save/Submit/Withdraw、Details 四步只读、mock 回写后 Course Information 可见更新。

## 待定问题

（无）

## 已确认

- **Course Code 不可变更**（2026-06-02）：变更申请**不允许修改 Course Code**；Step 2 中 Course Code 只读，始终与基线课程一致；校验时 courseCode 须等于 baselineSnapshot.courseCode。
- **Rejected 只读终态**（2026-06-02）：status = Rejected 的单据**不可 Edit、不可 Submit、不可 Withdraw**；仅 Details 与 Approval Log。退回可编辑草稿通过 **Withdraw**（In Progress → Temporary saved）实现；Rejected 与退回草稿为不同终态/路径。
- **终审 mock 回写**（2026-06-02）：首版在 data layer 提供 **`applyApprovedChangeToCourse`** helper；**完整审批 UI 归属 Course Change Review** 后续变更，申请端不包含 Approval 弹窗。
- **列表不含 Course Code 列**（2026-06-02）：按用户规格，列表展示不含 Course Code；**搜索区含 Course Code**。
- **四步名称**（2026-06-02）：Change Description / Basic Information / CLO / SLT（中文：变更说明 / 基础信息 / 课程学习成果 / 学生学时）。
- **工具栏 Create**（2026-06-02）：英文 **Create**，与 Course Information 列表风格一致（原型中文「新增申请」对应 i18n）。
- **Submit / Withdraw 二次确认**（2026-06-02）：与 Course Application Submit、Approval Confirm 一致使用 ConfirmDialog。
