## 修改需求

### 需求：Student Profile 列表搜索
系统应将原合并 keyword 模糊搜索拆为五个独立文本框，并与下拉筛选 AND 组合。

#### 场景：拆分文本模糊搜索
- **当** 用户在 Student ID、Student Name、Chinese Name、IC No. 或 Mobile Phone 任一搜索框输入内容并搜索
- **则** 系统仅对该字段做 contains 模糊匹配；未填写的文本框不参与过滤

#### 场景：多文本框 AND 组合
- **当** 用户同时填写多个文本搜索框
- **则** 记录须同时满足所有已填写字段的模糊匹配条件

#### 场景：搜索框顺序与标签
- **当** 用户查看搜索区第一行
- **则** 五个文本框按 Student ID、Student Name、Chinese Name、IC No.、Mobile Phone 顺序排列，标签与列表列字段标签一致

#### 场景：移除合并 keyword
- **当** 用户查看搜索区
- **则** 不再显示「学号 | 姓名 | 中文名 | NRIC | 电话」合并搜索框
