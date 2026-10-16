# 变更：polish-adddrop-demo-consistency

## Why

学生端「加退课/重修申请」与管理端「加退课/重修审批」列表的列结构已基本对齐调研主干（窗口内 Add/Drop/Retake/AddDrop），但 demo 数据与展示文案存在口径冲突：列表出现本期不做的 Replace、重修/加课费用与账单状态不一致、学生端课程摘要用英文 action、演示学生学分刷屏超限、提交时间与申请窗口时间线错位、日期格式混用。这些问题会误导评审与后续需求沉淀，应在不大改列结构的前提下先把「已有且易做」的演示一致性修好。

## What Changes

- 学生加退课 demo：**移除 Replace** 申请；仅保留 Add / Drop / Retake / AddDrop。
- 学生列表「申请课程」摘要：与审批端一致，使用 **i18n 中文类型文案**（加课/退课/重修），不再直接输出英文 action。
- 对齐 **费用与账单**：有 `fee` 的加课/重修/加退关联 demo 须有匹配的 `billStatus`（如 pending/paid）；重修至少一条体现待缴费。
- 演示学生（Tan Wei Ming）学分：多数申请使用正常 `currentCredits`；仅保留少量超学分样本，避免待审批列表刷屏 29/20。
- **时间线**：提交时间落在当前活动批次 `addDropWindow` 内（或与窗口文案一致）；审批队列日期格式统一。
- 管理端初始队列中与上述口径冲突的条目一并校正（fee/bill、日期格式）。
- **退课原因**：凡含退课的 demo（Drop / AddDrop / RetakeDrop）必须有非空 `dropReason`（可与 `reason` 同步）；详情不得显示「—」。
- **毕业计费与费用同源**：`billableCredits` / 毕业超出（计费）> 0 时，必须有匹配的 `feeEstimate`（total / items）与 `billAmount`；禁止「毕业超出 2、预估费用 0 RMB」。学期超出仍可 >0 且费用为 0。enrich 在缺 `feeEstimate` 时按计费学分 × 单价（ME 默认 arts=500）合成兜底。
- **重修类型**：凡 `Retake` / `RetakeDrop` demo 必须有合法 `retakeType`（仅 `failed` | `improve_grade`）；非法别名 `improve` 一律改为 `improve_grade`；详情不得显示「—」。
- **学分条 ↔ 毕业计费**：详情学分条为「基线 − 退课 + 加课/重修」最终投影；若 `billableCredits`（毕业超出计费）> 0，条上对应 GE/ME 毕业已选必须 > 要求。真超额样本（如 adr-001）抬高毕业 ME 基线（如 22/24），退必修 + 加 ME 后呈 26/24，与计费 2 / 费用对齐。

## Non-goals

- 不新增 Replace 申请类型与表单字段。
- 不拆分加课/退课双截止日、不实现 48h 逾期自动取消。
- 不改学生列表列结构（本变更不强制增加「账单」列）。
- 不改审批工作流、不重做缴费名单逻辑。
- 不合并进 `course-reg-student-adddrop` / `course-reg-approval` 沉淀包（本变更可独立 apply；归档后再考虑 sync）。

## 能力归类

| 归类 | 说明 |
|------|------|
| 菜单 | 学生选课 → 加退课/重修申请；选课过程 → 加退课/重修审批 |
| OpenSpec 能力 | `course-registration`（delta）；逻辑归属学生加退课 + 审批演示一致性 |
| 关联沉淀包 | `course-reg-student-adddrop`、`course-reg-approval`（文档对照，不改其合并包本体） |
| 调研 | 第 8～9 次：统一入口四类型；重修缴费口径；窗口内可申请 |

## Impact

- Affected code: `src/data/courseRegistration/studentDemoSeed.js`、`src/data/courseRegistration/addDropApprovalQueue.js`、`src/data/courseRegistration/addDropScheduleDemo.js`（enrich 合成 feeEstimate / dropReason）、`src/views/courseRegistration/student/StudentAddDropView.vue`（课程摘要格式化）
- Affected specs: `course-registration` delta
- 无新菜单、无 API
