## Why

Student Profile 列表页已在 `add-student-records-app` 中落地，但 Create / Edit / Import 仍为占位，Details 仅展示 9 个列表字段，缺少原型要求的 **New Student Registration** 七 Tab 表单与完整增删改查、导入导出能力，无法支撑学籍档案业务演示。

**增量背景（Phase 2）**：Phase 1 已交付 CRUD 壳层与七 Tab 表单，但三类 Student Category 共用 Local 字段布局，与 StudentSys 原型不符。需在已有实现上补齐 **Local / China / International 差异化字段**（Basic Info 护照/身份证、Education 语言能力、Others 税务登记等）。

## What Changes

### Phase 1（已完成）

- 扩展 **Student Profile** 为完整 CRUD 模块，对齐 StudentSys 原型
- **列表页增强**：复选框批量选择、Delete（行内 + 批量）、Student Type 枚举改为 `Local / China / International`；Mock 样例对齐原型（如 XMUM2309001、Tan Wei Ming、2023/09）
- 新增 **New Student Registration** 宽屏 Drawer/Modal：
  - 顶栏 **Student Category** 单选（Local / China / International）
  - 七 Tab：**Basic Info → Enrollment → Contact → Education → Family → Accommodation → Others**
  - Create / Edit 共用；必填校验（Basic Info、Contact 带 * 字段及 Enrollment 核心字段）
  - Basic Info 含 Photo Upload（首版 base64 本地预览，无后端上传）
- 新增 **Details** 只读 Drawer：与表单同 Tab 结构，展示全部字段
- 新增 **Import**：模板下载 + Excel 上传解析入库（首版覆盖列表列 + Basic + Enrollment 核心字段，约 25 列）
- 扩展 **Export**：保留列表列导出；ExportModal 增加「完整档案」可选字段组（扁平化七 Tab 主要字段）
- 重构 `students.js` 数据模型为嵌套结构（basicInfo / enrollment / contact / …），列表字段由 `normalizeStudent` 派生
- 替换现有 `StudentProfileDetailModal.vue` 为 Tab 化 Detail Drawer

### Phase 2（增量 — Category 差异化字段）

- **Basic Info Tab 按类别显隐**
  - **Local**：IC No.、State of Birth（保持）
  - **China / International**：Passport No.、Passport Expiry、Place of Birth；隐藏 IC No. / State of Birth
  - **China 专属**：Candidate No.、Political Outlook、Identity No. (China ID)
  - **China / International**：Disability 改为 Yes/No 下拉
- **Education Tab**：China/International 隐藏 Chinese Test 三字段；Qualification 改为下拉
- **Others Tab**：China/International 隐藏 Tax Registration No
- **Enrollment Tab**：China/International 的 Recruited By 改为下拉；Fujian Scholarship Amt 仅 China 显示
- **Contact / Family / Accommodation**：三类与 Local 一致
- **数据模型扩展** `basicInfo`：passportNo、passportExpiry、placeOfBirth、candidateNo、politicalOutlook、identityNoChina
- **校验按类别分支**：Local 必填 icNo；China/International 不要求 icNo
- **Mock / Import / Export** 同步更新

### Phase 3（已完成 — Enrollment / Education 精调）

- Recruited By / Qualification 三类下拉；Fujian Scholarship 仅 Local；Chinese Test Local+International 显示

### Phase 4（增量 — Export 弹框对齐 Programme Version）

- 将 Student Profile **Export** 弹框 UI 与交互对齐 **Programme Version** 模块（共用 `ExportModal.vue` 穿梭框样式，见原型图）
- **Available Fields / Selected Fields** 双栏 + 中间移动按钮；底部 **Export Setting** 三选一：Export Current Page / Export All Results / Export Selected Rows
- 导出字段定义与默认选中策略对齐 `ProgrammeVersionView` + `exportProgrammeVersionExcel.js` 模式：
  - **列表列（含 No.）** 默认在 Selected Fields（右侧）
  - **扩展档案列** 默认在 Available Fields（左侧），用户可穿梭至 Selected
- `handleExportConfirm` 逻辑与 Programme Version 一致：按 `exportScope` 取数，按用户所选 `selectedFields` 导出（移除硬编码 `['no', ...selectedFields]`）
- 保留现有扩展字段集与 Excel 扁平化逻辑，仅调整弹框体验与字段分组

### Phase 5（增量 — 学籍异动申请：流转状态演示 + 流程日志外置）

> **范围说明**：本 Phase 不修改 Student Profile 档案 CRUD 本身，而是记录学籍应用内 **异动申请模块**（转专业 / 休学 / 复学 / 退学）的公共 UX 增强，与 `add-programme-transfer-app` Phase 3–4 及已实现代码对齐。

#### 5.1 转专业流转状态机（6 态，每态 ≥2 条 Mock）

| 状态 | 含义 | 列表允许操作 |
|------|------|--------------|
| **Draft** | 学生提交前 | Edit、Delete、Save Draft、Submit |
| **In Progress** | 提交后审批未完成 | Details；`Pending Review` 可 **Cancel**；审批已开始不可 Cancel |
| **Cancelled** | 审批开始前学生撤销 | Details 只读；不删记录 |
| **Update Required** | 审批打回修改 | Edit、Resubmit |
| **Rejected** | 任意节点不通过，流程终止 | Details 只读 |
| **Approved** | 终审通过 | Details 只读，归档 |

- `initialProgrammeTransfers` 上述 6 态各 **≥2 条** mock（In Progress 须含 Pending Review 可 Cancel + 审批中不可 Cancel 各至少 1 条）
- 详细 mock 矩阵与 helper 规则见 **`add-programme-transfer-app`** Phase 3

#### 5.2 流程日志（Approval Log）从详情外置

- **详情 Modal** 不再内嵌 `approvalLog` 列表；仅保留 Section 只读 + 内嵌审批区（Pending 时）
- **列表 Actions** 每行、**各状态均显示**「流转日志」按钮（`common.workflowLog` / 流转日志）
- 点击打开独立 **`ApprovalLogModal.vue`**（表格：Stage / Actor / Action / Date / Comment；副标题：申请编号 · 学号 · 姓名；无 log 显示暂无数据）
- **首版落地模块**：Programme Transfer、Deferment、Resumption、Withdrawal（四模块统一组件与交互）

### Non-goals（本变更不包含）

- 侧边栏 **Family Info** 等其余 5 项菜单的业务实现（Family 仅在 Profile 表单内作为 Tab）
- 后端 API 对接、真实文件存储、权限控制
- Category 与 Programme 联动、字段级权限
- Import 全 Tab 80+ 列一次性扁平导入（留作后续增强）
- Age 自动计算、Status Change Log 自动写入（Age 可手动填；Log 为文本域）
- 切换 Category 时自动清空已填隐藏字段（首版保留数据，仅 UI 隐藏）
- Contact / Family / Accommodation 的类别差异（除非后续原型补充）

## Capabilities

### New Capabilities

（无——本变更扩展已有 capability）

### Modified Capabilities

- `student-profile`: Phase 1–3 已完成；**Phase 4 扩展 Export 弹框**；**§13 详情层级 + mock 丰富度**；**§14 Enrollment 五字段主数据下拉（独立、列表/编辑一致）**
- `student-records-app`（Phase 5 关联）: 异动申请列表统一增加「流转日志」外置弹窗；转专业 6 态 mock 演示（见 `add-programme-transfer-app` Phase 3）

## Impact

- **Phase 1 已修改/新增**（见 git 历史）
- **Phase 2 修改文件**
  - `src/data/students.js` — 扩展 basicInfo、类别配置、按类别校验、mock 样例、下拉选项
  - `src/components/studentRecords/tabs/BasicInfoTab.vue` — 条件渲染
  - `src/components/studentRecords/tabs/EducationTab.vue` — 条件渲染 + Qualification 下拉
  - `src/components/studentRecords/tabs/OthersTab.vue` — Tax Registration No 条件显隐
  - `src/components/studentRecords/tabs/EnrollmentTab.vue` — Recruited By 下拉、Fujian Scholarship 仅 China
  - `src/utils/importStudentProfileExcel.js` — 按类别校验与模板列
  - `src/utils/exportStudentProfileExcel.js` — 新字段导出列
  - `src/i18n/locales/zh.js`、`en.js`、`zh-flat.js` — 新字段标签与校验文案
- **Phase 4 修改文件**
  - `src/utils/exportStudentProfileExcel.js` — 统一 `studentProfileExportFields` 定义（含 No.，列表/扩展 `selectedByDefault`）
  - `src/views/studentRecords/StudentProfileView.vue` — Export 打开/确认逻辑对齐 `ProgrammeVersionView.vue`
- **§14 修改文件**（Enrollment 主数据下拉，待实现）
  - **新增** `src/data/studentEnrollmentOptions.js`
  - **修改** `tabs/EnrollmentTab.vue`、`src/data/students.js`（mock 对齐）
- **Phase 5 修改/新增文件**（异动申请，非 Profile 本体）
  - **新增** `src/components/studentRecords/ApprovalLogModal.vue` — 流转日志弹窗（复用 Course Application 表格样式）
  - **修改** `ProgrammeTransferView.vue`、`DefermentView.vue`、`ResumptionView.vue`、`WithdrawalView.vue` — Actions 增加流转日志；接入 ApprovalLogModal
  - **修改** `ProgrammeTransferDetailModal.vue`、`DefermentDetailModal.vue`、`ResumptionDetailModal.vue`、`WithdrawalDetailModal.vue` — 移除内嵌 approvalLog
  - **修改** `src/i18n/locales/en.js`、`zh.js` — `common.workflowLog`
  - **待办（转专业 Mock）** `src/data/programmeTransfers.js` — 6 态各 2 条（见 `add-programme-transfer-app` tasks §9）
- **复用**
  - `src/components/common/ExportModal.vue`（不修改组件，仅 Student Profile 侧接线与字段配置）
  - `ProgrammeVersionView.vue` + `exportProgrammeVersionExcel.js` 作为参考实现

---

## §13 详情只读层级与 Mock 丰富度（2026-06）

产品反馈：学生档案 **Details 抽屉** 七 Tab 中字段名与字段值视觉对比不足；三条 showcase mock 空字段（`—`）过多，演示效果差。

### 详情 Typography

- 在 `StudentFormField.vue` readOnly 分支统一：**label** 12px / `#6B7280` / 400；**value** 15px / `#111827` / 500
- 空值 `—` 弱化：13px / `#9CA3AF` / italic
- `StudentProfileDetailDrawer` 顶栏「学生类别」label/value 对齐同一层级
- **编辑表单**（readOnly=false）样式不变

### Mock 补全

- 丰富 `initialStudents` 三条（XMUM2309001 Local / 9002 China / 9003 International）
- 各 Tab 约 75–85% 字段有具体值；每 Tab 保留 1–2 个 intentional 空项（如 Fax、House Phone）
- 日期与 `DatePickerEn` 展示一致（`dd.MM.yyyy`）

### Capabilities（§13）

- `student-profile`: 详情可读性 + showcase mock 数据质量

### Impact（§13）

- `StudentFormField.vue`、`StudentProfileDetailDrawer.vue`
- `src/data/students.js` — `initialStudents` 分段补全

---

## §14 Enrollment Tab 学籍字段主数据下拉（2026-06）

产品反馈：新增/编辑学生 **学籍信息 Tab** 中，专业代码、专业、学院、入学批次、学年学期不应手填，应从 **基础数据模块** 已有数据集下拉选取；列表行、详情与编辑表单须显示同一套存库值。

### 范围

- **五字段改下拉**（Create/Edit 的 `EnrollmentTab.vue`）：Programme Code、Programme、Faculty、Intake (YYYY/MM)、Academic Session
- **数据源**（只读引用，不新建后端）：
  - 专业代码 / 专业名称 → `programmeIntakes.js` → `programmeCatalogue`（来自 `programmeVersions.js`）
  - 学院 → `programmeIntakeSchools`
  - 入学批次 → `intakeSets.js` → `getActiveIntakeOptions()`
  - 学年学期 → `semesterInfo.js` → `startingSemesterOptions`
- **先不关联**：五个下拉 **独立选择**，不做级联、不做 Programme Intake 组合校验（与 Non-goals「Category 与 Programme 联动」一致，本 Phase 亦不做专业↔学院↔批次联动）
- **数据对应**：列表列（`normalizeStudent` 派生）、Details 只读、Edit 表单 **共用** `enrollment.*`；下拉 `option value` 必须与存库字符串 **精确匹配**，编辑时须能正确选中
- **Mock 对齐**：修正 `initialStudents` 三条 showcase 的 enrollment 值，使其落在上述 option 集合内（如 SWE 用 catalogue 全名 `(Honours)`、IBU 非 IB、intake 用 intakeSets 已有批次等）

### Non-goals（§14）

- Programme Intake 一条记录定全部、字段级联自动带出
- Import Excel 强制校验主数据选项（Import 仍可为自由文本，后续增强）
- 扩展 `programmeCatalogue` 新增 FIN 等业务外专业（优先改 mock 选用已有 catalogue 项）

### Capabilities（§14）

- `student-profile`: Enrollment Tab 主数据下拉 + 列表/详情/编辑数据一致

### Impact（§14）

- **新增** `src/data/studentEnrollmentOptions.js`（建议）— 聚合五类 option 导出，供 Tab 消费
- **修改** `src/components/studentRecords/tabs/EnrollmentTab.vue` — 五处 input → select
- **修改** `src/data/students.js` — showcase mock enrollment 对齐主数据 canonical 值
- **可选** `importStudentProfileExcel.js` — 文档注明 programmeCode/intake 建议与主数据一致（不强制）

