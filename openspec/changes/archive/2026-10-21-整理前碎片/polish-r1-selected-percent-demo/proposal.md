# 变更：polish-r1-selected-percent-demo

## Why

GE/ME 第一轮课库「课程已选百分比」公式已是 `志愿数/容量`，但种子故意灌到约 **1.7×** 容量（界面常显 160%–173%）。学生提交/退选只 ±1 人时百分比几乎看不出变化，演示时被当成「静态数」。需要可感知的选退联动 demo 效果。

## What Changes

- **压低 GE/ME R1 志愿种子热度**：初始百分比落在约 **90%–120%** 可见区（仍能表达偏热），而非固定贴在 ~170%。
- **提交/退选放大步进（demo）**：当前学生提交志愿时，该分组展示人数 = 真实志愿 + demo 热度加成（合计约 +4）；退选时一并清除热度，保证百分比明显升降。
- **增量 · 初始待分配也要能降百分比**：demo 一打开就在「本轮选课情况」里的课（`seedVolunteerRegisterDemo` → pending），MUST 同步写入志愿名单 + 热度；退选后课库百分比 MUST 与新提交课一样下降。禁止再走会被 `hasStudentVolunteeredSection`（pending 判重）噎死的 `submit` 路径。
- **保持一人一票模型**：仍写 `volunteerCourseStates.volunteers[]`；列表继续用既有 `sectionCapacityLabel` 实时计算。
- **GE 与 ME 同步**；不改 R2/R3「已选/容量」语义。

## Non-goals

- 不接真实报名统计 API
- 不改管理端选课结果页百分比列（除非后续另开变更）
- 不改抽签/加权/容量校验业务规则
- 不新建菜单页

## Capabilities

### New Capabilities

- `r1-selected-percent-demo`：第一轮「课程已选百分比」选退动态 demo（种子热度 + 提交/退选可见步进）

### Modified Capabilities

- （无主库已归档条目；以本 change 规格为准。）

## Impact

- `preselectVolunteerConfirm.js`（`seedSectionStates`、提交/退选志愿）
- `StudentRegisterView.vue`（仅依赖既有百分比计算；若需补强反应式再动）
- OpenSpec 本 change
