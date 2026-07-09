## 修改需求

### 需求：Student Profile 列表搜索
系统应提供统一模糊搜索与可折叠的高级下拉筛选。

#### 场景：统一模糊搜索
- 当用户在 keyword 文本框输入内容并搜索时，则系统对 Student ID、Student Name、Chinese Name、IC No. (No dash)、Mobile Phone 做 OR 模糊匹配

#### 场景：第一行下拉筛选
- 当用户展开搜索区第一行时，则显示 Programme、Intake、Status 三个下拉，与 keyword 组合 AND 过滤

#### 场景：Status 筛选基于最新日志
- 当用户按 Status 筛选时，则匹配该生 Status Log 中 dateEffective 最新一条的 status；无日志时回退 enrollment.status

#### 场景：折叠高级筛选
- 当用户点击「更多」时，则展开 Student Type、Nationality、Registration Time、Programme Level、Programme Structure、Expected Completion Batch、Expected Graduation Batch、Outstanding Fee 及 Student Pass Expiry 日期范围

#### 场景：Student Type 即 Student Category
- 当用户按 Student Type 筛选或查看表格列时，则值为 Local、China 或 International（由国籍推导的 studentCategory）

### 需求：Student Profile 数据表格列
系统应展示扩展列并支持左侧四列（含复选框）冻结。

#### 场景：必含列
- 当显示列表时，则包含 Student ID、Name、Chinese Name、Status、Intake、Programme Code、Nationality、Student Type、Outstanding Fee (Y/N)

#### 场景：Status 列来源
- 当显示 Status 列时，则展示 Status Log 最新 status（同筛选逻辑）

#### 场景：保留原有列
- 当显示列表时，则保留 Student Pass Expiry Date、Gender、Programme 等原有列

#### 场景：左侧冻结
- 当用户横向滚动表格时，则复选框、序号、学号、姓名四列保持固定可见

#### 场景：Programme Level 展示
- 当显示 Programme Level 列或搜索下拉时，则展示 Foundation / Undergraduate / Postgraduate（不含 L3-/L6- 等前缀）
- 当用户按 Programme Level 筛选时，则对存储值与筛选值做归一化后比较

#### 场景：搜索字段与列表列对齐
- 当某字段出现在搜索区（含 keyword 的 IC No.、Mobile Phone 与折叠区 Registration Time、Programme Level、Programme Structure、Expected Completion Batch、Expected Graduation Batch 等）时，则筛选结果表格必须展示对应列，便于用户核对筛选命中原因

#### 场景：详情可查看搜索字段
- 当用户打开详情抽屉时，则 IC No.、Mobile Phone、Registration Time 等搜索相关字段可在 Basic Info、Contact 或 Enrollment Tab 中查看（无需新增 Tab）
