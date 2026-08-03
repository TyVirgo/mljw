# 基础数据-教师与评教设置 — 设计要点（合并）

## 文档用途

汇总历史 design 中与本菜单相关的决策与约束，供写需求文档时对照。冲突处以较新变更及当前代码为准。

## 来源：add-evaluation-settings

## 背景说明

项目为 Vue 3 + Vite 单页应用。Lecturer Info 下已有 **Lecturer Information**（列表 + CRUD，`requiresEvaluation` 字段与筛选开关已实现），**Evaluation Settings** 菜单项与 i18n 已存在但未注册到 `developedPages`。

静态设计（图 1）为**单页配置表单**，非列表页：顶部蓝色信息条 + 两个配置区块 + 底部 Save。Category 下拉选项与 `lecturers.js` 中 `categoryOptions` 一致（Full-time Lecturer、China Seconded Lecturer、学生Teaching Assistant、Part-time Lecturer）。

## 目标 / 非目标

**目标：**

- UI 与中英文原型对齐：字段、布局、按钮文案、Toggle 位置
- 支持 New Lecturer 全局开关与多条 Category Change 规则（from / to / delete / enabled）
- Save 持久化配置；可选轻量 mock 演示效果（不过度实现规则引擎）
- 完整 i18n（`tr()` / labelKey），与 University Info 等配置页一致

**非目标：**

- 搜索、分页、导出
- 后端 API、人事系统实时事件订阅
- Senate Unit Members Management 菜单
- 规则变更历史/审计日志
- 在 Evaluation Settings 页直接展示教师列表

## 设计决策

### 1. 页面结构 — 对齐 University Info 配置页

```
EvaluationSettingsView.vue
├── page-card
│   ├── info-banner（全局提示）
│   ├── section: New Lecturer（标题 + 描述 + 右侧 Toggle）
│   ├── section: Change in Lecturer Category
│   │   └── rule-row × N（from select + to select + 文案 + Delete + Toggle）
│   ├── btn + Create
│   └── footer: Save（右对齐）
```

**理由**：与现有 Basic Data 配置页（白卡片、section 分隔）一致，无 table/search 模板。

### 2. 数据模型

```javascript
// evaluationSettings.js
{
  newLecturerEvaluationEnabled: boolean,  // 全局新入职评估开关
  categoryChangeRules: [
    {
      id: string,
      fromCategory: string,   // categoryOptions 之一或 ''
      toCategory: string,
      enabled: boolean,
    },
  ],
}
```

默认 mock（对齐原型）：

| from | to | enabled |
|------|-----|---------|
| Part-time Lecturer | Full-time Lecturer | true |
| 学生Teaching Assistant | Full-time Lecturer | true |

持久化：`localStorage` key `evaluation-settings-v1`；load 时 merge 默认值。

### 3. Toggle 组件

原型为**蓝色 ON/OFF 滑块**（非 Y/N 字母）。优先复用 `YnSwitch` 的视觉尺寸，或新增轻量 `EnableSwitch.vue`（纯蓝底滑块、无 Y/N）以贴近设计图。

New Lecturer 与每条 category rule 各一个 Toggle，右对齐于行尾。

### 4. 规则行交互

- **+ Create**：`push` 新规则 `{ id, fromCategory: '', toCategory: '', enabled: true }`
- **Delete**：点击后弹出 `ConfirmDialog` 二次确认，确认后移除该行；允许规则列表为空
- **Save 校验**（轻量）：
  - enabled 的规则须 from ≠ to 且两者均已选择
  - 不允许重复 (from, to) 组合

### 5. 规则应用（mock，轻量演示）

**产品确认**：首版以**页面呈现效果**为主，不实现复杂规则引擎。

保存时可选调用轻量 `applyEvaluationRules(lecturers, settings)`，仅做简单演示：

1. **新入职**（产品定义）：**有入职时间**（`dateOfJoining` 有值）**且没有任何授课记录**  
   - mock 字段：`hasTeachingRecord: false`（或等价布尔字段）；**不**仅用 `Currently Teaching: No` 代替「无授课记录」
   - 当 `newLecturerEvaluationEnabled` 为 true 时，满足上述条件的 lecturer 可标为 `requiresEvaluation: true`
2. **类型变更**：对 mock 中已有 `previousCategory` 且匹配 enabled 规则 from→to 的教师

## 来源：add-lecturer-information

## 背景说明

项目为 Vue 3 + Vite 单页应用，已有多个 Basic Data 管理页（Department Info、Classroom Info 等）作为成熟模式：本地 mock 数据（`src/data/*.js`）、View 负责列表/搜索/分页/CRUD、Modal 负责表单与详情、公共组件（`ConfirmDialog`、`ExportModal`、`TablePagination`、`DatePickerEn`）复用。

Lecturer Information 是 Lecturer Info 子菜单的第一项（`lecturer-information`），目前未在 `developedPages` 中注册。原型要求比 Department 更复杂：四步 Create/Edit 向导 + 四步 Details，含嵌套子实体（学历、工作经历）和 CPD 年度分组表格。

## 目标 / 非目标

**目标：**
- 实现与原型图 1–8 一致的 UI 结构与交互流程
- 复用现有页面架构，保持代码风格一致
- 提供完整 mock 数据，支持列表 CRUD、搜索、导出、详情浏览
- 四步向导在 Create/Edit 与 Details 间共享步骤定义与字段映射

**非目标：**
- 后端 API 对接（人事系统、EMS、教师个人端 CPD 审批）
- Sync Cache / Refers to EMS system 的真实业务逻辑
- Evaluation Settings 等其他 Lecturer Info 子菜单
- **Senate Unit Members Management** 子菜单（原型 sidebar 曾出现，已确认不纳入本项目）
- CPD 在 Create/Edit 流程中的手动录入（仅 Details 只读展示 mock）

## 设计决策

### 1. 文件结构 — 对齐 Department / Classroom 模式

```
src/
├── data/lecturers.js              # mock 数据、选项枚举、normalize、ID 生成
├── utils/exportLecturerExcel.js   # 导出字段定义与 xlsx 生成
├── views/LecturerInformationView.vue
└── components/lecturer/
    ├── LecturerFormModal.vue      # 四步 Create/Edit 向导
    ├── LecturerDetailModal.vue    # 四步 Details
    ├── QualificationSection.vue   # Step 2 学历卡片（可选拆分）
    └── WorkingExperienceSection.vue
```

**理由**：与 `department/`、`classroom/` 目录结构一致，便于维护。

### 2. 数据模型 — 单条 lecturer 聚合嵌套实体

```javascript
{
  id, staffId, name, gender, category, department,
  academicQualificationHighest, title, academicPosition,
  degree, employmentStatus, dateOfJoining,
  requiresEvaluation: boolean,
  personal: { dateOfBirth, nationality, mobilePhone, personalEmail, researchFocusAreas },
  employment: { foundationUndergraduatePostgraduate, officeExtension, xmumEmail, currentlyTeaching },
  attachment: { fileName, size, uploadedAt } | null,
  remarks: string,
  qualifications: [{ id, name, institution, country, year, remarks, attachments[] }],
  workingExperiences: [{ id, academicPosition, employer, startDate, endDate, educationYears, industryYears }],
  cpdByYear: [{ year, activityCount, hoursEarned, activities: [...] }]
}
```

**理由**：列表字段扁平化便于表格渲染；详情/表单字段分组与原型步骤对应。

### 3. 四步向导 — 参考 ProgrammeVersionCreateModal

- 使用 `currentStep` + `steps` 数组控制步骤条
- Step 1 单页表单（Personal + Employment + Others 三个 section，蓝色竖条标题）
- Step 2/3 卡片列表：已保存卡片只读 + 编辑/删除；新卡片内联编辑 + Save
- Step 4 Create 显示 CPD 说明占位；Edit 同样只读
- 底部按钮：Cancel / Previous / Next（末步 Confirm）

**替代方案**：4 个独立 Modal —  rejected，原型明确为单弹窗多步。

### 4. 搜索区 — 两行 + More 第三行

| 行 | 字段 |
|----|------|
| 主行 | Staff ID,
