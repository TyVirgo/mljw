## 新增需求

### 需求：Requires Evaluation 由 Evaluation Settings 驱动（轻量演示）
系统可以在保存 Evaluation Settings 后，使用简化的 mock 逻辑更新 lecturer 的 `requiresEvaluation` 标记；首版不要求完整自动化规则引擎。

#### 场景：保存设置后更新标记
- **当** 管理员保存 Evaluation Settings
- **则** mock lecturer 记录可因演示场景被更新（如有入职日期且无授课记录；类型变更 from→to 匹配）

#### 场景：Requires Evaluation 标签反映规则
- **当** mock 规则应用后 lecturer 的 `requiresEvaluation` 为 true
- **则** 列表姓名旁显示绿色 "Requires Evaluation" 标签

#### 场景：评估筛选使用重算后的标记
- **当** 用户在保存设置后于 Lecturer Information 启用评估筛选
- **则** 筛选列表反映 mock 数据中已标记的 lecturer
