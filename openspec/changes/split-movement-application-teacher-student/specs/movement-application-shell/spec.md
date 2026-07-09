## 新增需求

### 需求：双异动申请侧边栏入口
系统应在学籍异动下暴露两个并列侧边栏入口，分别对应管理端代办与学生自助异动申请。

#### 场景：管理端菜单标签
- **当** 用户查看学籍异动下的学生档案侧边栏
- **则** 叶子菜单项在中文界面显示标签 **学籍异动申请（管理端）**（英文：**Status Change Application (Management)**）

#### 场景：学生端菜单标签
- **当** 用户查看学籍异动下的学生档案侧边栏
- **则** 并列叶子菜单项显示学生自助学籍异动申请标签

#### 场景：Distinct 页面标识
- **当** 用户导航至任一异动申请入口
- **则** 系统分别使用 `sr-movement-application-teacher` 与 `sr-movement-application-student` 作为页面标识

### 需求：壳层向嵌入视图传递申请方模式
系统应将 `applicantMode` 为 `teacher` 或 `student` 从异动申请壳层传递给四个嵌入异动视图。

#### 场景：管理端壳层模式
- **当** 用户打开管理端异动申请菜单入口
- **则** 壳层以 `applicantMode` 为 `teacher` 渲染，并传递给 `ProgrammeTransferView`、`DefermentView`、`ResumptionView`、`WithdrawalView`

#### 场景：学生端壳层模式
- **当** 用户打开学生端异动申请菜单入口
- **则** 壳层以 `applicantMode` 为 `student` 渲染，并传递给全部四个嵌入视图

#### 场景：Tab 行为不变
- **当** 用户在任一门户内切换 Tab
- **则** Tab 键、默认 Tab 与嵌入视图复用行为与单一门户壳层相同

## 修改需求

### 需求：异动申请壳层托管四个嵌入视图
系统应在单一父壳层组件内嵌入现有 `ProgrammeTransferView`、`DefermentView`、`ResumptionView`、`WithdrawalView`，不重复业务逻辑，适用于管理端与学生端两个门户入口。

#### 场景：每个门户入口单一壳层组件
- **当** 应用渲染管理端或学生端学籍异动申请
- **则** 同一壳层组件管理 Tab 状态，且每次仅渲染一个嵌入异动视图

#### 场景：无重复数据模块
- **当** 壳层在任一门户嵌入异动视图
- **则** 各 Tab 复用现有数据层文件，不 fork 新 mock 存储
