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
  applicationDateTime: string,  // 展示 DD.MM.YYYY HH:MM
  general: {
    // 与 Course Information 完全一致（8 字段）
    courseCode, courseName, offering, courseOwner,
    courseClassification, credit, mediumOfInstruction, semesterType,
  },
  clos: [{
    id, clo, outcome, bloomLevel,
    teachingMethods: string[],
    assessmentMethods: string[],
  }],
  slt: {
    contentOutlines: [{
      id, courseContent, cloIds: number[],
      learningTime: {
        f2fPhysical: { lecture, tutorial, practical, others },
        f2fOnline: { lecture, tutorial, practical, others },
        nf2f: number,
        totalSlt: number,  // 前端汇总
      },
    }],
    continuousAssessments: [{
      id, type, percentage,
      learningTime: { f2fPhysical, f2fOnline, nf2f, totalSlt },
    }],
    finalAssessments: [{ id, type, percentage, learningTime }],
  },
  approvalLog: [{
    id, stage, actor, action, dateTime, comment,
  }],
}
```

列表行字段从顶层扁平字段读取，与 `general` 在保存时同步。

### 4. 枚举 — 集中定义于 courseApplications.js

| 枚举 | 值 |
|------|-----|
| status | In Progress, Approved, Temporary saved, Rejected |
| approvalStage | HoD/HoP Review, Senate Review, Approved, -- |
| bloomLevel | A1–A5, C1–C6, P1–P7 |
| teachingMethods | Lecture, Practical, Others |
| continuousAssessmentTypes | Coursework, …（原型默认 Coursework） |
| finalAssessmentTypes | Final examination, … |
| assessmentMethods | Assignments, Quiz, Mid-term Examination, Practical Test, Lab Report, Presentation, Project, Final Examination |

**说明**：CLO 表格展示可将多选 methods 逗号拼接（如 "Lecture, Tutorial" 为 mock 展示兼容，选项以 Lecture/Practical/Others 为准）。

### 5. 三步向导交互

| 步骤 | 行为 |
|------|------|
| 1 General | 与 Course Information 相同字段（含 Pre-requisite、Synopsis、References）；**内嵌于页面可滚动区域**，不使用大弹窗包裹 |
| 2 CLO | 表格 CRUD；**至少 1 条 CLO 必填** 才可进入 Step 3 |
| 3 SLT | 三个子表格/区块；Save 保存为 Temporary saved；从列表 Submit 进入 In Progress |

**布局（Step 1）**
- 双列 grid：Course Code / Course Name、Offering / Course Owner 等成对排列（见原型图 1）
- Pre-requisite / co-requisite（Choose 按钮）、Synopsis（0/500）、References（0/500）通栏 textarea
- **Credit 输入框宽度与同行下拉框一致**（占满 grid 列宽，不用短输入框）

**Stepper 导航（图 2–3）**
- 三步标题 **可点击** 直接跳转到对应步骤内容
- **仅当前步骤标题标蓝**（圆点与文字）；已完成/未到达步骤均为灰色，不点亮
- 步骤间连线：仅当前步骤之前为蓝色（可选），或全线灰色 — 以「仅当前标题标蓝」为准

**顶栏按钮（Apply 模式）**
```
[← Back]                    [Previous] [Next] [Save]
```
- **Back**：始终二次确认（ConfirmDialog），确认后返回列表
- **取消 Cancel 按钮**；改为 **Save** 置于 Next 右侧
- Save：保存当前进度为 Temporary saved，不强制完成全部步骤（CLO 校验在 Save 时若已在 Step 2+ 则执行）
- Previous / Next：顺序切换步骤；Next 离开 Step 1 时校验 General；离开 Step 2 时校验 CLO ≥1

- **可编辑**：仅 `Temporary saved` 可进入 apply 模式编辑
- **只读**：`In Progress`、`Approved`、`Rejected` 仅 Details；**Rejected 不可编辑、不可重新 Submit**

### 6. Learning Time 与 Total SLT

- 各数字输入使用 stepper（`input type="number"` + 样式）
- `totalSlt` = 各分项之和（F2F Physical 四项 + F2F Online 四项 + NF2F），实时计算展示
- 与原型数字不一致处（如分项和 ≠ Total）以 **计算值** 为准

### 7. 列表搜索

| 主行 | Course Code, Course Name, Offering, Course Classification |
| More | 可扩展 Medium of Instruction、Status、Applicant（首版 More 可为 Status + Applicant） |

对齐 Course Information 搜索布局（左对齐 flex）。

### 8. 工具栏行为

| 按钮 | 行为 |
|------|------|
| Apply New Course | `viewMode = apply`, 空向导 |
| Delete | 批量删除，ConfirmDialog；Approved 不可删 |
| Import | **UI 占位**：点击提示功能尚未开放（与 Sync Cache 同类），不做 xlsx 解析 |
| Export | ExportModal + exportCourseApplicationExcel |
| Submit | 选中 Temporary saved → In Progress，approvalStage = HoD/HoP Review，追加 approvalLog |

### 9. 注册

- `menu.js` → `developedPages.add('course-application')`
- `App.vue` → `CourseApplicationView`

### 10. i18n

- 菜单已有 `menu.courseApplication`
- 新增 Status、Approval Stage、Apply New Course、三步标题、SLT 区块标题等至 `zh-flat.js`

## 风险与应对

| 风险 | 缓解 |
|------|------|
| 向导 + 多个子弹窗，组件体积大 | 按 step/ modal 拆分；共享 `learningTime` 表单片段 |
| Step 1 字段一致性 | 与 Course Information 共用字段定义与校验（`createEmptyCourseForm` / `validateCourseForm`） |
| Teaching Methods 原型表格写 Tutorial，说明文档写 Practical | 以产品说明为准，mock 可保留 Tutorial 作 Others 别名展示 |
| 无后端时 Submit/Approve 为假流转 | approvalLog mock 写入；Status 手动枚举切换演示 |

## 迁移说明

纯前端新增。合并后验证 `course-application` 菜单可访问即可。

## 待定问题

（已全部确认，见 Resolved）

## 已确认

- **Step 1 General Information**（2026-06-02）：字段与 **Course Information 完全一致**（Course Code、Course Name、Offering、Course Owner、Course Classification、Credit、Medium of Instruction、Semester Type）；复用相同校验规则。
- **CLO 必填**（2026-06-02）：至少 **1 条 CLO** 才能从 Step 2 进入 Step 3，且保存/提交时须满足。
- **Rejected 状态**（2026-06-02）：**不允许编辑，不允许重新 Submit**；仅可查看 Details 与 Approval Log。
- **Import**（2026-06-02）：首版 **仅 UI 占位**（按钮 + 提示），不实现 Excel 导入。
- **向导 UI**（2026-06-02）：
  1. Step 1 General Information **内嵌页面可滚动**，双列表单，不用大弹窗。
  2. Stepper **可点击跳转**；**仅当前步骤标题标蓝**。
  3. **Back 始终二次确认**。
  4. 去掉 Cancel；**Save 在 Next 右侧**。
  5. **Credit 输入框宽度与上方下拉框对齐**（同列 100% 宽）。
