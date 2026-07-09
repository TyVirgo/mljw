# 学生基本信息 Preview 以学生身份进入学生端

## 背景
学籍管理人员需要在维护学生档案时，快速以某学生账号进入学生自助端，验证异动申请等学生视角体验。

## 变更内容
- 学生基本信息列表操作列增加 **Preview** 按钮（带 tooltip）
- 点击后以该行 `studentId` 切换 mock 当前登录学生，并跳转 **学籍异动申请（学生端）**（`sr-movement-application-student`）
- **不展示** Preview 顶栏提示条；页面布局保持与改 Preview 前一致，仅保留跳转效果
- Preview tooltip 完整可见，不被表格滚动容器裁剪
- 扩展 `mockCurrentStudent.js`：可切换 `currentStudentId`（SSO 接入时仍只替换此模块）

## 影响
- `StudentProfileView.vue` — Preview 按钮 + Teleport tooltip
- `mockCurrentStudent.js` — enter preview（切换 currentStudentId）
- `App.vue` — 跳转（无 Preview Banner）
- `i18n` — 按钮与 tooltip 文案
