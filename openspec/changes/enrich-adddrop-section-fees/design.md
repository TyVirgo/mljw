## Context

基线：`enrich-adddrop-form-sections` 已提供 I–V 分节表单与声明。当前选课仍以课程 id 确认，并用 `getCourseWithFirstOpenSection` 自动填组；时间/地点/教师合并展示；冲突仅审批端校验；费用为固定数字；加课池偏宽；主表列不足且无冻列横滑。

约束：Vue 3 原型 + mock；复用课表冲突检测与志愿表 sticky 模式；不接真实财务/成绩库。

## Goals / Non-Goals

**Goals:**

- 课→组两步选择；冲突组禁用并说明原因。
- 时/地/师分字段；费用按科类学分单价试算并展示。
- 加课资格与学期过滤；重修成绩单驱动。
- 主列表字段同步 + 冻列横滑。
- 学生端四类型 Tab 分列、表头不换行、新建锁定类型。

**Non-Goals:**

- 真实账单出账与支付。
- 冲突后默认强制展开退课节（改为禁用冲突组）。
- 替换已有分节/声明骨架。

## Decisions

### 1. 两步选择器

```
课程表（按资格过滤）→ 确认课
     → 分组表（该课 sections）
          可选 / 冲突禁用+原因 / 满员禁用
     → 回填 sectionCode, time, room, lecturer
```

- **选择**：扩展 `AddDropCoursePickerModal` 为两阶段，或「课程确认后内嵌分组面板」。
- **否决**：继续自动第一组。

### 2. 冲突策略

- 比对基准：学生当前课表（必修+已确认+表单内已选加/重修组，扣除拟退）。
- 冲突组：`disabled` + 文案如「与 COMP101（周一 10:00–12:00）冲突」。
- 换课路径：用户先 Drop / AddDrop 退掉冲突课后再选。

### 3. 加课资格 demo

| 标记 | 含义 | 可选 |
|------|------|------|
| `prior_drop` | 曾退课 | ✓（本学期开课） |
| `deferment_gap` | 休学落下 | ✓ |
| `future_session` | 后续学期 | ✗（不进列表） |
| 其它常规选修 | — | ✗ |

Notes 写明规则。实现：`addDropEligibleCourses.js`（或等价）按学生 id 返回池。

### 4. 重修 + 成绩单

- demo `studentTranscript.js`：课号、课名、成绩、学期、科类。
- 选成绩行 → 回填曾修信息；`F` 默认挂科重修，及格默认刷分（可改）。
- 再选**本学期**同课号分组。

### 5. 费用

```
rates = { arts: 500, science: 550, business: 600 }
fee = billableCredits × rates[course.feeStream]

重修：billableCredits = 课程学分
GE/ME 超额加课：billableCredits = max(0, credits − remainingPlanCreditsInBucket)
计划内补 Drop/休学落下：billableCredits = 0（除非同时触发超额规则）
```

表单声明前展示明细行 + 合计；写入 `feeEstimate` / `billAmount`。

### 6. 表单字段拆分

替换合并的 `dayTimeVenue` 为 `classTime`、`venue`、`lecturers` 三只读字段。

### 7. 主列表

学生端与审批端：

- 增列：分组、上课时间、地点、教师、预估费用、重修类型（有则显示）。
- 容器 `overflow-x: auto`；冻左：序号、申请单号、类型；冻右：状态、操作。
- 参考 `StudentRegistrationCartDrawer` sticky 模式。

### 8. 学生端类型 Tab + 分列（增量）

对齐 `StudentMovementApplicationView` 的四 Tab 交互，但**同页轻量实现**（不必拆四个子 View）：

```
[加课] [退课] [重修] [加退关联]
        │
        ▼
  仅展示 type === activeTab 的申请
  列集 = 该类型专属列（表头 white-space: nowrap）
  发起申请 → form.action = activeTab（表单类型只读）
```

| Tab | 课程列 | 组/时/地/师 | 费用相关 | 去掉 |
|-----|--------|-------------|---------|------|
| Add | 添加课程 | ✓ | 预估费用 | 类型列、退/重修课名、重修类型、退费 |
| Drop | 退课课程 | ✓ | 退费抵免 | 类型列、加/重修课名、预估费用、重修类型 |
| Retake | 重修课程 | ✓ | 预估费用 + 重修类型 | 类型列、加/退课名、退费 |
| AddDrop | 退课 + 添加 | ✓（优先展示加课侧，缺省回落退课侧） | 预估费用 + 退费抵免 | 类型列、重修课名/类型 |

- 搜索区去掉「申请类型」筛选项（由 Tab 承担）。
- 白名单 `allowedActions` 不含当前 Tab 时：禁用「发起申请」并提示。
- 审批端不引入类型 Tab（保留状态 Tab）；本增量不强制改审批列集。

### 9. 起止周列 + 排课 demo 填充（增量）

- 各类型主表在「教学分组」后增加 **起止周**（`weekRange`，如 `1-18`）。
- demo 样本对齐排课图示：教师（Dr. Sarah / Dr. Brown / Ms. Chan / Dr. Ng / Ms. Tay）、地点（A2-*-*）、上课时间用 `deriveClassTime` 生成节次文案。
- 种子与审批初始队列经 `enrichAddDropApplicationSchedule` 补齐顶层与 `items` 字段；缺字段触发学生 demo 重种。
- 列表读取优先顶层字段，回落 item；展示层对 `time` 走 `deriveClassTime`，避免英文时钟裸露或空「—」。

### 10. Notes 按类型删减 + 状态胶囊 + 审批列同步（增量）

**Notes：** 按 `form.action` 只展示本类型实用规则（每节一门课、及适用的资格/冲突/先退后加）；有序列表编号；不展示分节填写指引与费用长文。

**状态胶囊：** 对齐学籍 `status-badge`；映射 Pending / In Review / Approved / Rejected / Cancelled。学生端与审批端列表均使用胶囊。

**Demo：** 五状态各 ≥2 条；四类型均有行；切换类型 Tab 或审批类型筛时可见明显差异。

**审批列：** 保留待我/已提交/历史 Tab；列固定含状态、申请类型、学号、姓名；课程/排课/费用列随类型筛（空=宽列含三科名；选中=与学生该类型列集对齐）。

### 11. 表单学分与说明收口（增量）

- Section II：「加课类型」下拉改为只读「学分」，来自所选课程；校验不再要求 `addType`。
- Notes：仅保留实用规则并顺序编号（见 §10 更新）。
- 去掉声明前零费用灰字；有费用时仍展示试算框。
- Section V：标准声明前增加分类型「其他申请说明」文案。

### 12. 操作列与表单字号（增量）

- 学生主表：`sticky-actions` 加宽至约 140px，`actions-cell` 禁止换行，保证「详情」「取消」横排；同步调整状态列 `right`。
- 字号层级（四类型共用 FormSections）：section-bar 15–16px > 正文 14px ≥ 标签/Notes/提示 12–13px；详情抽屉 section-bar 对齐。

### 影响文件（预期）

- `AddDropCoursePickerModal.vue`、`AddDropApplicationFormSections.vue`、`StudentAddDropView.vue`
- `AddDropApprovalView.vue`（列表列与状态胶囊）
- `AddDropApplicationDetailBody.vue`
- `addDropFormSections.js`、`addDropListColumns.js`、`addDropScheduleDemo.js`；`addDropStatusBadge.js`
- `studentDemoSeed.js`、`addDropApprovalQueue.js`
- `zh.js` / `en.js`；`movement-status-badge.css`（或等价）

## Risks / Trade-offs

- **[选择器变复杂]** → 两阶段同弹窗，步骤指示清晰。
- **[冲突算法与中文课表格式不一致]** → 统一用已有 schedule slot 结构比对。
- **[旧申请无新字段]** → 列表/详情缺省「—」。
- **[商/文/理映射不准]** → demo 课程显式挂 `feeStream`。

## Migration Plan

纯前端；回滚还原本变更。localStorage 旧单只读降级。

## Open Questions

- GE 三桶（humanities/business/science）与收费三档（arts/business/science）映射：humanities→arts；business→business；science→science（已假定）。
- ME/专业课默认 `feeStream`：按开课学院 demo 标注，缺省 science。
