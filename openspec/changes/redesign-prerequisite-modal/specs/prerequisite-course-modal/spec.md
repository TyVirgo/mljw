## 新增需求

### 需求：先修课程选择弹框布局
系统应在用户点击课程向导中 Pre-requisite / co-requisite 的 **Choose** 时，展示宽 **Add** 弹框，布局与原型一致，含搜索区域、数据表格、分页，以及 Discard / Confirm 页脚。

#### 场景：弹框以 Add 为标题打开
- **当** 用户点击 Pre-requisite / co-requisite 的 Choose
- **则** 系统打开标题为 **Add**、宽度约 1000px 的弹框
- **且** 先前已选 course code 保持勾选状态

#### 场景：排除当前课程
- **当** 向导正在编辑或创建 code 为 `X` 的课程
- **则** 课程 `X` 不出现在可选列表中

### 需求：先修课程搜索筛选
系统应提供 Course Name、Course Code 和 Offering 搜索筛选，以及 Search 和 Reset 操作。

#### 场景：Search 应用筛选
- **当** 用户输入筛选值并点击 Search
- **则** 表格仅显示匹配全部非空筛选条件的课程（文本字段不区分大小写部分匹配）
- **且** 分页重置到第 1 页

#### 场景：Reset 清空筛选
- **当** 用户点击 Reset
- **则** 清空全部搜索字段
- **且** 表格展示完整可用课程列表

#### 场景：Offering 筛选
- **当** 用户选择 Offering 单位并点击 Search
- **则** 仅显示该 offering code 的课程

### 需求：先修课程选择表格
系统应展示分页表格，列包括：checkbox、No.、Course code、Course Name、Offering、Credit Value 和 Course Classification。

#### 场景：表格列与数据
- **当** 弹框列出课程
- **则** 每行显示序号、course code、course name、offering 标签（通过 department lookup）、credit value 和已翻译的 course classification

#### 场景：多选课程
- **当** 用户勾选一行或多行并点击 Confirm
- **则** 向导 Pre-requisite 字段更新为所选 course code，以逗号加空格连接
- **且** 弹框关闭

#### 场景：Discard 不保存
- **当** 用户点击 Discard 或关闭控件
- **则** 弹框关闭，不更新向导字段

#### 场景：表头全选当前页
- **当** 用户勾选某页的表头 checkbox
- **则** 当前页全部课程被选中
- **且** 其他页的选中状态保持不变

#### 场景：跨页选中保留
- **当** 用户在第 1 页选中课程，导航至第 2 页并选中更多课程
- **则** 全部选中 course code 保留，直至 Confirm 或 Discard

### 需求：先修弹框分页
系统应使用共享 TablePagination 组件对筛选结果分页。

#### 场景：默认分页
- **当** 匹配筛选条件的课程超过 10 条
- **则** 系统默认每页显示 10 条记录，并显示总记录数

#### 场景：更改每页条数
- **当** 用户更改每页记录数
- **则** 表格以新 page size 刷新并返回第 1 页

### 需求：向导中复用先修弹框
系统应在 Course Information 与 Course Application 向导中使用相同的先修选择弹框，且不改变父组件集成方式。

#### 场景：Course Information 向导
- **当** 用户从 Course Information 创建或编辑向导中选择先修课程
- **则** 弹框接收 courses 列表，Confirm 时返回逗号分隔的 code

#### 场景：Course Application 向导
- **当** 用户从 Course Application apply 向导中选择先修课程
- **则** 使用 applications 派生课程列表，弹框行为相同
