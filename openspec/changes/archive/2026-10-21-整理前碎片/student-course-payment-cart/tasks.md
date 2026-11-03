## 1. 数据层

- [x] 1.1 新增 `studentCoursePaymentStore.js`：CartLine、待缴/已缴列表、单笔在途订单（15 分钟 expiresAt）、创建/过期/模拟支付 API
- [x] 1.2 新增 demo seed：待缴 ≥5 行、已缴 ≥2 行；localStorage 持久化订单与已付
- [x] 1.3 支付成功回写：匹配则更新加退 `billStatus=paid`、缴费名单行已缴
- [x] 1.4 灌种/支付后 `upsertFeeRosterFromPaymentLines`

## 2. 页面与组件

- [x] 2.1 `StudentCoursePaymentView.vue`：三 Tab、左列表勾选、右结算栏
- [x] 2.2 `StudentPaymentCodeModal.vue`：缴费码/倒计时/完成/关闭（不取消订单）/过期重下单
- [x] 2.3 进行中订单锁定行进待支付；关窗可「继续支付」
- [x] 2.4 页眉学生信息；行金额构成；缴费截止文案

## 3. 壳层接入

- [x] 3.1 `crs-payment` 菜单与 developedPages
- [x] 3.2 App / i18n / briefs

## 4. 缴费名单汇总角色

- [x] 4.1 未缴费仅导出；去掉新增/同步

## 5. 验收

- [x] 5.1 待缴≥5、分付合计、15 分钟倒计时、已缴≥2、回写不报错
- [x] 5.2 缴费名单无新增/同步；课程缴费页可见必要信息

## 6. 待支付 Tab

- [x] 6.1 store 拆分 `cartUnpaidLines` / `pendingPayLines`
- [x] 6.2 三 Tab：待支付常驻空态 + 订单摘要 + 继续支付
- [x] 6.3 过期自动作废回待缴费
- [x] 6.4 更新 proposal/design/spec

## 7. 结算体验打磨（增量）

- [x] 7.1 去掉「申请缴费」角标；勾选与课名同行对齐
- [x] 7.2 结算栏不外显单价正文；侧栏加宽；明细单行不换行；标题旁保留 tip
- [x] 7.3 「结算」后仍停待缴费并弹码；关闭≠取消订单；无手动取消，到期自动作废
- [x] 7.4 「缴至」→「缴费截止」；更新 OpenSpec

## 8. 缴费码弹窗三态（增量）

- [x] 8.1 弹窗布局自适应，修复金额/倒计时裁切
- [x] 8.2 「模拟完成缴费」→ checking → success → 确定关窗
- [x] 8.3 更新 proposal/design/spec

## 9. 多订单并存 + 待支付按单分组（增量）

- [x] 9.1 store：`paymentOrders[]`；可并存多笔 open；按单过期/确认；兼容旧单例持久化
- [x] 9.2 待缴费：有在途订单仍可勾选结算新开单
- [x] 9.3 待支付：按订单分组（单号/小项/合计/倒计时/继续支付）；计数为订单笔数
- [x] 9.4 弹窗按指定 orderId 模拟完成缴费
- [x] 9.5 更新 proposal/design/spec/i18n

## 10. 查询卡住修复 + 取消订单（增量）

- [x] 10.1 修复缴费码 checking 卡住（watch 不重置；confirm try/catch；lineIds 容错）
- [x] 10.2 待支付订单组：继续支付/取消订单按钮样式一致；取消需确认
- [x] 10.3 更新 proposal/design/spec/i18n

## 11. 申请整单缴费（增量）

- [x] 11.1 更新 proposal/design/spec：整单勾选、多单→一笔订单、去掉部分已缴
- [x] 11.2 store：账单键聚合 API；下单自动扩齐整单；seed 多课整单；升 STORAGE_KEY
- [x] 11.3 `StudentCoursePaymentView`：待缴费整单卡片勾选 + 明细；结算按整单
- [x] 11.4 审批账单 demo 去掉部分已缴；明细仍可看课行
- [x] 11.5 i18n 文案（整单/禁止拆付）与验收

## 12. 结算栏与整单标题打磨（增量）

- [x] 12.1 更新 proposal/design/spec：去分组名、tip 合并、明细上汇总下、标题模板
- [x] 12.2 待缴费课行去掉 sectionName；整单头用统一标题模板
- [x] 12.3 结算栏：单 tip；明细在上汇总在下；整单行同模板
- [x] 12.4 i18n（合并 tip、billTitle 模板）

## 13. 审批账单明细列与 SST（增量）

- [x] 13.1 更新 proposal/design/spec
- [x] 13.2 `getApplicationBillDetail`：去重、剥 SST、补类型、合计字段
- [x] 13.3 `AddDropBillDetailDrawer`：列调整 + 合计文案
- [x] 13.4 i18n；demo item 补类型便于展示

## 14. 合计右移 + 已缴截止/类型（增量）

- [x] 14.1 更新 proposal/design
- [x] 14.2 学生缴费整单头：左标题、右「合计费用」
- [x] 14.3 账单明细：已缴显示截止；剩余时间→已缴费；demo 补截止与类型

## 15. 待支付订单卡打磨（增量）

- [x] 15.1 合计右移「合计费用」；倒计时改名；短提示与倒计时同行；去掉关窗长文案

## 16. 课行去逐课 SST（增量）

- [x] 16.1 课行构成仅课程费；右侧金额用 feeAmount；SST 留结算合计

## 17. 整单头单行 + 待支付按申请分块（增量）

- [x] 17.1 待缴费头四要素同行；待支付嵌套申请块；门数左/倒计时中/合计右

## 18. 待支付订单总结含 SST（增量）

- [x] 18.1 总结行与课列右对齐；按钮独立一行；总结含课程费/SST/合计费用

## 19. 总结不换行 + demo 多门整单（增量）

- [x] 19.1 待支付总结 nowrap；seed 含 1/2/3 门整单；升 v5
