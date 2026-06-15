## Context

`add-student-records-app` 已交付 Student Profile **列表壳层**：搜索、分页、Export、Details/Edit/Create/Import 占位。当前 `students.js` 为扁平 9 字段模型，`Student Type` 使用 Local UG 等枚举，与原型（Local / China / International、XMUM2309001、七 Tab 注册表单）不一致。

项目内可参考模式：
- **列表 CRUD**：`LecturerInformationView.vue`（checkbox、Delete、FormModal、DetailModal）
- **Excel 导入**：`courseImportExcel.js` + `CourseApplicationImportModal.vue`
- **日期字段**：`DatePickerEn.vue`

## Goals / Non-Goals

**Goals:**

- 完整 CRUD：Create / Read（Details）/ Update / Delete（行内 + 批量）
- 七 Tab 注册表单 Drawer，对齐原型 New Student Registration
- Import：模板下载 + Excel 解析（列表 + Basic + Enrollment 核心列）
- Export：列表列 + 可选完整档案字段组
- 数据模型嵌套化，列表字段派生；Mock 对齐原型样例

**Non-Goals:**

- 侧边栏 Family Info 等独立菜单
- 后端 API、真实文件存储
- Category 与 Programme 联动
- 全 Tab 80+ 列 Import
- localStorage 持久化（可选，非必须）
- 切换 Category 清空隐藏字段
- Contact / Family / Accommodation 类别差异

## Decisions

### 1. 数据模型 — 嵌套 + 列表投影

```javascript
// src/data/students.js
{
  id: number,
  studentCategory: 'Local' | 'China' | 'International',
  basicInfo: { fullName, chineseName, gender, studentId, applicationNo, icNo, ... },
  photo: { fileName, dataUrl } | null,
  enrollment: { programmeCode, programme, faculty, status, intake, studyMode, ... },
  contact: { mobilePhone, housePhone, email, permanentAddress, mailingAddress },
  education: { qualification, institutionName, ..., remarks },
  family: { name, icPassport, relationship, occupation, ... },
  accommodation: { hostelStatus, campus, roomNo, checkInDate, ... },
  others: { registrationDate, taxRegistrationNo, sponsor, remarks, statusChangeLog },
}
```

`normalizeStudent(raw)` 派生列表列：`studentId`、`name`、`nameCn`、`studentType`（= category）、`gender`、`programmeCode`、`programme`、`intake`、`studentStatus`（= enrollment.status）。

**Student Type 枚举**改为 `Local / China / International`（**BREAKING** 相对当前 Local UG 等）。

### 2. UI 结构 — 宽屏 Drawer + 横向 Tab

| 组件 | 职责 |
|------|------|
| `StudentProfileFormDrawer.vue` | Create/Edit；顶栏 Category 单选 + 7 Tab + Cancel/Save |
| `StudentProfileDetailDrawer.vue` | Details 只读；同 Tab 结构 |
| `StudentProfileImportModal.vue` | 模板下载、选文件、结果反馈 |
| `tabs/BasicInfoTab.vue` … `OthersTab.vue` | 各 Tab 字段；Form 与 Detail 通过 `readOnly` prop 复用 |

Drawer 宽度约 `min(960px, 90vw)`，Basic Info Tab 右侧 Photo Upload 区（FileReader → base64 预览）。

**替代方案**：Lecturer 式纵向 Stepper — rejected，与原型 Tab 布局不符。

### 3. 校验规则

| 范围 | 必填字段（Phase 1） | Phase 2 按 Category |
|------|---------------------|---------------------|
| Basic Info | fullName, studentId, icNo | Local：icNo 必填；China/International：不要求 icNo |
| Contact | mobilePhone, email | 三类相同 |
| Enrollment | programmeCode, programme | 三类相同 |
| Save 时 | 以上全部；Student ID 全局唯一 | 同上 |

Tab 内联错误提示 + Save 失败时跳转首个有错 Tab。

### 4. 列表页增强

对齐 `LecturerInformationView.vue`：

- Toolbar：`+ Create` | `Delete`（disabled 无选中）| `Import` | `Export`
- Table：checkbox 列 + 现有列 + Actions（Details · Edit · Delete）
- Delete：`ConfirmDialog` 确认

### 5. Import / Export

**Import**（`importStudentProfileExcel.js`）：

- 模板 sheet 表头：studentId, fullName, chineseName, studentCategory, gender, programmeCode, programme, intake, status, mobilePhone, email, …（约 25 列）
- 解析 `XLSX.read` + `sheet_to_json`（参考 `courseImportExcel.js`）
- 重复 studentId → 跳过并报告行号
- 成功行 `normalizeStudent` 后 push 到列表

**Export**（扩展 `exportStudentProfileExcel.js`）：

- `studentProfileListExportFields` — 现有 10 列
- `studentProfileFullExportFields` — 扁平化七 Tab 主要字段
- ExportModal 展示两组 field（或合并列表，full 字段默认不勾选）

### 6. Mock 样例

至少 3 条对齐原型：

| Student ID | Name | Type | Programme |
|------------|------|------|-----------|
| XMUM2309001 | Tan Wei Ming | Local | Bachelor of Software Engineering |
| XMUM2309002 | Li Xiu | China | Bachelor of Finance |
| XMUM2309003 | John Doe | International | Bachelor of International Business |

Intake 格式 `YYYY/MM`（如 2023/09）。

### 7. 文件影响

```
src/views/studentRecords/StudentProfileView.vue     — 改
src/data/students.js                                 — 重构
src/utils/exportStudentProfileExcel.js               — 扩展
src/utils/importStudentProfileExcel.js               — 新增
src/components/studentRecords/
  StudentProfileFormDrawer.vue                       — 新增
  StudentProfileDetailDrawer.vue                     — 新增
  StudentProfileImportModal.vue                      — 新增
  tabs/BasicInfoTab.vue … OthersTab.vue              — 新增 ×7
  StudentProfileDetailModal.vue                      — 删除
src/i18n/                                            — 扩展
```

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 七 Tab 字段多，单文件过大 | 拆 7 个 Tab 组件 + 共享 grid CSS |
| 嵌套模型破坏现有列表 | normalizeStudent 保持列表 API 稳定 |
| Import 列与表单字段漂移 | 模板列定义与 export flat 字段共用常量 |
| Photo base64 过大 | 限制文件类型 jpg/png、大小 ≤2MB |

## Migration Plan

1. 重构 `students.js` 与 mock 数据（破坏性：旧枚举值清空 acceptable，无生产数据）
2. 替换 DetailModal → DetailDrawer
3. 列表页接线 Form/Import/Delete
4. 手动冒烟：CRUD 闭环 + Import 样例 + Export 两档
5. **Phase 2**：扩展 basicInfo 字段 → Tab 条件渲染 → 按类别校验 → 更新 Import/Export/Mock → 三类冒烟

## Phase 2 — Category 差异化字段（增量设计）

### 8. 扩展 basicInfo 数据模型

在 Phase 1 嵌套模型上扩展（三类共用同一 `basicInfo` 对象，UI 显隐）：

```javascript
basicInfo: {
  // 共用（已有）
  fullName, chineseName, gender, studentId, applicationNo,
  dateOfBirth, age, nationality, race, religion, maritalStatus, disability,
  // Local
  icNo, stateOfBirth,
  // China + International
  passportNo, passportExpiry, placeOfBirth,
  // China only
  candidateNo, politicalOutlook, identityNoChina,
}
```

### 9. Basic Info 字段矩阵

| 字段 | Local | China | International |
|------|:-----:|:-----:|:-------------:|
| IC No. * | ✓ | | |
| State of Birth | ✓ | | |
| Passport No. / Expiry / Place of Birth | | ✓ | ✓ |
| Candidate No. / Political Outlook / Identity No. (China ID) | | ✓ | |
| Disability | text（保持） | select Yes/No | select Yes/No |

### Phase 3（Enrollment / Education 精调 — 2026-06-12）

- **Recruited By**：三类均为下拉
- **奖学金（方案 B）**：仅 **Local** 显示 Fujian Scholarship Amt；China / International 不显示
- **Qualification**：三类均为下拉
- **Chinese Test**：**Local + International** 显示；**仅 China** 隐藏

### 10. Education / Others / Enrollment 差异

- **Education**：Local / International 显示 Chinese Test 三字段；**仅 China** 隐藏；Qualification 三类均为下拉
- **Others**：Local 含 Tax Registration No；China/International 不含
- **Enrollment**：Recruited By 三类均为下拉；**Fujian Scholarship Amt 仅 Local**（方案 B）
- **Contact / Family / Accommodation**：三类一致

### 11. Tab 实现方式

各 Tab 从 `form.studentCategory` 读取类别，用 `v-if` 或 `studentCategoryFieldConfig` helper 控制显隐。FormDrawer 切换 Category 不 reset 表单。

### 12. Import / Export（Phase 2）

- Import 模板增加 passport/China 列；Local 行 icNo 必填，China/International 不要求
- Export full 列增加 passport / China 身份字段

## Open Questions

（无阻塞项；已按 explore 结论默认：Delete 双模式、Import 25 列、Family Tab 仅在 Profile 内）

## Resolved

- Student Type = Local / China / International（2026-06-12）
- Import 首版覆盖列表 + Basic + Enrollment 核心列（2026-06-12）
- 侧边栏 Family Info 保持建设中（2026-06-12）
- Phase 1 CRUD 壳层已完成（2026-06-12）
- Phase 2 Category 差异化字段纳入本 change 增量（2026-06-12）
- 切换 Category 不清空隐藏字段；Recruited By 三类下拉；Qualification 三类下拉（2026-06-12）
- Enrollment 奖学金方案 B：仅 Local 显示 Fujian Scholarship（2026-06-12）
- Education Chinese Test：Local + International 显示，仅 China 隐藏（2026-06-12）
- Export 弹框对齐 Programme Version 穿梭框 + 三档 exportScope（Phase 4，2026-06-12）

## Phase 4 — Export 弹框对齐 Programme Version

### 13. 参考实现

| 模块 | 文件 | 要点 |
|------|------|------|
| Programme Version | `ProgrammeVersionView.vue` | `openExportModal` 前置无数据校验；`handleExportConfirm` 按 scope 取数 |
| Programme Version | `exportProgrammeVersionExcel.js` | `programmeVersionExportFields` 由 columns 映射，含 `no` |
| 共用组件 | `ExportModal.vue` | 穿梭框 UI、Export Setting 三选项、`hasSelectedRows` toast |

### 14. 字段配置 — 对齐穿梭框默认布局

```javascript
// exportStudentProfileExcel.js（目标结构）

// 列表列：selectedByDefault !== false → 打开弹框时在右侧 Selected Fields
const listFields = studentProfileListExportColumns.map((col) => ({
  key: col.key,
  label: col.header,
  selectedByDefault: true,  // 含 No.
}))

// 扩展列：selectedByDefault: false → 打开弹框时在左侧 Available Fields
const extendedFields = studentProfileFullExportColumns.map((col) => ({
  key: col.key,
  label: col.header,
  selectedByDefault: false,
}))

export const studentProfileExportFields = [...listFields, ...extendedFields]
```

**变更点**：移除 `studentProfileListExportFields` 中对 `no` 的 filter；不再在 View 层硬编码 `['no', ...selectedFields]`。

### 15. StudentProfileView 导出逻辑

与 `ProgrammeVersionView.handleExportConfirm` 保持一致：

```javascript
function handleExportConfirm({ selectedFields, exportScope }) {
  let data = []
  if (exportScope === 'currentPage') data = paginatedStudents.value
  else if (exportScope === 'allResults') data = filteredStudents.value
  else data = filteredStudents.value.filter((item) => selectedIds.value.includes(item.id))

  exportStudentProfilesToExcel(data, filename, selectedFields)
}
```

**ExportModal 接线**（已与 Programme Version 相同，Phase 4 验证即可）：

```vue
<ExportModal
  :visible="exportModalVisible"
  :fields="translatedExportFields"
  :has-selected-rows="hasSelection"
  @close="exportModalVisible = false"
  @confirm="handleExportConfirm"
/>
```

### 16. UI 预期（原型图）

```
┌──────────────── Export ────────────────┐
│ Available Fields    > <   Selected     │
│ (扩展档案列)              (列表列+No.)   │
│                                         │
│ * Export Setting:                       │
│   ○ Export Current Page                 │
│   ○ Export All Results                  │
│   ○ Export Selected Rows                │
│                    [CANCEL] [CONFIRM]   │
└─────────────────────────────────────────┘
```

### 17. 文件影响（Phase 4）

```
src/utils/exportStudentProfileExcel.js     — 改（exportFields 含 no、默认分组）
src/views/studentRecords/StudentProfileView.vue — 改（handleExportConfirm）
```

**Non-Goals（Phase 4）**：不修改 `ExportModal.vue` 通用组件；不改变 Import 流程；不新增导出格式。

## Phase 5 — 学籍异动：流转状态 + 流程日志外置

> Profile CRUD 无改动。本 Phase 文档化四模块公共 UX，与 `add-programme-transfer-app` Phase 3–4 同步。

### 24. 转专业 6 态状态机（Mock 演示）

规则与 mock 矩阵见 **`add-programme-transfer-app/design.md` §21–22**。核心约束：

- Cancel 仅 `In Progress` + `Pending Review`；Cancel 后变 Cancelled，**不删除**记录
- Update Required 可 Edit + Resubmit → 回到 In Progress
- Rejected / Approved / Cancelled 为终态只读 Details

### 25. ApprovalLogModal 外置

```
列表 Actions（每行、各状态）
  Details | Edit | … | [流转日志]  ← 新增，始终可见

点击「流转日志」
  └── ApprovalLogModal（Teleport）
        标题：common.workflowLog
        副标题：applicationId · studentId · name
        表格：Stage | Actor | Action | Date | Comment
        空：common.noData

详情 Modal
  └── 移除 approvalLog section；保留 Section 只读 + Pending 审批区
```

**参考实现**：`src/components/courseApplication/ApprovalLogModal.vue` → `src/components/studentRecords/ApprovalLogModal.vue`

**落地模块**：ProgrammeTransfer、Deferment、Resumption、Withdrawal 各 View + DetailModal 一对。

### 26. 文件影响（Phase 5）

```
新增:
  src/components/studentRecords/ApprovalLogModal.vue

修改:
  src/views/studentRecords/*View.vue（×4）— logVisible/logItem + Actions 按钮
  src/components/studentRecords/*DetailModal.vue（×4）— 移除 log 区块
  src/i18n/locales/en.js, zh.js — common.workflowLog

待办（转专业 Mock，programme-transfer change）:
  src/data/programmeTransfers.js — 6 态 ×2 mock
```
