## 修改需求

### 需求：查看转专业申请详情
系统应将转专业申请详情展示为只读学生申请内容（Section I–IV），不含 Section VII 或内嵌审批控件。

#### 场景：详情内容范围
- 当用户打开转专业 Details 时，则只读展示 Section I（Student Details）、II（Transfer Information）、III（Declaration）与 IV（Supporting Documents）。

#### 场景：申请模块中无教务审批
- 当用户为 Pending 审批的 In Progress 转专业打开 Details 时，则系统在详情弹框中不提供 Approve、Update Required 或 Reject 操作。

#### 场景：支持文档 UI
- 当用户在详情中查看 Section IV 时，则通过共享只读附件面板展示附件，并提供 Download Consent Letter 操作。

## 移除需求

### 需求：从详情弹框审批转专业
**原因**：审批迁移至独立 Status Change Approval 模块；申请 tab 详情面向学生只读。  
**迁移**：使用 Workflow Log 查看历史；未来审批模块将提供 approve/reject 操作。

#### 场景：详情内教务审批（已移除）
- 当用户以 admin 身份打开转专业 Details 时，则不展示内嵌审批表单。

### 需求：审批期间从详情弹框编辑 Section VII
**原因**：Section VII 为教务数据录入，不属于学生申请详情视图。  
**迁移**：Section VII 在新建/编辑表单保留供 mock 演示；完整教务编辑延后至审批模块。

#### 场景：详情中 Section VII 可编辑（已移除）
- 当用户在 Academic Affairs 审批阶段打开 Details 时，则详情弹框不展示或不可编辑 Section VII 字段。
