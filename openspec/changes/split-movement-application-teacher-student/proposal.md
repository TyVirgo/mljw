## 背景与动机

当前「学籍异动申请」（`sr-movement-application`）面向教务老师代学生发起异动，Section I 使用「查询 + 全量下拉」选学生，学生量大时不可用。产品需要 **老师端与学生端双入口**：老师继续代申请并升级为可搜索分页的 **学生选择器**；学生本人从学籍模块自助申请，**学号/姓名等自动填充且不可选他人**。

首版双入口（`split-movement-application-teacher-student`）已实现菜单拆分、StudentSelectModal、学生端本人列表与 Section I 自动填充。产品进一步要求 **四异动申请列表** 对齐查询/维护的检索能力，并区分老师/学生在 **搜索字段与表格列** 上的展示差异。

## 变更内容

### 菜单与导航（已实现）

- 「学籍异动申请（老师）」+「学籍异动申请（学生）」同级菜单
- pageId：`sr-movement-application-teacher` / `sr-movement-application-student`
- 壳层 `applicantMode` 透传四 Tab

### 老师端 / 学生端表单（已实现）

- 老师：StudentSelectModal；学生：Section I 自动填充只读
- 草稿编辑：身份锁定，业务字段与新增一致

### 申请列表 — 增强搜索（本阶段新增）

四异动（转专业 / 休学 / 复学 / 退学）× 老师/学生入口，统一增加过滤项：

| 过滤项 | 说明 |
|--------|------|
| 专业代码 | 按 **当前专业代码** 模糊匹配（`extractCurrentProgrammeCode`） |
| 申请学年学期 | 按 `applicationSession` 回退链模糊匹配 |
| 审批状态 | 下拉精确匹配，**含 Draft**（与查询页不同） |
| 是否实施 | 全部 / 待实施 / 已实施 / — |

**搜索区布局**：两行 + 可收起（对齐 `MovementQueryView` + `list-page-search.css`）

- **首行（老师）**：学号或姓名、专业代码、申请学年学期、审批状态 + 查询/重置/收起
- **首行（学生）**：**隐藏**学号或姓名；其余三字段 + 操作按钮
- **次行（可收起，默认展开）**：是否实施

共享 `movementApplicationSearch.js` 负责 filter 逻辑，复用 `movementApprovalQueue` / `movementMaintenanceFields` 的 extract 函数。

### 转专业 — 去掉进行中 / 已归档 Tab（本阶段新增）

- 移除 `ProgrammeTransferView` 的「进行中 / 已归档」分段 Tab
- **默认展示全部申请**（含 Approved、Rejected、Cancelled、Expired 等终态）
- 用户通过 **审批状态** 下拉筛选终态记录

### 申请列表 — 表格列（本阶段新增）

| portal | 学号 / 姓名列 |
|--------|---------------|
| 老师 | **保留** |
| 学生 | **隐藏**（列表已限定本人，无需重复展示） |

四异动类型一致；空态 `colspan` 随 portal 动态计算。

### 表单 Section I — 学号/姓名分框（本阶段新增）

四异动 FormModal（老师新增 / 学生新增 / 草稿编辑）统一：

| 项 | 规则 |
|----|------|
| 学号框 | 仅显示 `studentId`，**不得**拼接姓名（移除 `selectedStudentDisplay`） |
| 姓名框 | 独立字段 `fullName`，选择学生或学生端自动填充后联动 |
| 布局 | **同一行**：学号 \| 姓名 两列；老师端「选择」按钮位于**该行最末**（不在学号与姓名中间） |
| 一致性 | 转专业 / 休学 / 复学 / 退学四 modal 布局对齐 |

### 表单 Section I — 申请学年学期（§14 已实现；§16 修订数据源）

四异动 FormModal（老师/学生新增、草稿编辑）Section I **末尾**只读字段：

| 项 | 规则 |
|----|------|
| 字段 | `applicationSession`（申请学年学期） |
| 位置 | Section I **最后一个字段** |
| 来源（§16） | **选学生后**写入 `student.enrollment.intake`；create 打开时为空 |
| 来源（§14 已废弃） | ~~系统当前学期 `getCurrentApplicationSession()`~~ |
| 格式 | `YYYY/MM`（如 `2023/09`） |
| 持久化 | save/submit 写入 store；Draft 编辑保留原值 |

### 表单 — 只读字段置灰（本阶段新增）

所有由学籍快照带出的 **readonly** 字段统一增强视觉，与可编辑字段形成对比：

- **范围**：Section I 全部只读项 + 各类型带出快照（如转专业 Section II 的 Current Programme / Intake / School；休学/退学/复学的 programme、intake 等只读项；申请日期等系统带出只读项）
- **不含**：Section II–IV 中用户需填写的 select / input / textarea / checkbox / 附件上传

### 转专业 — 移除模拟过期（本阶段新增）

- 移除 `ProgrammeTransferView` 列表「模拟过期」操作按钮及相关 handler
- 删除 `programmeTransfers.js` 中 `expireApplication` 函数及 View 层引用
- 清理关联 i18n（`simulateExpire`、`expireOne`）；**保留** `isTransferExpired` 等与自动期限校验相关的逻辑（若存在）

## 能力范围

### 新增能力

- `student-select-modal`: 老师端学生选择弹窗（已实现）
- `movement-application-list-filters`: 四异动列表增强搜索、转专业去 Tab、学生端列/搜索差异

### 修改的能力

- `movement-application-shell`: 双 portal 入口（已实现）
- `movement-application-applicant-mode`: Section I / 列表范围（已实现）+ 列表搜索与列展示 delta
- `student-records-app`: 菜单拆分（已实现）

## 影响范围

- **新增**
  - `src/data/movementApplicationSearch.js`
  - 可选 `MovementApplicationSearchBar.vue`（减少四 View 模板重复）
- **修改**
  - 四个 `*View.vue` — 搜索 UI、`filtered*` 逻辑、学生端列 `v-if`
  - `ProgrammeTransferView.vue` — 额外移除 active/archived Tab；**移除模拟过期操作**
  - 四个 `*FormModal.vue` — 学号/姓名分框、选择按钮行末、Section I 申请学年学期、只读置灰样式
  - 四个 `*DetailModal.vue` — Section I 末尾展示申请学年学期
  - 四异动 `*.js` data — `createEmpty*`、`prepareDraftPayload` 写入 `applicationSession`
  - 新增 `getCurrentApplicationSession()`（`semesterInfo.js` 或共享 helper）
  - `i18n` — 统一 label「申请学年学期」；清理 expire mock key
- **复用**
  - `extractApplicationSession`、`extractCurrentProgrammeCode`、`normalizeQueueItem` 推导逻辑
  - `MovementQueryView` 双行搜索 + 收起交互
  - `list-page-search.css`
- **非目标**
  - 修改 movementStore 结构
  - 转专业按新专业代码过滤
  - 修改审批引擎、维护实施逻辑、统计模块
  - 将 `applicationSession` 与转专业 Section II 用户可选 `startSemester` 合并

## 设计决策（探索阶段已确认）

| 项 | 决策 |
|----|------|
| 学生列表范围 | 仅本人申请 |
| 转专业列表 | 去掉 Tab，**默认全部**（含终态） |
| 专业代码 | **当前专业代码** |
| 学生搜索 | **隐藏**学号或姓名 |
| 搜索布局 | 两行 + 可收起（像查询页） |
| 学生表格列 | 隐藏学号、姓名；老师保留 |
| 表单学号/姓名 | **同一行**：学号 \| 姓名；老师「选择」在**行末** |
| 申请学年学期 | Section I 末字段；create 时从当前学期自动带出；`YYYY/MM` |
| 跨模块格式 | 申请 Form/Detail、审批列表、维护/查询列表同一 `applicationSession` 格式 |
| 只读置灰 | Section I + 带出快照（含 Current Programme 等）统一置灰样式 |
| 模拟过期 | **移除**列表操作 + `expireApplication` 数据函数 |

---

## §16 申请学年学期改为选学生后带出 intake（增量）

§14 在 `createEmpty*` 打开时即写入 `getCurrentApplicationSession()`（系统当前学期），导致 Section I 在未选学生时已显示 `2025/09`。产品要求：**仅在选择学生后**带出该生的申请学年信息。

### 变更

| 项 | 规则 |
|----|------|
| 数据源 | **`student.enrollment.intake`**（`YYYY/MM`，如 `2023/09`） |
| create 打开 | `applicationSession: ''`；Section I 显示 `—` 或空 |
| 选学生后 | `buildStudentSnapshotFromProfile` 写入 `applicationSession = intake` |
| 学生端 create | `applicantMode=student` 自动 apply profile → 与选学生后一致 |
| Draft 编辑 | 保留 record 已有值，不刷新 |
| 格式 | 仍为 `YYYY/MM`（与列表列一致；**不是**日期 `YYYY-MM-DD`） |

### 与 §14 关系

| §14（旧） | §16（新） |
|-----------|-----------|
| `getCurrentApplicationSession()` on create | 移除 create 预填 |
| 打开即见当前学期 | 选学生后见 intake |

### 设计决策（

| 项 | 决策 |
|----|------|
| 数据源 | 学生 intake，非系统当前学期 |
| 空态 | 未绑学生时 `—` |
| 范围 | 四 Tab FormModal + DetailModal；列表列仍读 `applicationSession` 字段 |

---

## §17 增量 — 学生选择器增加专业、学院列（2026-06-24）

### 背景与动机

老师代申请时需在选学生弹窗内快速确认学籍归属，仅学号/姓名不足以区分同名或跨专业场景。

### 变更内容

- `StudentSelectModal` 列表在「姓名」后增加 **专业**（`enrollment.programme`）、**学院**（`enrollment.faculty`）两列
- 空值显示 `—`；搜索逻辑不变（仍学号/英文名/中文名 keyword）
- 弹窗适当加宽以容纳长专业名；专业列可 ellipsis
- i18n：`studentSelect.columns.programme`、`studentSelect.columns.faculty`

### 非目标

- 搜索不按专业/学院过滤
- 不改 confirm 回调与 Section I 联动逻辑

---

## §23 搜索按钮样式 + 管理端菜单改名（2026-06）

### 背景与动机

异动申请列表搜索区「查询 / 重置」当前呈现为 **文字链样式**（全局 `button { border:none; background:none }` 重置 + `MovementApplicationSearchBar` 未定义 `btn-primary` / `btn-default`），与 **异动类别** 等列表页实心/描边按钮不一致。产品要求对齐异动类别搜索按钮（蓝底「查询」+ 白底描边「重置」）。

同时菜单文案「学籍异动申请（老师）」调整为 **「学籍异动申请（管理端）」**，更准确表达教务管理入口（内部 `pageId` 仍为 `sr-movement-application-teacher`）。

### 变更内容

**搜索按钮（老师 + 学生 × 四 Tab，一处生效）**

- 在 `list-page-search.css` 为 `.search-bar .btn` / `.btn-primary` / `.btn-default` 补样式，对齐 `MovementCategoryView`：
  - 查询：`#2563eb` 底、白字、高 32px、`border-radius: 4px`
  - 重置：白底、`#d1d5db` 边框、深灰字
- 「收起 / 更多」仍用现有 `btn-text` 文字链样式，不变
- 共享组件 `MovementApplicationSearchBar.vue` 已使用正确 class，**无需改 markup**

**菜单 i18n**

| key | 中文（新） | 英文（新） |
|-----|-----------|-----------|
| `menu.srMovementApplicationTeacher` | 学籍异动申请（管理端） | Status Change Application (Management) |

- `studentRecordsMenu.js` **不改** `id` / `labelKey`
- 面包屑随 i18n 自动更新

### 能力范围（§23 增量）

- `movement-application-list-filters`: 搜索区查询/重置按钮视觉规范
- `movement-application-shell`: 管理端菜单展示文案

### 影响范围（§23 增量）

- **修改** `src/styles/list-page-search.css`
- **修改** `src/i18n/locales/zh.js`、`en.js` — `menu.srMovementApplicationTeacher`
- **非目标** — 不改 `pageId`；不改学生端菜单；不改 PRD 脚本；不改搜索字段逻辑
