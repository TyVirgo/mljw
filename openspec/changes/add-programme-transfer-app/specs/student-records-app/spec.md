## 修改需求

### 需求：Student Records 侧边栏扁平菜单
系统应提供与原型一致的扁平侧边栏菜单，包含六个顶级菜单项。

#### 场景：菜单项列表
- **当** 用户打开 Student Records Application
- **则** 侧边栏按顺序列出 Student Profile、Family Info、Programme Transfer、Deferment、Resumption、Withdrawal

#### 场景：Student Profile 导航
- **当** 用户在侧边栏选择 Student Profile
- **则** 系统展示 Student Profile 列表页

#### 场景：Programme Transfer 导航
- **当** 用户在侧边栏选择 Programme Transfer
- **则** 系统展示 Programme Transfer Application 列表页

#### 场景：未开发菜单页
- **当** 用户选择 Family Info、Deferment、Resumption 或 Withdrawal
- **则** 系统展示应用内建设中页，并提供返回 Student Profile 的操作
