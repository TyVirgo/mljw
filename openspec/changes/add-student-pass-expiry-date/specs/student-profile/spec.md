# student-profile — 增量规格

## 新增需求

### 需求：China 与 International 学生 Student Pass Expiry Date

China 与 International 学生基本信息应展示由 IO 维护的 Student Pass Expiry Date（dd/mm/yyyy），在学籍新建/编辑/详情模式下均为只读，学籍用户不可修改。

#### 场景：China 学生展示签证有效期
- **当** 用户查看 China 类别学生的基本信息 Tab
- **则** 显示 Student Pass Expiry Date 只读字段；有值时按 dd/mm/yyyy 展示，无值时显示弱化占位

#### 场景：International 学生展示签证有效期
- **当** 用户查看 International 类别学生的基本信息 Tab
- **则** 显示 Student Pass Expiry Date 只读字段

#### 场景：Local 学生不展示
- **当** 用户查看 Local 类别学生
- **则** 基本信息 Tab 不显示 Student Pass Expiry Date

### 需求：Student Pass Expiry Date 列表列与范围搜索

学生基本信息列表应展示 Student Pass Expiry Date 列，并提供日期范围搜索。

#### 场景：主表列展示
- **当** 用户打开学生基本信息列表
- **则** 表格包含 Student Pass Expiry Date 列；China/International 有值则展示，Local 或无值显示占位

#### 场景：日期范围筛选
- **当** 用户填写 From 和/或 To 并搜索
- **则** 仅返回 `studentPassExpiryDate` 落在 inclusive 范围内的 China/International 记录；无该字段的记录不匹配

#### 场景：导出包含字段
- **当** 用户导出学生档案
- **则** 可选字段包含 Student Pass Expiry Date，且列表默认导出字段包含该列
