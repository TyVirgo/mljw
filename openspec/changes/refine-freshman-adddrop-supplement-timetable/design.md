# 设计：refine-freshman-adddrop-supplement-timetable

## Context

- 前序变更已提供：新生/老生受众、`roundsByAudience`、学期学分帽、补注册名单基础字段（`canAdd`/`canDrop`/`canRetake`）。
- 加退课申请窗为批次级 `addDropWindow`；另有 `dropDeadlineWeek` 用于自助退课周次口径。
- 学生课表数据存在于 `studentSchedule` / 监控 `schedule`，但各业务节点未统一挂载预览。
- 在线选课曾弱化「详情」入口；课程库目前偏管理端导入，缺学生侧文档名与课号一览。

## Goals / Non-Goals

**Goals**：按 proposal 全量可演示；中文规格可导出为需求文档；挂现有页面。

**Non-Goals**：见 proposal。

## Decisions

### 1. 新生访问加退课

```
isFreshman && !onSupplementWhitelist
  → 加退课页只读说明 + 引导在线选课；禁止提交
isFreshman && onWhitelist && canAdd only
  → 仅开放加课类申请
isSenior
  → 现有加退/重修逻辑 + 申请窗校验
```

侧栏「加退课」对新生可仍可见（避免菜单消失困惑），但进入后明确不可用；或灰显由产品二选一，**默认保留入口 + 页内拦截**（改动更小、可解释）。

### 2. 截止时间两层

| 层 | 含义 | 落点 |
|----|------|------|
| 申请窗 | 可提交加退重修申请的起止（含时分秒） | `batch.addDropWindow`；长/短学期 demo 对齐周五 17:00:00 |
| 退课教学周 | 自助 Drop 截止周 | `dropDeadlineWeek`：长=2，短=1；超周必须特批/白名单 |

短长学期判定：优先批次显式字段；否则由 `academicSession` 启发式（如 `/02` 短学期、`/04`/`/09` 长学期），并在表单 tip 写明。

### 3. 补注册时效状态机

```
未邀请
  → [发送邀请] → 已邀请(attempt=1, deadline=sentAt+24h) + 模拟邮件 Callout
已邀请且未逾期且未提交
  → 学生可填
逾期未提交
  → 锁定；[再次开放] → attempt=2, 新 sentAt, deadline=+24h
attempt≥2 且再逾期
  → 须人工备注处理（原型提示即可）
```

字段建议（名单行）：`inviteSentAt`、`deadlineAt`、`inviteAttempt`、`lastEmailMockAt`。

### 4. 课表挂载点（同一组件，不同数据源；**按需展示，非常驻顶栏**）

| 阶段 | 挂载 | 数据 | 展示 |
|------|------|------|------|
| 选课前 / 预选中 | 在线选课「我的课表」抽屉 | 已确认 + 篮内志愿 | 工具栏按钮打开 |
| R1 公开后 | 同上 / 结果 | 已中签确认课 | 同上 |
| 加退申请 | 加退课申请表单内 | 当前课 + 拟加拟退后预览 | **仅打开表单时**显示 |
| 最终 | 我的选课结果 | 定稿确认课 | 工具栏「我的课表」抽屉（旁同步 Study Plan） |

不新开课表菜单。三页不在第一屏常驻周网格。

**图层与视觉（修订）**

| layer | 数据 | 视觉 |
|-------|------|------|
| `required` | demo 必修 1～2 门（字段同确认课，`sourceType:'required'`） | 实心靛蓝/灰蓝 |
| `confirmed` | 已确认选修；R1 公示后中签志愿 | 实心蓝 |
| `preview` | 篮内 / 未公示志愿 / 拟加 | 虚线边框浅蓝 |
| （冲突） | 冲堂 | 红（既有） |

- 轮次：块角标 `R1/R2/R3`（来自 `roundKey`），**不**为每轮单独配色。
- 格内：`课号·组号`；`title` 悬停补课名、教室、教师、学分、图层说明。
- 抽屉内展示图例。

### 5. 课程库与一览

- 批次或在线选课顶栏：`libraryDocs[]` demo（title + url 可空）。
- 主表：`course.code` 为 link-btn → 现有 `StudentCourseDetailDrawer`。
- 「课程一览」：同一数据源，默认按 `code` 排序的紧凑表/抽屉；过滤 `isSelectable` 与资格后的可选集。
- 顶栏右侧：GE/ME 学期进度条（已选含篮 / 上限）；超限时行按钮置灰 + tip。

### 6. 监控与受众英文

- 监控详情进度条改为 GE/ME（非文科/商科）。
- 英文：Existing students / New students。

### 7. 需求文档取向

本包 `proposal` / `design` / `specs` / `tasks` 均中文、含场景与页面映射，便于后续汇总进项目需求说明书；实现任务与规格场景一一对应。

## Risks / Trade-offs

- 新生仍见加退课菜单可能被问「为何点进去不能用」→ 页顶强说明 + 主按钮跳转在线选课。
- 24h 在原型用固定时钟/按钮模拟「快进」更易演示，可选加「演示：设为已逾期」。
- 课表多阶段若一次做满，P2 再铺预览样式即可，P0/P1 先保证入口存在。

## Migration

- 现有补注册行：`inviteAttempt=0`，无 deadline；行为与今一致直至点发送邀请。
- 旧申请窗纯日期：结束日按日末或显式 17:00:00（与前序 datetime 精度一致）。

## 影响文件（预期）

| 区域 | 文件 |
|------|------|
| 新生闸门 | `StudentAddDropView.vue`、`studentAudience.js`、菜单可选 |
| 截止 | `registrationBatches.js`、`RegistrationBatchFormDrawer.vue`、`demoTeachingWeek.js` |
| 白名单时效 | `supplementListQueue.js`、补注册 View |
| 课表 | 在线选课 / 加退课 / 我的结果 + 共享课表小组件 |
| 课库一览 | `StudentRegisterView.vue`、详情抽屉、i18n、学期 GE/ME 进度 |
| 监控进度 | `RegistrationMonitorDetailDrawer.vue`、监控行 `termElectiveProgress` |
| 指引 | `courseRegistrationFlowGuide` 文案、zh/en |

### 5d. 课表密度与排课文案（增量）

- `WeekScheduleGrid`：行高约 36–40px；左轴 `8:00-9:00` / `8.00am-9.00am`；时段 8–22；块内五行（周独立末行）。
- `formatVenueDisplay`：末段前 `#`（已有 `#` 则原样）。
- `deriveClassTime(time, locale)`：无节次；zh `(星期二 09:00–11:00)`；en `(Tuesday 9.00am-11.00am)`。
