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

1. **CartLine + store**（已实现）— 保持。
2. **一页结算 + 缴费码弹窗**（已实现）— 保持；P0 增强信息密度。
3. **缴费名单角色**  
   未缴费工具条只留「导出」。去掉新增按钮、同步按钮及相关弹窗/确认。页头 hint 改为「汇总自学生课程缴费；可导出；已缴费可用导入回写」。
4. **汇总对齐**  
   `ensureStudentCoursePaymentSeeded` / 支付成功时调用 `upsertFeeRosterFromPaymentLines`，按 `studentId+courseCode+sourceRef` 写入/更新 `feeRosterRows`（含 amount 映射到 billable credits）。
5. **P0 UI（修订）**  
   - 页眉：学号、姓名、专业、选课学期  
   - 行：申请单号、`billableCredits × rate = amount`；**不**展示「申请缴费」来源角标  
   - 截止文案：`缴费截止`（非「缴至」）  
   - 结算栏：**不**外显单价说明正文；标题旁保留 `?` tooltip（`feeRateTip`）；侧栏加宽，明细一行一门课；勾选与课名同行对齐

6. **三 Tab 分区（§增量）**  
   - **待缴费**：仅 `status=unpaid`，可勾选 +「结算」（**不因已有在途订单而禁用**）  
   - **待支付**：按 **open 订单分组**；每组展示订单编号、小项课程、合计、倒计时、**「继续支付」+「取消订单」**（样式一致的按钮组）；Tab 计数为在途订单笔数；空态 `(0)`  
   - **已缴费**：不变  
   - 「结算」每次生成 **新订单**（独立 `orderNo` / 缴费码 / TTL）；成功后仍停待缴费并弹该单缴费码  
   - 缴费码弹窗「关闭」**MUST NOT** 取消订单；待支付订单组 **MAY** 手动取消（`cancelPaymentOrder`）；到期由 `expirePaymentOrderIfNeeded` **按单**作废并解锁该单课程回待缴费

7. **缴费码弹窗体验（§增量）**  
   - 布局自适应，避免金额/倒计时行高裁切  
   - 主按钮文案：**模拟完成缴费**  
   - 点击后弹窗内三态：`code` → `checking`（约 1.2s 转圈）→ `success`；点「确定」再关窗并切已缴费  
   - `confirmMockPayment(orderId)` 只结清指定订单  
   - **checking / success 期间 MUST NOT 因订单 watch 重置 phase 或清除查询定时器**；查询回调 MUST try/catch，失败回到 code 态

8. **多订单模型（§增量）**  
   - Store：`paymentOrders[]`（替代单例 `activeOrder`）；兼容旧 localStorage 单订单迁移  
   - 同一课程行同时只属于一笔 open 订单（locked 后不在待缴费）

## Risks / Trade-offs

- [名单仍有历史 seed 学生] → 演示可接受；新增入口关闭后不再人工扩张。  
- [导入已缴费与学生端已付双通道] → 保留导入作财务兜底。  
- [手动取消] → 误取消风险；取消前 confirm；与「关闭弹窗≠取消」并存，文案需区分。

## Migration Plan

- 前端发布即生效；无数据迁移。

## Open Questions

- 无。
