## Context

学生端已有课程缴费购物车闭环。管理端缴费名单原支持新增/同步补录；现改为只读汇总+导出，数据口径对齐学生课程缴费。学生缴费页补齐 P0 信息展示。

## Goals / Non-Goals

**Goals:**

- 学生缴费：分付、15 分钟缴费码、Demo 量、P0 页眉/金额构成/费率 tip。
- 缴费名单未缴费：仅查询 + 导出；去掉新增与同步。
- 支付/灌种时尽量把学生缴费行写入或更新缴费名单明细，供聚合。

**Non-Goals:**

- 真实支付网关。
- 删除已缴费 Tab 的财务导入兜底。
- 全量历史名单种子迁移。

## Decisions

1. **CartLine + store**（已实现）— 保持课行为金额原子；**结算粒度改为申请整单**。
2. **一页结算 + 缴费码弹窗**（已实现）— 保持；P0 增强信息密度。
3. **缴费名单角色**  
   未缴费工具条只留「导出」。去掉新增按钮、同步按钮及相关弹窗/确认。页头 hint 改为「汇总自学生课程缴费；可导出；已缴费可用导入回写」。
4. **汇总对齐**  
   `ensureStudentCoursePaymentSeeded` / 支付成功时调用 `upsertFeeRosterFromPaymentLines`，按 `studentId+courseCode+sourceRef` 写入/更新 `feeRosterRows`（含 amount 映射到 billable credits）。
5. **P0 UI（修订）**  
   - 页眉：学号、姓名、专业、选课学期  
   - 行：申请单号、`billableCredits × rate = amount`；**不**展示「申请缴费」来源角标  
   - 截止文案：`缴费截止`（非「缴至」）  
   - 结算栏：**不**外显单价说明正文；标题旁保留 `?` tooltip（`feeRateTip`）；侧栏加宽；勾选与整单标题同行对齐

6. **三 Tab 分区（§增量）**  
   - **待缴费**：仅 `status=unpaid`，**按申请整单勾选** +「结算」（**不因已有在途订单而禁用**）  
   - **待支付**：按 **open 订单分组**；每组展示订单编号、小项课程、合计、倒计时、**「继续支付」+「取消订单」**；Tab 计数为在途订单笔数  
   - **已缴费**：可按申请分组或列课行明细；同一申请 MUST NOT 出现部分课已缴、部分仍待缴  
   - 「结算」每次生成 **新订单**；成功后仍停待缴费并弹该单缴费码  
   - 关闭缴费码 **MUST NOT** 取消订单；可手动取消或到期按单作废

7. **缴费码弹窗体验（§增量）** — 保持三态与容错。

8. **多订单模型（§增量）** — `paymentOrders[]`；同一课程行同时只属于一笔 open 订单。

9. **申请整单缴费（§11）**  
   - **账单键**：`applicationNo || sourceRef || line.id`  
   - 待缴费 UI：按账单键聚合成「整单卡片」，卡内展示全部课行明细（含 SST 构成）；勾选只在卡级  
   - **可勾多张整单 → `createPaymentOrder` 一笔订单**（订单 `lineIds` 含所选整单的全部 unpaid 行）  
   - `createPaymentOrder` / `createPaymentOrderFromBills`：若传入部分行，MUST 自动扩齐同账单键下全部 unpaid 行（禁止拆付）  
   - 支付成功：所选整单全部课行 → `paid`，申请 `billStatus=paid`  
   - Demo seed：至少一张多课整单；升持久化 key 避免旧分付缓存干扰  
   - 审批 `ensureRichBillDetailLines`：**去掉**同申请「部分已缴」extras；账单明细仅整单待缴或整单已缴两种演示

10. **结算栏与整单标题打磨（§12）**  
    - 待缴费课行 meta：**不**展示 `sectionName` / 分组名称  
    - 结算标题旁：**一个** tip，合并学分单价与 SST 说明  
    - 结算栏 DOM 顺序：订单明细列表 → 汇总 dl →「结算」按钮；多选整单明细在上方累加，汇总始终在按钮正上方  
    - 整单标题模板（列表头与结算明细行）：`申请单号 {no} {n} 门课 {amount}`（金额含在同行）

11. **审批账单明细列与 SST（§13）**  
    - 表头截止/剩余保留；表内 **删除**「缴费截止」列（整单缴费，非按课）  
    - 列：课程代码 | 课程名称 | 课程类型 | 应收学分 | 费用（待缴）；已缴表：代码 | 名称 | 类型 | 费用 | 支付时间 | 订单号  
    - 课程类型：`formatUnifiedCourseCategoryLabel`（由申请 item / 行字段解析）  
    - SST：**不**作为课程行；合计文案含「课程费；SST（若有）；一共应付」  
    - `getApplicationBillDetail`：同申请按 `courseCode` 去重（优先 `sourceRef===app.id`）；剥离 SST 行；返回课行 + `sstAmount` / 合计字段

12. **整单头右对齐合计 + 已缴截止/类型补全（§14）**  
    - 学生待缴费/已缴费整单头：左 `申请单号 {no} {n} 门课`，右 `合计费用：{amount}`  
    - 账单明细：`billStatus=paid` 时剩余时间文案为「已缴费」；页眉截止取 `app.paymentDueAt`（含已缴）  
    - `ensureHistoryPaymentDueDemo`：pending **与 paid** 缺截止时均补值  
    - 有费用的审批 items / admin-bill 行：一律补 `type` +（GE/ME）`schoolElectiveCategory`，明细禁止「—」

13. **待支付订单卡（§15）**  
    - 元信息行：左课程门数，右 `合计费用：{amount}`  
    - 下一行合并：`请在 {minutes} 分钟内完成缴费，订单剩余缴费时间: {mm:ss}`  
    - 列表 **不** 再展示关窗/取消/作废长提示（缴费码弹窗仍可保留 `codeHint`）

14. **SST 仅合计展示（§16）**  
    - 课行 meta：仅 `学分 × 单价 = 课程费`；**不**附逐课 SST/应付  
    - 课行右侧金额：`feeAmount`（课程费）  
    - SST 仅结算栏「SST 合计」与整单/订单「合计费用 / 应付合计」（按总额计税）

15. **整单头单行 + 待支付申请分块（§17）**  
    - 待缴费头：勾选 | 申请单号+门数 | 缴费截止 | 合计费用（同行）  
    - 待支付：订单下行左「课程门数」、中倒计时提示、右「合计费用」；正文按申请嵌套小块（单号+门数+该单合计+课行），禁止扁平「含申请 A·B」一行

16. **总结不换行 + demo 门数混排（§19）**  
    - `.pay-order-total`：`white-space: nowrap`，去掉易挤断的 max-width  
    - seed：至少 1 张 3 门、2 张 2 门、少量 1 门；STORAGE_KEY → v5

## Risks / Trade-offs

- [名单仍有历史 seed 学生] → 演示可接受；新增入口关闭后不再人工扩张。  
- [导入已缴费与学生端已付双通道] → 保留导入作财务兜底。  
- [手动取消] → 误取消风险；取消前 confirm。  
- [旧 localStorage 分付数据] → 升 STORAGE_KEY；进入页按整单重新聚合。

## Migration Plan

- 前端发布即生效；升缴费 store 持久化版本号，旧缓存丢弃重灌。

## Open Questions

- 无。
