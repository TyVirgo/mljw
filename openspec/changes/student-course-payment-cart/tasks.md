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
