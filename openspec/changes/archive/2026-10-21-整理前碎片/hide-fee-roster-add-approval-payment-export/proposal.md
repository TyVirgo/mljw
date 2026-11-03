## Why

加退选审批「历史」已具备账单状态、缴费剩余、账单明细与催缴操作，与「缴费名单」页信息高度重叠。名单菜单可隐藏以减负；财务仍需能导出「哪些学生/课程已缴、哪些未缴」，该能力应落在审批历史，不必复刻名单旧字段（欠学费、学分要求等）。

## What Changes

- **隐藏**侧栏「缴费名单」菜单入口（页面组件与 `feeRosterQueue` 后台写入暂留，便于后续收敛）。
- 审批「历史」Tab 增加 **「导出缴费」**：基于当前历史筛选结果与账单明细，导出课级明细（一行一课），标明已缴/未缴。
- 保留既有「导出」（申请列表），与「导出缴费」并存。
- 导出目的导向：能区分已缴/未缴学生与课程即可；不含欠学费等学籍字段。
- **§2**：同一申请单下多课导出行合并学号/姓名/申请单号/账单/缴费状态/SST/总费用（Excel 纵向合并单元格）；课行仍分行；增加 SST 费用与总费用（Σ课程费+SST）。

## Non-goals

- 不删除 `FeeRosterView` / `feeRosterQueue` 数据层与审批/学生缴费写入。
- 不要求字段与旧缴费名单导出完全一致。
- 本期不做汇总 Sheet、待审批 Tab 缴费导出、按学生跨申请合并。
- 不改学生端缴费流程。

## Capabilities

### New Capabilities

- `approval-payment-export`: 审批历史导出缴费明细（已缴/未缴课行）

### Modified Capabilities

- （无主库 delta；缴费名单菜单隐藏为配置层变更）

## Impact

- `courseRegistrationMenu.js`：去掉 `cr-fee-roster` 菜单项（developedPages 可保留以防直达）
- `AddDropApprovalView.vue`：历史 Tab 导出缴费入口 + ExportModal
- `adminAddDropPaymentInsight.js` / 导出字段：组装课行导出数据
- i18n zh/en
- 流程引导文案若强依赖「缴费名单」菜单，仅弱化或保留说明（不挡主路径）
