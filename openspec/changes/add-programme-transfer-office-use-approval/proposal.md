# 转专业 Section VII 教务办标记

## 背景
Section VII 仅供审批者在审批时标记，不应出现在学生申请端；字段文案与学生 Section II 一致，默认值来自学生选择与审批当日。

## 变更内容
- 申请 FormModal 移除 Section VII
- 审批详情可编辑 Section VII（默认值：1st choice / startSemester / 当天）
- 已批准详情只读展示
- Section VII 视觉与上下 Section 一致（`section-bar` + `detail-grid` / `form-grid`）
- 审批提交写入 admin 字段

## 影响
- `ProgrammeTransferOfficeUseSection.vue`、FormModal、DetailDrawer、DetailModal、MovementDetailContent、`programmeTransfers.js`
