## 1. Helper

- [x] 1.1 创建 `src/utils/formatMovementDate.js`（`formatMovementDate`、`formatMovementDateOrEmpty`）

## 2. 四 Tab 申请 data 层

- [x] 2.1 `deferments.js`：`formatApplicationDateDisplay`、`formatDefermentListDate` 委托 helper
- [x] 2.2 `programmeTransfers.js`：`formatTransferListDate` 委托 helper
- [x] 2.3 `withdrawals.js`：`formatApplicationDateDisplay`、`formatWithdrawalListDate` 委托 helper
- [x] 2.4 `resumptions.js`：`formatApplicationDateDisplay`、`formatResumptionListDate` 委托 helper

## 3. 审批 / 维护 / 查询

- [x] 3.1 `movementApprovalQueue.js`：`formatApprovalApplicationDate` 使用 helper
- [x] 3.2 `movementMaintenanceFields.js`：`formatMovementDateDisplay` 使用 helper
- [x] 3.3 `movementApprovalEngine.js`：log `dateTime` 写入 `YYYY-MM-DD`

## 4. UI 与 Export

- [x] 4.1 四 Tab `*FormModal.vue` / `*DetailModal.vue`：只读日期展示确认走 helper
- [x] 4.2 `ApprovalLogModal.vue`：`dateTime` 列 `formatMovementDate`
- [x] 4.3 `exportMovementQueryExcel.js`、`exportMovementApprovalExcel.js`：日期列 helper
- [x] 4.4 （若有）统计 export 日期列 — 无日期列，跳过

## 5. 验证

- [x] 5.1 冒烟：申请列表 / 审批列表 / 维护异动日期均为 `YYYY-MM-DD`
- [x] 5.2 冒烟：Form/Detail 申请日期、Approval log 为 `YYYY-MM-DD`
- [x] 5.3 冒烟：Export xlsx 日期列格式一致
- [x] 5.4 `npm run build` 通过

## 6. §17 转专业 Section VII 申请侧置灰

- [x] 6.1 `ProgrammeTransferFormModal.vue`：Section VII 三个控件 `disabled` + 置灰样式 class
- [x] 6.2 确认 Submit / Save Draft 不校验 Section VII；payload 不写入申请侧 admin 字段
- [x] 6.3 冒烟：新建/编辑表单 Section VII 可见不可点；Detail / 审批页无回归

## 7. §18 生效学期列统一 YYYY/MM

- [x] 7.1 新增 `formatEffectiveSession` helper（`src/utils/`）
- [x] 7.2 `movementApprovalQueue.js`：`extractEffectiveSession` 出口经 formatter
- [x] 7.3 `exportMovementQueryExcel.js`、`exportMovementApprovalExcel.js`：effectiveSession 列 formatter
- [x] 7.4 （可选）seed `effectiveSession` 统一为 YYYY/MM — 现有 seed 已为 YYYY/MM，无需改动
- [x] 7.5 冒烟：审批/维护/查询生效学期列无 YYYY-MM-DD 混排；退学 `2025-09-20` → `2025/09`
- [x] 7.6 `npm run build` 通过

## 8. §19 展示格式 dd.Mmm.YYYY

- [x] 8.1 `formatMovementDate.js`：输出 `dd.Mmm.YYYY`；新增 `formatMovementDateIso`、`parseMovementDate`；兼容 ISO / DD.MM.YYYY HH:mm / DD MMM YYYY
- [x] 8.2 `movementApprovalEngine.js`：新 log `dateTime` 写入 `formatMovementDateIso`
- [x] 8.3 冒烟：四 Tab 列表「日期」、审批申请日期、Approval log、Export 均为 `29.Sep.2025` 形式
- [x] 8.4 `npm run build` 通过

## 9. §20 学年学期 YYYY/02|04|09

- [x] 9.1 新增 `normalizeAcademicSession.js`（normalize / compare / validateAcademicSessionOrder）
- [x] 9.2 `formatEffectiveSession`、`movementApprovalQueue.extractApplicationSession` / `extractEffectiveSession` 委托 normalize；移除 dateOfApplication 回退
- [x] 9.3 `movementApplicationSearch`、`movementMaintenanceFields.extractIntake`、`movementApplicationSession` 统一 normalize
- [x] 9.4 四 Tab 下拉选项与 seed 修正非法月（如 2025/01→2025/02）；补全缺失 applicationSession
- [x] 9.5 四 Tab `validate*Form` 增加 intake ≤ applicationSession ≤ effectiveSession 校验
- [x] 9.6 `npm run build` 通过
