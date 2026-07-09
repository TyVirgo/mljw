## 修改需求

### 需求：学籍异动申请与审批 UX 分离
系统应将学生申请查看（Status Change Application tab）与审批操作（未来 Status Change Approval 菜单）分离。

#### 场景：申请 tab 详情不可审批
- 当用户导航至 Status Change Application 并为任意异动类型打开 Details 时，则仅展示申请表单字段；此上下文中不执行审批。

#### 场景：列表仍可访问流转日志
- 当用户在申请 tab 查看任意异动申请列表时，则 Workflow Log 操作对所有状态仍可用。
