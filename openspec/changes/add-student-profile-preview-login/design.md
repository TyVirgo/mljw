# 设计
## 流程

```
StudentProfileView [Preview]
    → enterStudentPreview(row)   // mockCurrentStudent.js
    → App navigate sr-movement-application-student
    → StudentMovementApplicationView applicantMode=student
         filterByCurrentStudent / getCurrentStudent
```

## Tooltip

- 文案：`studentProfile.previewAsStudentHint` — 说明以该学生账号登录并跳转到**学籍异动申请（学生端）**
- 实现：`Teleport to="body"` + `position: fixed`，hover/focus 时按按钮 `getBoundingClientRect` 定位在按钮下方
- 原因：`.table-wrap { overflow: auto }` 会裁剪 `position: absolute` 的 tooltip

## 不展示 Preview Banner

- 跳转后**不**在内容区顶部展示预览提示条或「退出预览」
- 管理员通过侧边栏自行导航；mock 当前学生保持为 Preview 所选 studentId，直至再次切换或刷新

## 不改动

- 侧边栏 IA（Preview 期间仍可见管理菜单，Demo 阶段）
- 真实 SSO / 审计日志（后续替换 mock 模块）
