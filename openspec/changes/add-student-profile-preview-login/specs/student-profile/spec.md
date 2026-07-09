## 新增需求

### 需求：学生基本信息 Preview 进入学生端
系统应在学生基本信息列表操作列提供 Preview，使管理员以所选学生身份进入学生异动申请（学生端）。

#### 场景：Preview 按钮与 tooltip
- **当** 用户查看学生基本信息列表操作列
- **则** 每行展示 Preview 按钮，hover/focus 时 tooltip 完整展示说明：以该学生账号登录并跳转到学籍异动申请（学生端）（不被表格容器裁剪）

#### 场景：点击 Preview 切换身份并跳转
- **当** 用户点击某行的 Preview
- **则** 系统将 mock 当前登录学生设为该行 studentId，并导航至 `sr-movement-application-student`
- **且** 不展示 Preview 顶栏提示条

#### 场景：学生端列表与新建行为
- **当** Preview 跳转完成后
- **则** 学生异动申请列表与新建表单按该学生身份运行（与既有 `applicantMode=student` 规则一致）
