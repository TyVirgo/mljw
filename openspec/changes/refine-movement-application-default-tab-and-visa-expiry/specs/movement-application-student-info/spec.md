## 新增需求

### 需求：四异动 Section I Student Visa Expiry Date
四异动新建/编辑申请表单 Section I（学生信息）应 展示只读 **Student Visa Expiry Date** 字段。

#### 场景：China 或 International 学生
- **当** 所选学生 studentCategory 为 China 或 International 且档案有签证有效期
- **则** 展示 IO 维护的日期范围（dd/mm/yyyy - dd/mm/yyyy 或单端日期）

#### 场景：Local 学生
- **当** 所选学生 studentCategory 为 Local
- **则** 仍展示 Student Visa Expiry Date 字段，值为 `—`

#### 场景：详情与审批一致
- **当** 用户在详情 Modal 或审批详情查看申请
- **则** Section I 以相同规则展示 Student Visa Expiry Date
