## 新增需求

### 需求：管理端列表撤销 In Progress 异动申请
系统应在异动查询、维护与审批列表中，对状态为 In Progress 的记录提供 Cancel（撤销）操作；与学生端 Early Cancel 规则并存，不修改 add-*-app 中学生撤销场景。

#### 场景：In Progress 显示撤销
- **当** 管理端用户查看 In Progress 记录的列表 Actions
- **则** 显示「撤销」/ Cancel 链接按钮，并附带说明性 tooltip

#### 场景：非 In Progress 不显示撤销
- **当** 记录为 Draft、Update Required 或终态
- **则** 管理端列表不提供 Cancel

#### 场景：确认后归档
- **当** 管理端用户点击 Cancel 并在确认弹框中确认
- **则** 申请变为 Cancelled、归档，approvalLog 记录 AC 撤销

#### 场景：入口仅限列表
- **当** 用户从管理端打开申请详情抽屉
- **则** 抽屉 Footer 不提供 Cancel（Cancel 仅在列表 Actions）
