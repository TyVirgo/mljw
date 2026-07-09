## 修改需求

### 需求：管理端列表撤销 In Progress 异动申请

#### 场景：审批历史 Tab 列表撤销
- **当** AC 在审批历史 Tab 对 In Progress 申请执行撤销并确认
- **则** 申请变为 Cancelled、归档，approvalLog 记录 AC 撤销

#### 场景：非历史 Tab 不显示撤销
- **当** 用户查看审批已提交或待我审批 Tab
- **则** 不显示撤销操作
