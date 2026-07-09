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
| 主行 | Staff ID, Name, Department (select), Category (select), Search/Reset/More |
| More 行 | Title, Academic Position, Degree, Employment Status |
| 第三行 | Evaluation filter toggle（独立一行，与原型一致） |

Department 下拉选项复用 `departments.js` 中的部门名称。

### 5. 列表最高学历 — 计算字段

`academicQualificationHighest` 在列表中展示；保存时从 qualifications 数组推导或使用 Step 1 Degree 字段。Mock 数据中两者保持一致。

### 6. CPD — mock only，按年分组

`cpdByYear` 数组驱动 Step 4 Details 的可折叠年度面板 + 表格。Create/Edit 不提供 CPD 编辑，符合「数据来源：人事对接 + 教师端审批」的业务约束。

### 7. 注册与路由

- `menu.js` → `developedPages.add('lecturer-information')`
- `App.vue` → import + `isLecturerInformation` computed + template branch

### 8. 菜单范围 — 不含 Senate Unit Members

Lecturer Info 子菜单保持现有两项：`Lecturer Information`、`Evaluation Settings`。不新增 Senate Unit Members Management。

**理由**：产品确认不需要该菜单；避免 scope 蔓延。

## 风险与应对

| 风险 | 缓解 |
|------|------|
| 四步向导组件体积大（类似 ProgrammeVersionCreateModal 2000+ 行） | 拆分 Step 2/3 为子组件；共享 section 样式 |
| 附件上传仅为前端 mock（无真实文件存储） | 保存 fileName/size/uploadedAt 元数据；详情展示下载占位 |
| CPD 无后端时数据静态 | mock 2 个年度样本；Sync Cache 按钮提示未连接 |
| 表单字段多，校验复杂 | Step 1 必填校验阻止 Next；Step 2/3 允许空列表但已开编辑卡片须 Save 或 Cancel |

## 迁移说明

纯前端新增，无数据库迁移。部署步骤：
1. 合并代码
2. 验证 `lecturer-information` 菜单可访问
3. 无 rollback 风险（不影响已有页面）

## 待定问题

1. **Batch Delete** 按钮颜色：原型为黑色按钮，是否沿用 `btn-default` 或新增 `btn-dark`？
2. **Date of Joining** 格式：列表用 `MM.DD.YYYY`，是否与现有 `DatePickerEn` 输出格式统一？

## 已确认

- **Senate Unit Members Management**：不新增该子菜单（2025-06-02 确认）
