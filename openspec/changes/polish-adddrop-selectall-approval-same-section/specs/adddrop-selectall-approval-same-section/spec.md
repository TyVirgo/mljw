## ADDED Requirements

### Requirement: Select-all disabled when none selectable

选课器表头全选在当前筛选下无可选行且无已勾选时 SHALL 禁用。审批课程汇总在无行时表头全选 SHALL 禁用。

#### Scenario: All rows blocked

- **WHEN** 当前页所有行因冲突/学分等不可选且未勾选
- **THEN** 表头全选复选框为 disabled

### Requirement: Approval line table no text occlusion

审批弹框课程汇总表的任课教师与可选名额列 SHALL 不互相遮挡（截断+title 或足够列宽）。

#### Scenario: Long lecturer name

- **WHEN** 教师名为较长英文名
- **THEN** 名额列数字仍可读，教师溢出以省略号处理

### Requirement: AddDrop blocks same course same section

加退关联申请 SHALL 允许退一门课并加回同课的其他分组；SHALL 禁止退加同一课程的相同分组。选课勾选时 SHALL 提示并禁用该行；提交校验 SHALL 失败。重修（含重修退课）SHALL 允许同课（含同分组）。

#### Scenario: Add same section blocked

- **WHEN** 已选退某课分组01，再勾选加该课相同分组01（真实同课同组）
- **THEN** 该行不可选并提示同课同分组原因
- **NOTE** 加课必修 demo 与退课必修课号错开（见 `polish-adddrop-core-original-session-demo`）；本场景仅覆盖真实重叠

#### Scenario: Retake same course allowed

- **WHEN** 重修退课申请退 MATH101 并重修 MATH101（任意分组）
- **THEN** 提交不被「同课」规则拒绝
