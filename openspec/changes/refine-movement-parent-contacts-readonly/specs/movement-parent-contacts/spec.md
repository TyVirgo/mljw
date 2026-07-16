## MODIFIED Requirements

### Requirement: 异动家长/监护人联系人自档案带出且只读

休学与退学申请表单的 Section III MUST 在选择学生后（或学生端打开表单时）使用 `student.family[]` 中非空联系人填充 `parentContacts[]`。区块内字段 MUST 只读，MUST NOT 提供新增或删除联系人操作，MUST NOT 允许在申请内修改字段。教师代填与学生自填在档案无监护人时 MUST 同样禁止提交。SECTION III 标题旁 MUST 常显提示，说明数据来自学生个人信息页、申请内不可改、有误须至档案修改。

#### Scenario: 选学生带出只读联系人
- **WHEN** 用户为休学或退学申请选择学生且该生 `family[]` 含联系人
- **THEN** Section III 按条展示对应监护人信息
- **AND** 字段不可编辑
- **AND** 不显示删除与添加控件

#### Scenario: 无监护人禁止提交
- **WHEN** 学生档案无有效监护人且用户尝试提交（含教师代填）
- **THEN** 系统阻止提交并提示至少需要一名家长/监护人

#### Scenario: SECTION III 标题 tip
- **WHEN** 用户查看休学或退学申请 Section III 标题
- **THEN** 标题旁显示提示图标
- **AND** 提示说明数据来自学生个人信息页且申请内不可修改

## REMOVED Requirements

### Requirement: Section III 可增删可编辑监护人
**Reason**：产品要求监护人仅从学生档案只读带出。  
**Migration**：移除添加/删除入口与字段编辑；空态引导改为维护学生档案。
