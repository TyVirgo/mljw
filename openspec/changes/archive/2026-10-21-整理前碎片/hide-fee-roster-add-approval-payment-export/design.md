## Context

- 审批历史已用 `billStatus` + `getApplicationBillDetail` 表达整单已缴/待缴与课行。
- 缴费名单页主要为学生汇总（学分要求、欠学费）+ 财务导出；在线缴费落地后 UI 已瘦身为查询+导出。
- 产品决策：藏菜单；导出迁到历史且目的导向，不追求字段对齐。

## Goals / Non-Goals

**Goals**

- 侧栏不再出现「缴费名单」。
- 历史 Tab 可导出：学号、姓名、申请单号、账单状态、课程、学分、缴费状态（已缴/未缴）；金额可选。
- 数据以历史筛选行为范围，课行来自 `getApplicationBillDetail`。

**Non-Goals**

- 删除 fee roster 数据与写回。
- 汇总导出、欠学费列。

## Decisions

1. **双导出按钮**  
   - 「导出」= 既有申请列表。  
   - 「导出缴费」= 课级缴费明细（仅历史 Tab 有意义时可始终显示，无账单行则空提示）。

2. **数据源**  
   - 对当前 `rows`（历史筛选结果）中 `billStatus` 非 `none` 的申请调用 `getApplicationBillDetail`，展开 `all` 课行。  
   - 缴费状态：课行 `status === 'paid'` → 已缴，否则未缴（含 locked）。

3. **ExportModal**  
   - 字段穿梭；范围：全部筛选结果（本期可不做勾选申请，降低复杂度；若历史已有勾选则可复用）。  
   - 默认勾选核心列。

4. **菜单**  
   - 从 `courseRegistrationMenuItems` 过程管理 children 移除 `cr-fee-roster`。  
   - `developedPages` 保留，避免坏链；App.vue 路由暂留。

5. **金额**  
   - 课行：课程费；整单：SST、总费用（Σ课程费+SST），与账单明细合计语义一致。

6. **按申请合并单元格（§2）**  
   - 合并键：`applicationNo`（整单），非跨申请按学生合并。  
   - 合并列：学号、姓名、申请单号、账单、缴费状态、SST、总费用。  
   - 不合并：课程代码/名称、学分、课程费。  
   - `exportCourseRegistrationData` 支持 `mergeByKey` + `mergeFieldKeys`；同组仅首行写合并列值。

## Risks / Trade-offs

- [无名单页后种子/导入演示入口消失] → 可接受；后台仍可由审批/学生缴费写入。  
- [导出与旧名单条数不一致] → 预期差异：按申请账单展开，非全校超学分学生。

## Migration Plan

- 无数据迁移。刷新后侧栏无名单；历史用新导出。
