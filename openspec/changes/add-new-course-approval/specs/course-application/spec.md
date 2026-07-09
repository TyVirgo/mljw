## 修改需求

### 需求：Submit applications for review
系统应允许将选中的 Temporary saved 申请提交审批，并使其在 New Course Approval 队列中可见。

#### 场景：从列表 Submit
- **当** 用户选中一条或多条 Temporary saved 申请并点击 Submit
- **则** 每条选中申请的 status 变为 In Progress，approvalStage 为 HoD/HoP Review，并追加 approvalLog 条目
- **且** 每条已提交申请在 New Course Approval 列表页可见

#### 场景：Rejected 申请不可重新提交
- **当** 申请 status 为 Rejected
- **则** 系统不提供 Edit 或 Submit 操作
- **且** Details 与 Approval Log 仍可作为只读操作使用

#### 场景：Update Required 退回草稿
- **当** 审批人在 New Course Approval 页面对申请选择 Update Required
- **则** 申请在 Course Application 中 status 变为 Temporary saved
- **且** 申请人可再次编辑并 Submit

### 需求：View details and approval log
系统应为每条申请提供只读 Details 与 Approval Log。

#### 场景：Approval log
- **当** 用户点击列表行的 Approval Log
- **则** 系统展示该申请的按时间排序审批事件列表
- **且** 事件包含来自 New Course Approval 模块的审批人操作
