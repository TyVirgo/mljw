## 新增需求

### 需求：列表展示学籍类型列

学生基本信息列表应在学籍状态列右侧展示学籍类型（Track Category），不增加学籍类型搜索筛选。

#### 场景：列位置
- **当** 用户查看学生基本信息列表
- **则** 学籍类型列紧挨学籍状态列右侧显示

### 需求：学籍类型随学籍状态联动

Enrollment Tab 中选择学籍状态时，学籍类型下拉仅展示该状态允许的选项；不扩充现有学籍状态枚举。

#### 场景：Active 状态选项
- **当** 用户在表单中选择学籍状态 Active
- **则** 学籍类型下拉包含 Normal、Programme Transfer、Inbound Mobility、Outbound Mobility、IEP、Completion without Graduation*

#### 场景：Deferred 状态选项
- **当** 用户选择 Deferred
- **则** 学籍类型选项对齐参考表中 Deferment 对应集合

#### 场景：变更状态后清理非法类型
- **当** 用户变更学籍状态且当前学籍类型不在新状态允许列表中
- **则** 系统自动将学籍类型重置为新列表的首个合法值

### 需求：详情与导出同步

详情 Enrollment Tab 与列表导出应展示同一 `enrollment.trackCategory` 值。

#### 场景：详情只读
- **当** 用户打开学生档案详情 Enrollment Tab
- **则** 学籍类型以只读形式展示在学籍状态旁
