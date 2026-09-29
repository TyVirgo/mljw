# 设计：polish-r1-selected-percent-demo

## Context

- 学生端 R1：`StudentRegisterView.sectionCapacityLabel` = `round(volunteers.length / section.capacity × 100)%`
- 数据源：`volunteerCourseStates`（`preselectVolunteerConfirm.js`）
- 提交：`submitStudentPreselectVolunteer`；退选：`removeStudentPreselectVolunteer`（经 `unselectConfirmedCourse` / `cancelMyCourseQueue`）
- 现状：GE/ME `seedSectionStates` 用 `~1.7×` 灌数，±1 人变化不可感

## Goals / Non-Goals

**Goals:**

- 初始百分比落在约 90%–120%，仍偏热
- 当前学生提交后该行百分比明显上升；退选后明显下降
- **初始待分配课退选后百分比同样下降**（与新提交一致）
- GE/ME 共用同一套逻辑

**Non-Goals:**

- 不改 R2/R3、管理端结果页、真实 API

## Decisions

### 1. 下调种子热度

```text
旧: max(cap+10, floor(cap*1.7) + jitter)
新: floor(cap * 0.95) + (seed % 5)   → 约 95%–110%+ 小幅抖动
   并 clamp 到 [floor(cap*0.9), floor(cap*1.2)]
```

仍走既有 `layoutGeRound1Roster` / `layoutMeRound1Roster`。

### 2. Demo 热度步进（提交 +4 等效人数）

常量 `DEMO_SELECTED_PERCENT_HEAT = 3`（真实学生 1 + 热度加成 3 = **+4** 人）。

- 状态字段 `demoHeatByStudent: { [studentId]: number }`，**不**写入 `volunteers[]`（避免污染管理端名单）
- 提交：写入真实志愿，并设 `demoHeatByStudent[sid] = 3`
- 退选：移除真实志愿，并删除该 sid 的热度键
- 展示人数：`volunteers.length + sum(demoHeatByStudent)`

容量约 30 时步进约 **+13pp**，肉眼可辨。

### 3. 展示层公式

`percent = round(displayCount / capacity × 100)%`；`StudentRegisterView` 改读展示人数 helper。

### 4. 初始待分配 sync 旁路（增量）

根因：`syncPendingAssignIntoVolunteerStates` 调 `submitStudentPreselectVolunteer`，而 `hasStudentVolunteeredSection` 在 **pending 已有同课同组** 时直接 true → submit 报 duplicate → 名单/热度从未写入 → 退选 `remove` 找不到人 → 百分比不动。

做法：抽出 `ensureVolunteerSeatAndHeat(course, section, studentFields)`：

- 建/取分组 state；若名单尚无该生则追加志愿行；**始终**设 `demoHeatByStudent[sid]`
- **不**调用 `hasStudentVolunteeredSection`（不把 pending 当名单已写入）
- UI 正常提交仍走 `submit`（保留 pending/名单判重）
- `syncPendingAssignIntoVolunteerStates` 只调 `ensureVolunteerSeatAndHeat`

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 热度与真实名单不一致 | 仅 demo；管理端仍读 `volunteers` |
| 种子过低导致胶囊全绿 | 目标带 95%–120%，黄档仍有 |
| sync 重复调用 | ensure 幂等：已在名单则只补热度 |

## 影响文件

- `src/data/courseRegistration/preselectVolunteerConfirm.js`
- （必要时）`StudentRegisterView.vue` 反应式依赖已有则不动
