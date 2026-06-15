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
