## 修改需求

### 需求：Student Records 侧边栏扁平菜单
系统应提供与原型一致的扁平侧边栏菜单，包含六个顶级菜单项。

#### 场景：菜单项列表
- **当** 用户打开 Student Records Application
- **则** 侧边栏按顺序列出 Student Profile、Family Info、Programme Transfer、Deferment、Resumption、Withdrawal

#### 场景：Deferment 导航
- **当** 用户在侧边栏选择 Deferment
- **则** 系统展示 Deferment History 列表页

#### 场景：未开发菜单页
- **当** 用户选择 Family Info
- **则** 系统展示应用内建设中页，并提供返回 Student Profile 的操作

### 需求：Deferment 列表对齐学籍流转日志模式
系统应将 Programme Transfer 使用的流转日志外置模式应用于 Deferment 模块。

#### 场景：Deferment 参与四模块日志一致性
- **当** 用户对比 Deferment 与 Programme Transfer、Resumption、Withdrawal 列表页
- **则** 各模块均在每行通过共享 `ApprovalLogModal` 组件暴露 Workflow Log
- **且** 四个模块均不在详情 Modal 内嵌 approval log
