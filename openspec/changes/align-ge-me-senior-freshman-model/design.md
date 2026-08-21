# 设计：align-ge-me-senior-freshman-model

## Context

- 现批次仅 `rounds.preselect|main|supplement` 一套时间；`preselectPriority.preferSenior` 用学期阈值挡新生。
- 课上已有 `quota.senior|freshman|releaseToFreshman`，管理课程列只读展示；「容量设置」只调总容量 %。
- 第一轮：志愿名单 + 洗牌 + **最终确认** 开第二轮闸门，与「到点自动发布」冲突。
- 约束：老师口径全覆盖；不新开菜单；UI 与现有选课模块统一；可 Phase 1→3 交付。

## Goals / Non-Goals

**Goals**

- 新老两套可配时间 + 可设名额/初分/统计/互释。
- 第一轮按批次配置做容量细分后录取（GE 按日 / ME 按专业×年级；超额才随机）。
- 学生 GE/ME 学分帽、同课组 R1 互斥、按受众窗口 FCFS。
- 全程复用现有视觉组件模式。

**Non-Goals**

- 见 proposal Non-goals。

## Decisions

### 1. 时间数据模型

```text
batch.roundsByAudience = {
  senior:   { preselect, main, supplement, resultReleaseAt? },
  freshman: { preselect, main, supplement }
}
```

- 兼容：迁移时将现有 `rounds` 拷入 `senior`；`freshman` 用 demo 邮件表灌数。
- 管理轮次抽屉顶栏 Tab：老生 | 新生；其下仍为 R1/R2/R3 折叠块（复用 `section-title` / `round-card`）。
- 校验：同受众内起止顺序；**允许**跨受众时间重叠。
- 列表：轮次列「新生：…」换行「老生：…」；时间展示含时分秒；名称等列单行 + 横滑；行距尽量紧凑。
- **精度**：配置类（R1–R3、结果发布、加退课申请窗）与流水类（申请/志愿提交）统一到 `HH:mm:ss`（秒默认 00）。
  - 选择器：`DatePickerEn` `mode="datetime"`，展示 `DD/MM/YYYY HH:mm:ss`。
  - 存储扩：`25-Aug-2025 09:00:00`（无时分秒的旧值展示时补 `00:00:00`）。
  - 加退课窗口比较改为精确到秒，不再把结束日隐含成 23:59:59。

### 2. 身份

- 学生上下文增加 `registrationSemesterIndex`（或等价）：`1` = 新生，`>=2` = 老生。
- 选课窗口：`getActiveRoundForAudience(batch, audience)`。
- 对象限制：已按方案 A 去掉「第一轮选课对象限制」UI 与 preferSenior 硬挡；谁能进 R1 仅由 `roundsByAudience` + 学生受众决定。`preselectPriority` 字段保留兼容，默认 `preferSenior: false`。

### 3. 名额

- 初分：`senior = round(total * seniorCount / (fresh+senior))`，`fresh = total - senior`。
- 人数来源：批次范围 demo 统计或可编辑的「新老在册人数」演示输入（弹窗内，避免新页）。
- year2/sem2：课标志 `minStudentSemester >= 2` → 初分/保存时强制 `freshman = 0`。
- 编辑入口：管理课程工具条「名额分配」弹窗（或扩容量弹窗第二段）+ 详情名额 Tab 可保存。
- 往期占比：详情 Tab 内静态/demo 表（学期、新老占比），不新菜单。
- R3「第三轮选课新老生名额互释」：
  - 校级：规则表 `CR205`（flag，默认开），与其它选课规则同行展示，必须NOT 另起独立卡片。
  - 批次：`localRules.releaseCrossAudienceOnRound3`（新建默认勾选）；`isReleaseCrossAudienceOnRound3(batch)` 批次有显式字段时优先，否则回退 CR205。
  - 学生 R3 有效空位 = 本池剩余 +（互释开时）对方池剩余（`getRound3EffectiveRemaining`）。

### 4. 第一轮容量细分与录取（批次配置，无校级 r）

配置挂在批次 `round1Quota`，UI 在**管理轮次 · 老生 · 第一轮**（不在校级规则页）。校级规则页仅保留「第三轮选课新老生名额互释」等，**必须NOT**再提供全局 r / ME 专业 r。

```text
batch.round1Quota = {
  decayR: 3,                      // GE：衰减系数，默认 3；Demo 开放天数 N=5
  meYearShares: {                 // ME：入学年 → 份额（同年 02/04/09 共用）
    '2024': 5,
    '2025': 3,
    '2026': 2,
  }
}
```

专业在批次 `programme` 已绑定，管理轮次 必须NOT 再配专业维。默认按批次 `academicSession` 列举三年（锚点年及前两年），份额默认 5:3:2（较早更高），允许添加入学年。

**共同录取规则（池内）**

- 某细分池申请人数 ≤ 池容量 → 全部录取，不随机。
- 申请人数 > 池容量 → 在该池内均匀随机抽出容量人数。
- 毕业生仍可先占硬优先（占完后再对剩余容量做细分）。

**GE**

- \(W_i = r^{N-i}\)（Demo：N=5；r 默认 3）；归一化为每日硬额度 \(q_i\)（整数，尾差补第 1 天）。
- 管理端只展示公式释义（W_i / r / N / i）与 r 输入、日份额预览；必须NOT 展示 r=2/2.5/3/4 推荐列表。
- 非毕业生按志愿提交日落池；日内不结转；整轮 R1 未用完的老生席位进入 R2/R3。

**ME**

- 按入学年切分剩余老生容量；同年 Feb/Apr/Sep（02/04/09）共用该年份额。
- 学生按志愿 `intake` 归入入学年池；未配置年进入兜底剩余池。
- 各池同样「未超额全录 / 超额随机」。不按日切；不使用校级/专业 r。

**发布**

- 到达 `resultReleaseAt` 自动写入（或演示一键）；成功等同开 R2 闸门。
- 同课多组：同一 studentId+courseCode 最多中选一个 section。

### 5. 学分帽

- `studentCreditCaps = { geMax, meMax }`（按当前学期 demo）。
- 加入篮/提交时按课程类型累计校验。

### 6. UI 一致性（硬约束）

- 复用：`CourseRegistrationCallout`、`form-field`、`data-table`、`btn-*`、`DatePickerEn`、现有 Drawer/Modal 头身底。
- 禁止：新侧栏项、一次性配色、裸控件无 label、中英写死。
- 每 Phase 交付前做样式并排自检（与管理轮次/管理课程同页观感）。

## Risks / Trade-offs

- 双时间线增加管理轮次复杂度 → Tab 分受众降低噪音。
- 自动发布与现「最终确认开 R2」耦合 → 发布成功写同一 `volunteerFinalConfirmedAt`（或改名保留兼容）。
- 往期统计无真数据 → demo 表需标注演示。

## Migration

- 启动时若无 `roundsByAudience`，从 `rounds` 填充 senior 并生成 freshman 默认空或 demo。

## 影响文件（预期）

| 区域 | 文件 |
|------|------|
| 批次/轮次 | `registrationBatches.js`、`BatchRoundManageDrawer.vue`、`batchRoundSetupGates.js`、`RegistrationBatchView.vue` |
| 名额 | `selectableCourses.js`、`BatchCoursesDrawer.vue`、`SelectableCourseDetailDrawer.vue`、新小弹窗（可选） |
| 规则 | `RegistrationRuleSettingsView.vue`（仅互释等）、`preselectWeightSettings.js`、`batchLocalRules.js`、`RegistrationBatchFormDrawer.vue` |
| 第一轮 | `batchRound1Quota.js`、`BatchRoundManageDrawer.vue`、`preselectWeightedLottery.js`、`preselectVolunteerConfirm.js`、`RegistrationResultView.vue` |
| 学生 | `studentRegistrationContext.js`、`studentRegistrationStore.js`、`StudentRegisterView.vue` |
| 指引/i18n | flow guide 文案、`zh.js`/`en.js` |
