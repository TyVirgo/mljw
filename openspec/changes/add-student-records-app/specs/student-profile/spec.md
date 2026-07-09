## 新增需求

### 需求：Student Profile 列表页搜索
系统应提供与原型对齐的 Student Profile Management 列表页，并支持搜索筛选。

#### 场景：展示搜索字段
- **当** 用户查看 Student Profile 页面
- **则** 搜索栏展示 Student ID、Name、Student Type 筛选字段，以及 Search、Reset 按钮

#### 场景：按 Student ID 搜索
- **当** 用户输入 Student ID 并点击 Search
- **则** 表格仅展示 Student ID 包含输入文本的行（不区分大小写）

#### 场景：按姓名搜索
- **当** 用户输入 Name 并点击 Search
- **则** 表格仅展示 Student Name 或 Chinese Name 包含输入文本的行（不区分大小写）

#### 场景：按 Student Type 筛选
- **当** 用户选择非「All Categories」的 Student Type 并点击 Search
- **则** 表格仅展示匹配该 student type 的行

#### 场景：重置搜索
- **当** 用户点击 Reset
- **则** 所有搜索字段清空，表格展示完整 mock 数据集

### 需求：Student Profile 列表工具栏操作
系统应在 Student Profile 页面提供 Create、Import、Export 工具栏操作。

#### 场景：Create 按钮可见
- **当** 用户查看 Student Profile 页面
- **则** 工具栏展示主色 Create 按钮

#### 场景：Import 占位
- **当** 用户点击 Import
- **则** 系统展示占位提示，说明导入功能尚未接入

#### 场景：Export 导出数据
- **当** 用户点击 Export 并在导出弹框中确认导出
- **则** 系统下载包含所选导出范围与列的 Excel 文件

### 需求：Student Profile 数据表格列
系统应展示与原型一致的分页表格列。

#### 场景：表格列
- **当** 展示 Student Profile 列表
- **则** 列包含 No.、Student ID、Student Name、Chinese Name、Student Type、Gender、Programme Code、Programme、Intake、Student Status、Actions

#### 场景：行操作
- **当** 用户查看表格行
- **则** Actions 列提供 Details 与 Edit 链接

#### 场景：分页
- **当** 筛选结果数量超过每页条数
- **则** 系统展示分页控件，并正确展示当前页数据切片

### 需求：Student Profile 行详情查看
系统应支持用户从列表查看学生档案详情。

#### 场景：打开详情
- **当** 用户点击某一行的 Details
- **则** 系统展示只读详情视图，显示该行学生信息

### 需求：Student Profile mock 数据
系统应使用本地 mock 数据驱动 Student Profile 列表，不调用后端 API。

#### 场景：初始数据加载
- **当** 用户打开 Student Profile 页面
- **则** 表格展示至少六条 mock 学生记录，包含多种 student type 与 Active 状态样例

### 需求：Student Profile 页面样式与 Basic Data 列表页一致
系统应使用与 Lecturer Information 等 Basic Data 模块相同的列表页布局与样式约定。

#### 场景：Page card 布局
- **当** 用户查看 Student Profile 页面
- **则** 内容包裹在 page card 中，含搜索栏、工具栏、数据表格与分页，样式与 Basic Data 列表页一致
