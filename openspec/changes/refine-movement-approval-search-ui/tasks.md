## 1. 默认角色常量

- [x] 1.1 在 `movementApprovalEngine.js`（或同级常量文件）导出 `DEFAULT_APPROVER_ROLE = 'Pending Review'`
- [x] 1.2 `MovementApprovalView.vue` 使用该常量替代 `ref('Pending Review')` 与 Role 下拉

## 2. 移除 Role 选择器

- [x] 2.1 删除 `role-bar` 模板块（label + select）
- [x] 2.2 删除 `approverRoleOptions` import、`watch(currentRole)` 及相关样式
- [x] 2.3 `MovementApprovalReviewView` 仍接收 `:current-role="currentRole"`（常量）

## 3. 搜索区自适应布局

- [x] 3.1 合并 5 个搜索字段至单一 `.search-fields` 栅格（移除 secondary 展开行）
- [x] 3.2 删除 `searchExpanded`、`toggleSearchExpanded`、Collapse/More 按钮
- [x] 3.3 CSS：`grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))` + 右侧 Search/Reset 固定操作列
- [x] 3.4 Tab 栏置于搜索区上方（与图示一致）

## 4. i18n 清理（可选）

- [x] 4.1 确认无 UI 引用 `movementApproval.currentRole`（可保留 key 或删除）

## 5. 验证

- [x] 5.1 冒烟：页面无 Current approver role；Tab/列表/审批仍按 Pending Review 分桶
- [x] 5.2 冒烟：5 搜索字段常显；缩放窗口字段自适应换行
- [x] 5.3 `npm run build` 通过

## 6. Tab 顺序与角标

- [x] 6.1 `APPROVAL_TABS` 顺序改为 pending → submitted → history
- [x] 6.2 仅 pending Tab 渲染 `tab-count` 角标

## 7. 表格列与状态展示

- [x] 7.1 修复 Status badge CSS（引入 status-* 背景色）；`statusLabel` 补 `Expired`
- [x] 7.2 移除异动原因列；新增申请日期列 + i18n
- [x] 7.3 `movementApprovalQueue.js`：`formatApprovalApplicationDate(sourceKey, item)` + `applicationDateDisplay`
- [x] 7.4 历史 Tab 才显示「是否实施」列；`formatImplementedYn`：Implemented→Y，其余→N
- [x] 7.5 动态 colspan；export CSV 列同步

## 8. 搜索精简

- [x] 8.1 移除异动原因搜索项；`createEmptySearch` / `filterBySearch` 去掉 `movementReason`
- [x] 8.2 搜索区改为 4 字段自适应栅格

## 9. Mock seed

- [x] 9.1 历史 Tab 部分 Approved 记录设 `implemented: 'Implemented'`（展示 Y）；其余保持 N
- [x] 9.2 确认三 Tab status 分布合理（非 Draft，与分桶一致）

## 10. 验证

- [x] 10.1 冒烟：Tab 顺序/角标；pending/submitted 无是否实施列；history 有 Y/N
- [x] 10.2 冒烟：状态列可见；申请日期格式与申请列表一致
- [x] 10.3 `npm run build` 通过

## 11. 搜索增加专业代码

- [x] 11.1 `movementApprovalQueue.js`：`normalizeQueueItem` 加 `programmeCode`；`filterBySearch` 支持 programmeCode
- [x] 11.2 `MovementApprovalView.vue`：`createEmptySearch` + 模板（学年学期旁专业代码）
- [x] 11.3 i18n：`movementApproval.search.programmeCode`
- [x] 11.4 冒烟 + `npm run build` 通过

## 12. 审批详情 footer 审批 + Modal

- [x] 12.1 四 `*DetailModal.vue`：`showApprovalAction` prop；footer `[审批]` 在 `[关闭]` 左侧；`emit('approve')`
- [x] 12.2 `MovementApprovalReviewView.vue`：删除 `approval-section` 及内联审批 state/styles
- [x] 12.3 ReviewView：Pending 时传 `showApprovalAction`；挂载 `MovementApprovalModal`；确认后 `applyMovementDecision` + `emit('decided')`
- [x] 12.4 i18n：审批按钮文案（`movementApproval.approve` 或复用 `Review`）
- [x] 12.5 冒烟：Pending View → footer 审批 → Modal 提交 → 回列表；Submitted/History 无审批按钮；Recall 仍可用
- [x] 12.6 `npm run build` 通过
