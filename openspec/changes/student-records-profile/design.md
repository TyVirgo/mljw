# 学籍管理-学生基本信息 — 设计要点（合并）

## 文档用途

汇总历史 design 中与本菜单相关的决策与约束，供写需求文档时对照。冲突处以较新变更及当前代码为准。

## 来源：add-status-log-graduation-withdrawal-remarks

# 设计
## 毕业 Status Log

| 列 | 值 |
|----|-----|
| status | `Graduated` |
| movementCategory | 空（—） |
| remarkTitle | `Graduation` |
| remarkLines | 四行 Label : Value（图示 2） |

批次格式 `YYYYMM`；日期 `dd/mm/yyyy`。毕业模块未建，mock 用 `DEMO_GRADUATION_STATUS_LOG` 常量。

## 退学 Status Log

```
Last Date of Attendance : dd/mm/yyyy
Reason : {resolveReasonLabel(WDR001, reasonId)}
Note : {optional}
```

Implement 时 `movementContext.sourceKey === 'withdrawal'` 调用 builder。

## 学籍状态

`studentStatusOptions` 增加 `Graduated`；`studentProfile.status.graduated` i18n。

## 来源：add-student-pass-expiry-date

# 设计
## 字段

| 属性 | 值 |
|------|-----|
| 存储键 | `basicInfo.studentPassExpiryDate` |
| 格式 | `dd/mm/yyyy`（与 `DatePickerEn` 一致） |
| 可见范围 | China、International |
| 编辑 | 学籍 UI 始终只读；IO 外部维护（mock 预填） |

## 列表与搜索

- `normalizeStudent` 扁平化 `studentPassExpiryDate` 供表格/导出
- 搜索：`studentPassExpiryFrom` / `studentPassExpiryTo`；Inclusive 范围；无日期学生不参与匹配（筛选激活时排除）
- Local 学生列显示 `—`

## 转专业

`buildStudentSnapshotFromProfile` 中 `visaExpiryDate` ← `basic.studentPassExpiryDate`

## 导出

`studentProfileListExportColumns` 与 `formatStudentRow` 增加该字段；默认选中导出。

## 来源：add-student-profile-change-log-tab

## Context

详情 Tab 由 `studentDetailTabs` 驱动，末尾为 `statusLog`。产品确认：先做 **基本信息 + 住宿**；Tab 名 **信息变更记录**。

## Goals / Non-Goals

**Goals:**
- 详情只读新 Tab，字段级 from→to 流水
- mock 数据可演示老师/学生两类变更人

**Non-Goals:**
- 学工接口；本系统编辑写流水；家庭成员增删语义

## Decisions

1. **数据模型**（挂在学生记录上）：

```js
profileChangeLogs: [{
  id,
  changedAt,          // ISO 或可 format 的日期时间
  section: 'basic' | 'accommodation',
  fieldKey,           // 如 'basicInfo.phone' / 'accommodation.roomNo'
  fieldLabelKey,      // i18n 或英文标签键
  oldValue,
  newValue,
  changedBy,          // 展示名
  changedByRole: 'teacher' | 'student',
}]
```

2. **UI**：对齐 `StatusLogTab` 表格样式；时间新→旧排序。

3. **范围**：仅 `basicInfo.*` 与 `accommodation.*`；enrollment / statusLogs 不进此表。

4. **种子**：至少 1–2 名演示学生有若干条 basic + accommodation 变更。

## Risks / Trade-offs

- [Risk] 字段标签与表单不一致 → Mitigation：复用现有字段英文 label / `studentProfileFieldLabels` 若可用
- [Risk] 后续扩展其它 Tab → Mitigation：`section` 枚举可扩，本 change 只渲染 basic/accommodation

## Open Questions

（已关闭：范围=基本信息+住宿；名称=信息变更记录）

## 来源：add-student-profile-crud

## 背景说明

`add-student-records-app` 已交付 学生Profile **列表壳层**：搜索、分页、Export、Details/Edit/Create/Import 占位。当前 `students.js` 为扁平 9 字段模型，`学生Type` 使用 Local UG 等枚举，与原型（Local / China / International、XMUM2309001、七 Tab 注册表单）不一致。

项目内可参考模式：
- **列表 CRUD**：`LecturerInformationView.vue`（checkbox、Delete、FormModal、DetailModal）
- **Excel 导入**：`courseImportExcel.js` + `CourseApplicationImportModal.vue`
- **日期字段**：`DatePickerEn.vue`

## 目标 / 非目标

**目标：**

- 完整 CRUD：Create / Read（Details）/ Update / Delete（行内 + 批量）
- 七 Tab 注册表单 Drawer，对齐原型 New 学生Registration
- Import：模板下载 + Excel 解析（列表 + Basic + Enrollment 核心列）
- Export：列表列 + 可选完整档案字段组
- 数据模型嵌套化，列表字段派生；Mock 对齐原型样例

**非目标：**

- 侧边栏 Family Info 等独立菜单
- 后端 API、真实文件存储
- Category 与 Programme 联动
- 全 Tab 80+ 列 Import
- localStorage 持久化（可选，非必须）
- 切换 Category 清空隐藏字段
- Contact / Family / Accommodation 类别差异

## 设计决策

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
  others: { registrationDate, taxRegistrationNo, sponsor, remarks }, // §15 移除 statusChangeLog → statusLogs[]
}
```

`normalizeStudent(raw)` 派生列表列：`studentId`、`name`、`nameCn`、`studentType`（= category）、`gender`、`programmeCode`、`programme`、`intake`、`studentStatus`（= enrollment.status）。

**学生Type 枚举**改为 `Local / China / International`（**BREAKING** 相对当前 Local UG 等）。

### 2. UI 结构 — 宽屏 Drawer + 横向 Tab

| 组件 | 职责 |
|------|------|
| `StudentProfileFormDrawer.vue` | Create/Edit；顶栏 Category 单选 + 7 Tab + Cancel/Save |
| `StudentProfileDetailDrawer.vue` | Details 只读；同 Tab 结构 |
| `StudentProfileImportModal.vue` | 模板下载、选文件、结果反馈 |
| `tabs/BasicInfoTab.vue` … `OthersTab.vue` | 各 Tab 字段；Form 与 Detail 通过 `readOnly` prop 复用 |

Drawer 宽度约 `min(960px, 90vw)`，Basic Info Tab 右侧 Photo Upload 区（FileReader → base64 预览）。

**替代方案**：Lecturer 式纵向 Stepper — 已否决，与原型 Tab 布局不符。

### 3. 校验规则

| 范围 | 必填字段（Phase 1） | Phase 2 按 Category |
|------|---------------------|---------------------|
| Basic Info | fullName, studentId, icNo 

## 来源：add-student-profile-export-card-button

# 设计

## 布局

```
footer: [导出学籍卡]                    [关闭] [编辑]
         btn-outline (左)              btn-default / btn-primary (右)
```

`margin-right: auto` 将导出按钮推至左侧，右侧按钮组保持右对齐。

## 不改动

- 无 `@click`、无 toast、无 tooltip
- 不新增导出工具函数

## 来源：add-student-profile-preview-login

# 设计
## 流程

```
StudentProfileView [Preview]
    → enterStudentPreview(row)   // mockCurrentStudent.js
    → App navigate sr-movement-application-student
    → StudentMovementApplicationView applicantMode=student
         filterByCurrent学生/ getCurrentStudent
```

## Tooltip

- 文案：`studentProfile.previewAsStudentHint` — 说明以该学生账号登录并跳转到**学籍异动申请（学生端）**
- 实现：`Teleport to="body"` + `position: fixed`，hover/focus 时按按钮 `getBoundingClientRect` 定位在按钮下方
- 原因：`.table-wrap { overflow: auto }` 会裁剪 `position: absolute` 的 tooltip

## 不展示 Preview Banner

- 跳转后**不**在内容区顶部展示预览提示条或「退出预览」
- 管理员通过侧边栏自行导航；mock 当前学生保持为 Preview 所选 studentId，直至再次切换或刷新

## 不改动

- 侧边栏 IA（Preview 期间仍可见管理菜单，Demo 阶段）
- 真实 SSO / 审计日志（后续替换 mock 模块）

## 来源：add-student-profile-track-category-field

## 设计

### 数据
- 存储：`enrollment.trackCategory`（字符串枚举）
- 默认：`Normal`
- 联动：`getTrackCategoriesForProfileStatus(status)` 复用 `movementCategories.studentStatusCategoryMap`，经档案状态别名映射

### UI
```
列表：… | Status | Track Category | Intake | …
表单：Status 下拉 → Track Category 下拉（选项 filtered）
变更状态且当前类型非法 → 重置为允许列表首项
```

### 校验
- 保存时 `trackCategory` 必填且须属于当前 `enrollment.status` 允许集合

### i18n
- 字段标签：`Track Category` → 学籍类型（zh-flat）
- 枚举值：复用 `movementCategory.trackCategory.*`

## 来源：refine-student-pass-expiry-end-date-display

## 展示 vs 搜索

```
studentPassExpiryStartDate ─┐
studentPassExpiryEndDate   ─┼─▶ 展示：formatStudentPassExpiryEndDate → dd/mm/yyyy
                            │
                            └─▶ 搜索：matchesStudentPassExpiryDateRange(endDate) 不变
```

## 异动 snapshot

- 新建/选学生：`resolveMovementVisaExpiryFromStudent` 写入 end date 单值
- 旧数据 `15/09/2024 - 14/09/2029`：`displayMovementVisaExpiry` 解析取 `-` 后段

## 来源：refine-student-profile-enrollment-demo-fields

# 设计
## Programme Structure 命名

```
intake: 2024/09  →  period: 202409
programme: Bachelor of Software Engineering (Honours)
           → shortName: Software Engineering

→ Programme Structure of Software Engineering (202409 Version)
```

- 专业简称：去掉 `Bachelor of / Bachelor in / (Honours)`（沿用 `programmeShortName`）
- 批次：由 `parseIntakeBatch` + `formatIntakeBatch` 得到 YYYYMM
- 培养方案目录无匹配 code 时，回退用 `enrollment.programme` 名称推导简称

## normalize学生回填

```
enrollment.intake 存在
  ├─ registrationTime 空 → syncRegistrationTimeWithIntake
  ├─ expected* 空 → syncEnrollmentDerivedScheduleFields
  └─ programmeStructure 空 + programmeCode → formatEnrollmentProgrammeStructure(code, intake, programme)
```

Outstanding Fee **不在 normalize 中默认**；在 seed `basicInfo.outstandingFee` 逐条填写 N/Y。

## 与 Enrollment 表单一致

`resolveEnrollmentByProgrammeIntakeKey` 写入 programmeStructure 时传入 `item.intake`，与列表规则相同。

## 来源：refine-student-profile-enrollment-programme-first-cascade

# 设计：专业优先级联

## 字段布局（前 4 项）

```
┌─────────────┬─────────────┬─────────────┐
│ 1. 专业 *   │ 2. 专业代码 │ 3. 专业层次 │
│   (select)  │  (derived)  │  (derived)  │
├─────────────┼─────────────┼─────────────┤
│ 4. 学院     │ 5. 专业结构 │ 6. 学制     │
│  (derived)  │  (derived)  │  (derived)  │
└─────────────┴─────────────┴─────────────┘
```

## 数据流

```
用户选择 programmeIntakeKey
        │
        ▼
resolveEnrollmentByProgrammeIntakeKey
        │
        ├── programmeCode
        ├── programme (name)
        ├── programmeLevel
        ├── faculty (school)
        ├── programmeStructure
        └── duration
```

## 选项来源

新增 `getEnrollmentAllProgrammeOptions()`：基于 `getEnrichedIntakes(true)` 返回全部活跃 programme intake，同名专业带 intake 后缀区分。

移除对 `programmeLevel` / `faculty` 的手动 watch 级联；清空专业时同步清空 code、level、faculty、structure、duration。

## 编辑回填

`hydrateCascadeFromStoredEnrollment` 保留：从已有 enrollment 推断 `programmeIntakeKey`，并调用 `applyProgrammeIntakeLinkage` 同步只读字段。

## 字段 Tooltip

| 字段 | Hint Key | 中文说明 |
|------|----------|----------|
| 入学批次 (Intake) | `Enrollment Intake Hint` | 学生如果转专业，Intake会变新专业的intake，但是注册时间不变 |
| 注册时间 | `Enrollment Registration Time Hint` | Registration Time是入学的intake |
| 学期 (Semester) | `Enrollment Semester Hint` | 当前学年学期相对入学intake第几个学期 |

hint 定义在 `studentProfileFieldLabels.js`，经 `StudentFormField` 的 `label-hint` + `tr()` 展示。

## 来源：refine-student-profile-list-search

# 设计
## 字段映射

| UI 标签 | 数据 |
|--------|------|
| 学生Type | `studentCategory`（Local / China / International） |
| Nationality | `basicInfo.nationality` |
| Status（列表/筛选） | Status Log 按 `dateEffective` 最新一条的 `status`；无日志时回退 `enrollment.status` |
| Outstanding Fee | `basicInfo.outstandingFee`（Y/N） |
| Phone（仅模糊搜索） | `contact.mobilePhone` |
| NRIC（模糊搜索） | `basicInfo.icNo` |

## 搜索布局

```
Row 1: [Keyword 宽输入] Programme▼ Intake▼ Status▼  [Search][Reset][More]
Row 2 (collapsed): 学生Type▼ Nationality▼ Registration Time▼ ...
                   Programme Level▼ Programme Structure▼ ...
                   Expected Completion Batch▼ Expected Graduation Batch▼ Outstanding Fee▼
                   学生Pass Expiry From–To
```

`keyword` 对五字段 OR 匹配；其余下拉 且组合。

## 表格列顺序

搜索区出现的字段均须在主表展示（详情已在 Enrollment / Contact / Basic Info Tab）。

Checkbox | No* | 学生ID* | Name* | Chinese Name | IC No. | Mobile Phone | Status | Intake | Programme Code | Nationality | 学生Type | Programme | Programme Level | Programme Structure | Registration Time | Expected Completion Batch | Expected Graduation Batch | Outstanding Fee | Pass Expiry | Gender | Actions*

- IC No.：Local 显示 `icNo`，China/International 显示 `—`
- Mobile Phone：来自 `contact.mobilePhone`

\* 冻结列（Checkbox/No/ID/Name 左 sticky；Actions 右 sticky）

## Programme Level 展示

- 存储层可保留 catalogue `L6-Bachelor` 等或 `Undergraduate`；UI 与筛选统一经 `normalizeConsentProgrammeLevel` 映射为 Foundation / Undergraduate / Postgraduate
- 列表列、搜索下拉、导出均展示归一化后的标签（i18n：`consentForm.programmeLevel.*`）
- 筛选比较使用归一化值，避免 L 码与 Undergraduate 无法匹配

## 最新 Status 算法

```javascript
sort statusLogs by dateEffective desc, then id desc → first.status
fallback: enrollment.status
```

## 不改动

- Basic Info 保留 Application No
- Phone 仍在 Contact Tab，不在 Basic Info 搬迁

## 来源：refine-student-profile-nationality-first

## 背景说明

学籍 **学生Profile** 新建/编辑抽屉（`StudentProfileFormDrawer.vue`）当前在顶栏提供 学生Category radio（Local / China / International），Basic Info Tab 内国籍为普通文本框。各类别字段显隐已实现在 `BasicInfoTab.vue` 等 Tab 组件中，通过 `form.studentCategory` 驱动。

异动模块 `movementApprovalEngine.inferStudentCategory()` 已有国籍→类别推断：`China` → China，`非 Malaysia` → International，否则 Local。学籍表单尚未复用该逻辑。

## 目标 / 非目标

**目标：**

- 国籍优先：用户先选国籍，系统自动带出学生类别（只读）
- 抽屉分区：**国籍信息** + **信息填写**（七 Tab）
- 新建未选国籍时，信息填写区各 Tab 字段为空
- 可搜索国籍下拉，Malaysia / China 置顶，全球国籍列表
- 编辑改国籍导致类别变化时，确认并清理互斥字段
- 详情 Drawer 布局与表单一致

**非目标：**

- Excel 导入列与 nationality/category 一致性校验（后续迭代）
- 后端 codeSet API
- 异动申请表单 UI 改造

## 设计决策

### 1. 国籍 → 类别映射（单一来源）

在 `src/data/students.js` 新增并导出：

```javascript
export function resolveCategoryFromNationality(nationality) {
  if (!nationality) return ''
  if (nationality === 'Malaysia') return 'Local'
  if (nationality === 'China') return 'China'
  return 'International'
}
```

`movementApprovalEngine.inferStudentCategory()` 改为调用此函数（保留 `studentCategory` 显式值优先）。

**理由**：避免学籍与异动两套规则分叉。

### 2. 布局结构

```
StudentProfileFormDrawer
├── drawer-header（标题）
├── drawer-body
│   ├── section: 国籍信息 (.nationality-section)
│   │   ├── SearchableSelect → form.basicInfo.nationality
│   │   └── 只读 学生Category 标签 ← form.studentCategory
│   └── section: 信息填写 (.entry-section)
│       ├── tab-bar（7 tabs，始终可切换）
│       └── tab-content
│           └── v-if="nationalitySelected" → Tab 组件
│           └── v-else → 空态占位
└── drawer-footer
```

**移除**：顶栏 category radio（`.category-row`）。

**详情 Drawer**（`StudentProfileDetailDrawer.vue`）：同样两段式；国籍与类别只读展示。

### 3. 可搜索国籍下拉

新建 `src/components/common/SearchableSelect.vue`：

- Props: `modelValue`, `options`, `placeholder`, `disabled`
- 输入框过滤 options（case-insensitive substring）
- 点击选项写入 value；键盘 Enter 选首项；点击外部关闭
- 样式对齐现有 `select` / form-control

新建 `src/data/nationalityOptions.js`：

- 导出 `nationalityOptions` 数组（ISO 英文国名，~195 项）
- 导出 `getNationalityOptionsForSelect()`：`['Malaysia', 'China', ...restSortedAlphabetically]`
- Malaysia、China 固定前两位，其余不含重复

国籍值存于 `form.basicInfo.nationality`（与现有 mock 一致）。

### 4. 国籍变更与字段清理

在 `StudentProfileFormDrawer` 中 `watch` nationality：

1. 计算 `newCategory = resolveCategoryFromNationality(nationality)`
2. 若 `newCategory !== form.studentCategory` 且已有旧 category（编辑模式或二次修改）：
   - `window.confirm`（i18n 文案）询问是否继续
   - 确认 → 调用 `clearCategorySpecificFields(form, oldCategory)` 清空互斥 basicInfo 字段，写入新 category
   - 取消 → 回滚 nationality 至上一值
3. 若新建首次选择 → 直接写入 category，无需确认

## 来源：refine-student-profile-split-keyword-search

# 设计

## 搜索表单字段

| searchForm 键 | 数据字段 |
|--------------|---------|
| `studentId` | `item.studentId` |
| `studentName` | `item.name` |
| `chineseName` | `item.nameCn` |
| `icNo` | `item.icNo` / `basicInfo.icNo` |
| `mobilePhone` | `item.mobilePhone` / `contact.mobilePhone` |

## 筛选语义

```javascript
// 空值跳过；非空则 includes 模糊匹配；全部通过才保留
matchFuzzyField(value, keyword) // 对齐 movementApprovalQueue.matchText
```

多文本框与下拉筛选仍为 AND。

## 布局

```
第一行：[学号][学生姓名][中文名][身份证号][手机号]
       [专业][入学批次][学籍状态]                    [查询][重置][更多]
```

`flex-wrap` 自然换行；移除 `.search-item-keyword` 宽输入样式。

## 不改动

- 折叠高级筛选、表格列、导出、下拉筛选逻辑
- `keywordLabel` / `keywordPlaceholder` i18n 可保留（不再引用）

## 来源：remove-taiwan-from-demo-nationality

# 设计
## 国籍选项

`WORLD_NATIONALITIES` 删除 `Taiwan`；`getNationalityOptionsForSelect()` 自动生效。

## Mock 学生替换

| 字段 | 原值 | 新值 |
|------|------|------|
| nationality | Taiwan | Singapore |
| placeOfBirth | Taipei | Singapore |
| permanentAddress | …Taipei…Taiwan | 88 Orchard Road, Singapore 238874 |
| institutionName | Taipei International School | Singapore International School |
| institutionLocation | Taipei, Taiwan | Singapore |
| sourceOfRecruit | Education Agent TW | Education Agent SG |
| family phone/email/income/address | +886 / .tw / TWD | +65 / .sg / SGD |

学生类别保持 `International`（Singapore 非 Malaysia/China）。

## 来源：unify-student-profile-field-labels

# 设计
## 字段注册表

`studentProfileFieldDefs[fieldId] = { label, hint? }`

- `label`：英文 key，经 `tr()` 翻译（zh-flat / en 原文）
- `hint`：可选，详情与**表头**共用；搜索不使用

## 三处用法

| 位置 | API |
|------|-----|
| 表头 | `StudentProfileTableHeaderLabel` + Teleport tooltip |
| 搜索 | `fieldSearchLabel(id)` → 中文 `{label}：`，英文 `{label}:` |
| 详情 | `StudentFormField :label="labelKey(id)" :label-hint="hintKey(id)"` |

## Tooltip

表头 `?` hover 使用 `Teleport + fixed`（避免 `.table-wrap` 裁剪），文案与详情 `labelHint` 相同。

## Programme Level

zh-flat 中 `Programme Level` / `Programme Level:` 统一为「专业层次」。
