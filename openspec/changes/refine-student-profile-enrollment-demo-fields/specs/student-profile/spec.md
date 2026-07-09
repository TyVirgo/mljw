## 修改需求

### 需求：Programme Structure 展示与筛选
系统应按培养方案固定格式展示 Programme Structure，且列表与筛选均有 demo 值。

#### 场景：固定命名格式
- **当** 学生有 programmeCode 与 intake
- **则** Programme Structure 为 `Programme Structure of {专业简称} ({YYYYMM} Version)`，其中 YYYYMM 来自入学批次 intake

#### 场景：列表与筛选非空
- **当** 用户查看学生基本信息列表或 Programme Structure 筛选
- **则** 每条 mock 学生均有 Programme Structure 值，筛选下拉包含实际选项（非仅「全部」）

### 需求：入学相关列 Demo 补全
系统应在列表中展示完整的入学与欠费 demo 数据。

#### 场景：Registration Time 与 Expected Batches
- **当** 显示 Registration Time、Expected Completion Batch、Expected Graduation Batch 列
- **则** 每条学生均有值（由 intake/duration 推导或 seed 提供），不得显示「—」

#### 场景：Outstanding Fee
- **当** 显示 Outstanding Fee 列
- **则** 每条学生均为 Y 或 N（demo 含 N 与 Y 混合），不得显示「—」
