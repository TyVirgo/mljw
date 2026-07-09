## 修改需求

### 需求：管理端撤销入口

系统应在 Movement Application (Admin) 列表与 Movement Maintenance 列表中，为 In Progress 申请提供 AC 撤销（撤销）操作。Query 与 Approval 列表不应显示撤销操作。

#### 场景：管理端申请撤销 tooltip 与原型一致
- **当** AC 悬停 Movement Application (Admin) 上的撤销 tooltip
- **则** tooltip 恰好显示两项：AC 可在何处撤销 In Progress 申请，以及确认后将终止流程并通知相关部门

#### 场景：管理端申请列表显示撤销
- **当** AC 在 Movement Application (Admin) 查看四类异动中任一 In Progress 记录
- **则** 提供带 tooltip 的 Revoke（撤销）操作

#### 场景：维护列表显示撤销
- **当** AC 在 Movement Maintenance 查看 In Progress 记录
- **则** 提供带 tooltip 的 Revoke（撤销）操作

#### 场景：查询与审批列表撤销只读
- **当** 用户查看 Movement Query 或 Movement Approval 列表
- **则** 不显示 Revoke 操作

### 需求：学生审批前撤回

在学生异动申请页面，系统应允许学生在审批尚未开始前，对处于 Pending Review 的 In Progress 申请执行撤回（取消），并提供 tooltip 说明与 AC 撤销的区别。

#### 场景：学生看到取消操作及 tooltip
- **当** 学生在学生申请列表查看其符合条件的申请
- **则** 显示带说明性 tooltip 的 Cancel（取消）操作

#### 场景：学生取消 tooltip 文案与产品措辞一致
- **当** 学生打开取消 tooltip
- **则** 标题为「取消说明」，三项内容为：(1) 审批流程尚未启动前，学生可在审核开始前取消；(2) 此 Cancel 与 Movement Application (Admin) 上的 Revoke 不同；(3) 若已在审核中或需 AC 终止，请联系 AC 在 Movement Maintenance 执行撤销

#### 场景：管理端申请使用撤销而非学生取消
- **当** 教职工在 Movement Application (Admin) 页面处理 In Progress 记录
- **则** 显示 Revoke（撤销）而非学生 Cancel（取消）
