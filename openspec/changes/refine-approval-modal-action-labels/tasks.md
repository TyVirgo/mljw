## 1. i18n

- [x] 1.1 `zh.js` / `en.js` 新增 `approvalModal.action.approved|rejected|updateRequired`
- [x] 1.2 确认 **不修改** `zh-flat.js` 中全局 `Approved` / `Rejected`（保护状态筛选与徽章）

## 2. 公共 helper（推荐）

- [x] 2.1 新增 `getApprovalActionLabel(action, t)`（或 composable），映射三档 action → i18n key
- [x] 2.2 单元/手工：三 action 值返回预期中文

## 3. 异动审核弹框

- [x] 3.1 `MovementApprovalModal.vue`：Action 单选改用 `getApprovalActionLabel(opt)` 替代 `tr(opt)`

## 4. 课程审核弹框

- [x] 4.1 `CourseApprovalModal.vue`：同上

## 5. 验证

- [x] 5.1 学籍异动审批：Pending → Approve/Review → 弹框三选项为 通过 / 不通过 / 驳回
- [x] 5.2 新课程审批、课程变更审批：同上
- [x] 5.3 详情抽屉 footer Review：同上
- [x] 5.4 回归：列表 Status 徽章仍为 已通过/已驳回 等（未误改）
- [x] 5.5 回归：选 不通过 / 驳回 仍要求 Comments；选 通过 按原规则
- [x] 5.6 Node 18+ `npm run build` 通过
