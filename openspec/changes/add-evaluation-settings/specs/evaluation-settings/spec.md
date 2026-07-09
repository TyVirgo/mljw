## 新增需求

### 需求：Evaluation Settings 页面布局与配置原型一致
系统应将 Evaluation Settings 展示为单页配置表单，不含搜索、筛选或分页控件。

#### 场景：页面区块
- **当** 用户导航至 Evaluation Settings
- **则** 系统按顺序展示：全局信息横幅、New Lecturer 区块、Change in Lecturer Category 区块、「+ Create」控件，以及右下角 Save 按钮

#### 场景：无查询或搜索
- **当** 用户查看 Evaluation Settings
- **则** 系统不展示搜索字段、查询按钮或列表/表格检索控件

### 需求：全局评估信息横幅
系统应展示醒目信息横幅，说明新入职教师或教师类型变更可触发教师评估需求。

#### 场景：英文横幅
- **当** 语言区域为 English
- **则** 横幅文案等价于：「New lecturer or lecturer category change triggers the requirement for a prompt teacher evaluation.」

#### 场景：中文横幅
- **当** 语言区域为 Chinese
- **则** 横幅文案等价于：「新入职教师或教师类型变更会触发教师评估需求。」

### 需求：New Lecturer 全局评估开关
系统应提供 New Lecturer 区块，含描述标签与全局启用/禁用开关，控制无任何教学记录的新讲师是否须评估。

#### 场景：新讲师定义
- **当** 在 mock/demo 模式下应用评估规则
- **则** 仅当讲师有入职日期（`dateOfJoining`）且无教学记录（`hasTeachingRecord` 为 false 或等价 mock 字段）时，才符合「new lecturer」

#### 场景：区块内容（英文）
- **当** 语言区域为 English
- **则** 区块标题为「New Lecturer」，描述等价于：「New lecturers without any teaching experience are required to undergo teacher evaluation.」

#### 场景：区块内容（中文）
- **当** 语言区域为 Chinese
- **则** 区块标题为「新入职教师」，描述等价于：「新入职且无教学经验的教师，需进行教师评估。」

#### 场景：开关位置
- **当** 渲染 New Lecturer 区块
- **则** 启用/禁用开关位于区块行右侧

### 需求：类型变更评估规则
系统应允许管理员定义一条或多条讲师类型变更规则。每条规则应包含：源类型（Category change from / 教师由）、目标类型（to / 变更为）、Delete 操作，以及该规则的启用/禁用开关。

#### 场景：规则行英文模板
- **当** 语言区域为 English 且展示规则行
- **则** 行文案等价于：「Category change from [dropdown] to [dropdown] requires teacher evaluation for providing information.」，右侧含 Delete 与规则开关

#### 场景：规则行中文模板
- **当** 语言区域为 Chinese 且展示规则行
- **则** 行文案等价于：「教师由 [dropdown] 变更为 [dropdown] ，需进行评估。」，右侧含「删除」与规则开关

#### 场景：Category 下拉选项
- **当** 用户在规则行打开 category 下拉框
- **则** 选项与讲师 Category 值一致（Full-time Lecturer、China Seconded Lecturer、Student Teaching Assistant、Part-time Lecturer）

#### 场景：默认 mock 规则
- **当** 用户首次打开 Evaluation Settings 且无已保存配置
- **则** 系统预加载与原型一致的示例规则：Part-time Lecturer → Full-time Lecturer（enabled）和 Student Teaching Assistant → Full-time Lecturer（enabled）

### 需求：创建与删除类型变更规则
系统应允许通过「+ Create」/「+ 新增」新增类型变更规则，并通过 Delete / 删除 移除现有规则。

#### 场景：新增规则
- **当** 用户点击「+ Create」
- **则** 系统追加新的可编辑规则行，from/to 选择为空，规则开关默认开启

#### 场景：删除规则须确认
- **当** 用户点击规则行的 Delete
- **则** 系统在从待保存配置中移除该规则前显示确认对话框

#### 场景：取消删除
- **当** 用户点击 Delete 后在确认对话框中取消
- **则** 规则行保持不变

### 需求：保存评估设置
系统应在用户点击 Save / 保存 时持久化评估设置，并提供成功反馈。

#### 场景：保存时校验
- **当** 用户点击 Save，且任一启用规则缺少 from/to、from 与 to 相同，或与另一启用规则重复
- **则** 系统阻止保存并显示校验提示

#### 场景：保存成功
- **当** 用户点击 Save 且配置有效
- **则** 系统持久化设置（v1 为 mock/local storage）并显示成功提示

#### 场景：Save 按钮位置
- **当** 页面渲染
- **则** Save 按钮作为主操作按钮，对齐于页面卡片右下角

### 需求：将规则应用于讲师评估标记（轻量 demo）
系统可将已保存评估设置应用于讲师 `requiresEvaluation` 标记，采用简化 mock 逻辑，以便 Lecturer Information 演示效果；v1 不要求完整规则引擎精度。

#### 场景：应用新讲师规则
- **当** New Lecturer 评估已启用、设置已保存，且讲师有入职日期但无教学记录
- **则** 该讲师在 mock 数据中可被标记为 `requiresEvaluation: true`

#### 场景：应用类型变更规则
- **当** 启用的类型变更规则匹配讲师 mock 的 `previousCategory` → 当前 `category` 组合
- **则** 该讲师在 mock 数据中可被标记为 `requiresEvaluation: true`

#### 场景：规则反映在列表中
- **当** 用户保存设置后导航至 Lecturer Information
- **则** mock 数据中已标记的讲师显示 Requires Evaluation 标签，并在启用评估筛选开关时出现
