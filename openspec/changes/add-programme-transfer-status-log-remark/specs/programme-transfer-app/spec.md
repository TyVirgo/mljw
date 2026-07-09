## 新增需求

### 需求：转专业状态日志备注含学期信息

转专业实施时，系统应追加一条学生档案状态日志，其备注包含已批准申请中的批准学年学期和生效学年学期。

#### 场景：旧版风格备注行
- **当** 维护实施已批准转专业
- **则** `remarkLines` 包含 `Programme transfer, {oldCode} to {newCode}, approved in {applicationSession}, effective from {effectiveSession}`

#### 场景：不更改学籍状态
- **当** 转专业被实施
- **则** 学生学籍状态保持不变，同时仍追加状态日志条目
