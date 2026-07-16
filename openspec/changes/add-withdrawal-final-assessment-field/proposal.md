## Why

退学申请 SECTION II 需增加「是否完成本学期期末考核」必填项，并按产品要求调整字段顺序与提示；选 Yes 时应用「期末出勤日 = 本学期 Exam week 最后一天」的业务约定，同时允许用户再改日期。

## What Changes

- 新增必填下拉 `Will you complete Final Assessment?`（Yes / No），标签旁常显 tooltip（完整英文提示 + 中文）
- `Last Date of Attendance` 标签旁常显 tooltip：说明选 Yes 时该日期对应本学期 Exam week 最后一天
- 字段顺序调整为：
  1. Current Whereabout | Destination after Leaving  
  2. Will you complete Final Assessment? | Last Date of Attendance  
  3. Main Reason for Withdrawal  
  4. Detailed Reason  
- 选 **Yes** 时：自动填入本学期 Exam week 最后一天（mock），日期控件仍可二次修改  
- 选 **No** 或不选：不清空已有日期（除非未填）；不锁定控件  
- 详情/维护视图同步展示该字段

## Non-goals

- 不对接真实校历 / 考试周 API  
- 选 Yes 时不锁定、不禁止用户改日期  
- 不改退学其它 Section 结构

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `withdrawal-app`：SECTION II 增加期末考核确认字段、提示与 Yes 自动填日期行为

## Impact

- `WithdrawalFormModal.vue`、`withdrawals.js`（字段 + 校验 + mock 考试周末日）
- 详情：`WithdrawalDetailModal.vue`、`MovementDetailContent.vue`
- i18n：`en.js` / `zh.js`
