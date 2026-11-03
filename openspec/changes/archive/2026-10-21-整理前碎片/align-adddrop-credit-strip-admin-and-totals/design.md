## Context

学分条基线在 `StudentAddDropView.termCreditStripBaseline`：`gradGe/Me` 已与学期同源，`gradMandatory` 仍用 `getProgrammeCreditProgress().mandatoryEarned`（含 `DEMO_PRIOR_EARNED_CREDITS`）。`pickerCreditGroups` 用 `scope: 'confirmed'`，过滤 `sourceType !== 'admin'`，导致 BUS201(1) 在退课表可勾选却不进条。

## Goals / Non-Goals

**Goals:**

- 毕业必修已选 = 学期必修已选（同源求和）
- 加退学分条计入 admin 代选（展示与计算一致）
- 右侧总学分拆「学期已选总 / 毕业已选总」两格，青绿不变

**Non-Goals:**

- 不隐藏 admin 课
- 不改 prior demo 常量本身（仅条上不用它作毕业必修已选）

## Decisions

1. **毕业必修基线**：`gradMandatoryCurrent = mandatorySelected`（与 `studentRequiredCourses` 求和一致）；`gradMandatoryMax` 仍用培养方案要求。
2. **admin 计入**：加退学分条取数改为含 admin 的确认课（新增 scope 或专用 opts，如 `confirmedIncludingAdmin` / `includeAdmin: true`），不影响其它页面「本轮选课」排除 admin 的既有语义。
3. **总学分拆行**：`buildAddDropTermCreditStrip` 输出  
   - `termTotalSelected = elective + mandatory`（学期）  
   - `gradTotalSelected = gradElective + gradMandatory`（毕业）  
   废弃跨行 `totalSelected` 单格展示（保留字段兼容时可等于 termTotal，或改为映射学期总并注释弃用）。
4. **布局**：原 `area-total` 跨两行改为两格 `area-term-total` / `area-grad-total`，各占一行；label `#99f6e4`、value `#ccfbf1`、字色 `#0f766e`。
5. **i18n**：`termTotalSelected` / `gradTotalSelected`；原 `totalSelected` 标记弃用或改指向学期总。

## Risks / Trade-offs

- [其它入口仍排除 admin] → 仅加退学分条/基线路径改 includeAdmin，缩小影响面  
- [毕业 tip 未修学分变大] → 毕业必修 current 从 54→9 后 tip 未修变大，符合「与表对齐」产品决定  

## Migration Plan

无数据迁移；刷新页面即可。审批队列 demo baseline 若硬编码 `gradMandatoryCurrent: 54` 可顺带改为与 `mandatorySelected` 一致以免演示不一致。
