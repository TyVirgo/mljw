## 新增需求

### 需求：门户展示可用的学籍管理卡片
系统应展示学籍管理门户卡片，且不显示「建设中」徽章。

#### 场景：中文门户标签
- **当** 用户以中文语言查看 Academic Portal
- **则** 学籍管理卡片标题显示「学籍管理」

#### 场景：英文门户标签
- **当** 用户以英文语言查看 Academic Portal
- **则** 学籍管理卡片标题显示 "Student Status Management"

#### 场景：卡片可用
- **当** 用户在门户首页查看学籍管理卡片
- **则** 卡片不显示建设中徽章

### 需求：从门户打开 Student Records Application 壳层
系统应支持用户点击学籍管理卡片后，从门户进入独立的 Student Records 管理壳层。

#### 场景：从门户打开
- **当** 用户在 Academic Portal 点击学籍管理卡片
- **则** 系统离开门户视图，展示 Student Records Application 布局（含顶栏、侧边栏、面包屑与主内容区）

#### 场景：默认落地页
- **当** 用户从门户打开 Student Records Application
- **则** 主内容区展示 Student Profile 列表页

#### 场景：返回门户
- **当** 用户在 Student Records Application 顶栏点击「返回门户」
- **则** 系统返回 Academic Portal 首页

### 需求：Student Records Application 展示模块标题
系统应在应用顶栏展示 Student Records 模块名称。

#### 场景：顶栏模块标题
- **当** 用户处于 Student Records Application 内
- **则** 顶栏标题显示本地化的 Student Status Management 模块名（非 Basic Data）

### 需求：Student Records 侧边栏扁平菜单
系统应提供与原型一致的扁平侧边栏菜单，包含六个顶级菜单项。

#### 场景：菜单项列表
- **当** 用户打开 Student Records Application
- **则** 侧边栏按顺序列出 Student Profile、Family Info、Programme Transfer、Deferment、Resumption、Withdrawal

#### 场景：Student Profile 导航
- **当** 用户在侧边栏选择 Student Profile
- **则** 系统展示 Student Profile 列表页

#### 场景：未开发菜单页
- **当** 用户选择 Family Info、Programme Transfer、Deferment、Resumption 或 Withdrawal
- **则** 系统展示应用内建设中页，并提供返回 Student Profile 的操作

### 需求：Student Records 应用与 Basic Data 壳层样式一致
系统应复用 Basic Data 应用的相同管理壳层组件与视觉模式。

#### 场景：共享布局组件
- **当** 用户处于 Student Records Application 内
- **则** 布局使用与 Basic Data 相同的 `HeaderBar`、`Sidebar`、`PageBreadcrumb` 组件，并加载 student-records 菜单配置

#### 场景：侧边栏激活态样式
- **当** 用户在 Student Records 侧边栏选择菜单项
- **则** 激活项使用与 Basic Data 侧边栏项相同的高亮样式

### 需求：Student Records 应用与 Basic Data 菜单隔离
系统不得在 Student Records Application 中展示 Basic Data 菜单项。

#### 场景：侧边栏隔离
- **当** `appView` 为 `student-records`
- **则** 侧边栏仅渲染 `studentRecordsMenu.js` 中的 student-records 菜单项，不渲染 `menu.js` 中的项
