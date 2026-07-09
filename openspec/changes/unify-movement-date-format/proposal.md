## 背景与动机

学籍异动全链路（四 Tab 申请 → 审批 → 维护 → 查询 → 统计 → Export / Approval log）中，日期字段当前混用多种展示格式（如 `15 Oct 2023`、`20.09.2025 14:30`、ISO 存储值直接展示）。产品图示要求 **统一为 `YYYY-MM-DD`**（如 `2025-09-20`），便于列表、详情、导出与审批日志一致阅读。

## 变更内容

### 统一展示格式

| 格式 | 示例 | 状态 |
|------|------|------|
| **目标** | `YYYY-MM-DD` | 全链路展示 |
| 旧列表/Form | `DD MMM YYYY` | 替换 |
| 旧 approvalLog | `DD.MM.YYYY HH:mm` | 替换为 `YYYY-MM-DD` |
| 存储 | ISO date 或 ISO datetime | 可保留；展示层 format |

### 范围（学籍异动全链路）

- **四 Tab 申请**：列表申请日期、FormModal/DetailModal 只读日期（申请日期、签证到期、lastDateOfAttendance 等纯日期字段）
- **审批**：Application Date 列、ReviewView 内日期、ApprovalLogModal
- **维护 / 查询**：movementDate 等日期列
- **统计**：若展示日期字段
- **Export**：xlsx 中上述日期列

### 不在范围

- `applicationSession`（`YYYY/MM` 学年学期，见 `split-movement-application-teacher-student` §16）
- 学生档案、教务其他模块
- `DatePickerEn` 输入控件交互（仍可存 ISO；只读展示走 formatter）
- vue-router、后端 API

## 能力范围

### 新增能力

- `movement-date-format`: 异动全链路日期展示统一为 `YYYY-MM-DD`

### 修改的能力

- `programme-transfer-app`: Section VII 在申请 Form 常显但 disabled 置灰（§17）
- `movement-date-format`: 新增 effectiveSession 列 YYYY/MM 统一规则（§18）

## 影响范围

- **新增**
  - `src/utils/formatMovementDate.js` — `formatMovementDate(value)` → `YYYY-MM-DD` | `—`
- **修改**
  - 四 Tab `*.js`：`formatApplicationDateDisplay`、`format*ListDate` 收敛或委托 helper
  - 四 Tab `*View.vue`、`*FormModal.vue`、`*DetailModal.vue`
  - `movementApprovalQueue.js` — `formatApprovalApplicationDate`
  - `movementMaintenanceFields.js` — `formatMovementDateDisplay`
  - `movementApprovalEngine.js` — log `dateTime` 写入与展示
  - `ApprovalLogModal.vue`
  - `exportMovementQueryExcel.js`、`exportMovementApprovalExcel.js`、统计 export（若有日期列）
- **§17 增量**
  - `ProgrammeTransferFormModal.vue` — Section VII disabled + 置灰样式
- **§18 增量**
  - `src/utils/formatEffectiveSession.js`（或扩展 `formatMovementDate.js` 同目录）
  - `movementApprovalQueue.js` — `extractEffectiveSession` 出口格式化
  - `exportMovementQueryExcel.js`、`exportMovementApprovalExcel.js` — effectiveSession 列
  - （可选）seed `effectiveSession` 与 formatter 对齐

## 设计决策（探索阶段已确认）

| 项 | 决策 |
|----|------|
| 展示格式 | ~~`YYYY-MM-DD`~~ → **`dd.Mmm.YYYY`**（见 §19） |
| 范围 | 仅学籍异动全链路 |
| approvalLog | 展示仅日期；新写入 ISO |
| applicationSession | 不纳入（`YYYY/MM`） |

---

## §17 增量 — 转专业 Section VII 申请侧置灰（2026-06-24）

### 背景与动机

产品图示：转专业新建/编辑表单中 **Section VII（FOR ACADEMIC AFFAIRS OFFICE USE ONLY）** 属于教务审批环节填写，不应在申请侧可编辑。当前 `ProgrammeTransferFormModal` 三个字段为可交互下拉/日期，与职责边界不符。

### 变更内容

- Create / Edit / Resubmit 表单：**Section VII 仍可见**，但 New Programme / New Intake / Date **disabled + 置灰样式**，用户不可填写
- Submit / Save Draft：**不校验** Section VII；申请侧不写入 `adminNewProgramme` / `adminNewIntake` / `adminDate`
- **不在本次范围**：审批 ReviewView 补 Section VII 编辑、DetailModal、其他三 Tab

### 设计决策

| 项 | 决策 |
|----|------|
| 可见性 | 常显（与 Section IV 之后布局不变） |
| 交互 | `disabled` + readonly 置灰 class |
| 审批 | 维持现状（first choice 回退 + seed）；不新增审批 UI |

---

## §18 增量 — 生效学期列统一 YYYY/MM（2026-06-24）

### 背景与动机

审批 / 维护 / 查询列表「生效学期」列混用 `2025/09` 与 `2025-09-20`：退学 `extractEffectiveSession` 直接回退 `lastDateOfAttendance`（日历日），与列语义「生效学期」及 `applicationSession` 的 `YYYY/MM` 不一致。

### 变更内容

- 新增 `formatEffectiveSession(value)`（或与 `formatMovementDate` 同文件）：输出 **YYYY/MM** 或 `—`
- 规则：已是 `YYYY/MM` 原样；ISO 日期 `YYYY-MM-DD` → 取年月 → `YYYY/MM`（如 `2025-09-20` → `2025/09`）
- `movementApprovalQueue.extractEffectiveSession` 及 Export 共用 formatter
- **不在本次范围**：改列名、拆列、`movementDate` 列（仍 `YYYY-MM-DD`）、`applicationSession`

### 设计决策

| 项 | 决策 |
|----|------|
| 退学派生 | `lastDateOfAttendance` → `2025/09` |
| 列语义 | effectiveSession 全类型统一学年学期格式 |
| Section VII | 见 §17，独立触点 |

---

## §19 增量 — 展示格式改为 dd.Mmm.YYYY（2026-06-24）

### 背景与动机

产品图示更新：申请列表「日期」、审批「申请日期」及异动全链路日历日展示，由 §1 的 `YYYY-MM-DD` 调整为 **`dd.Mmm.YYYY`**（如 `29.Sep.2025`），月名使用英文三字母缩写，与马来教务英文日期习惯一致。

### 变更内容

- `formatMovementDate(value)` 输出 **`dd.Mmm.YYYY`** 或 `—`（日补零；分隔符 `.`）
- 新增 `formatMovementDateIso(value)`：存储 / 引擎比较仍用 **`YYYY-MM-DD`**
- `movementApprovalEngine` 新 log 写入 ISO；`ApprovalLogModal` 展示经 `formatMovementDate`（兼容旧 seed `DD.MM.YYYY HH:mm`）
- 四 Tab 列表、Form/Detail 只读、审批列表、维护/查询 movementDate、Export 日期列同步
- **不在范围**：`applicationSession` / `effectiveSession`（仍 `YYYY/MM`）；DatePicker 输入；非异动模块

### 设计决策

| 项 | 决策 |
|----|------|
| 展示格式 | `dd.Mmm.YYYY`（如 `29.Sep.2025`） |
| 月名语言 | 固定英文缩写（Jan–Dec） |
| 存储 | ISO `YYYY-MM-DD`；展示与存储分离 |
| approvalLog 展示 | 仅日期，不含时间 |
| Export | 与屏幕展示一致 |

---

## §20 增量 — 学年学期字段规范 YYYY/02|04|09（2026-06-24）

### 背景与动机

图示 Intake、申请学年学期、生效学期混用日历日（如 `2024-07-28`）与非法月份（如 `2025/08`、`2025/01`）。三者语义均为**学年学期**，非日历日期；须与 `semesterInfo` 一致，仅允许 `02/04/09`，且满足 **intake ≤ 申请学年学期 ≤ 生效学期**。

### 变更内容

- 新增 `normalizeAcademicSession.js`：`normalizeAcademicSession`、`compareAcademicSession`、`validateAcademicSessionOrder`
- `formatEffectiveSession` 委托 normalize；ISO 日期按校历月映射到 02/04/09
- `extractApplicationSession` 移除 `dateOfApplication` / `startSemester` 回退
- 列表 Intake / 申请学年学期 / 生效学期、Export 出口统一 normalize
- 四 Tab 表单下拉与 seed 仅含合法学期码；提交校验顺序
- **修订 §18**：退学生效学期仍为 `lastDateOfAttendance` 派生，但经 normalize 到 02/04/09

### 设计决策

| 项 | 决策 |
|----|------|
| 合法值 | `YYYY/02`、`YYYY/04`、`YYYY/09` only |
| 非法月 snap | 01–02→02；03–08→04；09–12→09 |
| 顺序 | intake ≤ applicationSession ≤ effectiveSession |
| 申请学年学期 | 不回退日历日；优先 `applicationSession` → `intake` |
| 存储 | 表单字段仍存 YYYY/MM；展示层 normalize |
