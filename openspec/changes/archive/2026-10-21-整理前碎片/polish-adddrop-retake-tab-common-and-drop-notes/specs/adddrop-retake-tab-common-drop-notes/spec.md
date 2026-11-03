## ADDED Requirements

### Requirement: Retake tabs only switch original course list

重修类型下的必修/公选/专选 Tab SHALL 仅切换原课程列表内容；本学期重修课程表、重修计费学分、重修预估费用与费用预估明细框 SHALL 为各 Tab 公共区域且不随 Tab 切换而替换。

#### Scenario: Switch original tab keeps retake lines
- **WHEN** 用户已选本学期重修课并在原课程区切换 Tab
- **THEN** 本学期重修课程表与费用汇总/明细保持不变，仅原课程表数据变化

### Requirement: Fee estimate detail remains three-line box

费用预估 SHALL 继续以加课费用、重修费用、SST费用（含 tip）三行明细展示，并紧挨重修公共区展示（有重修区时）。

#### Scenario: Retake fee detail visible
- **WHEN** 申请含重修费用
- **THEN** 用户可见重修费用金额及费用预估框中的重修费用行

### Requirement: Drop supplementary notes optional

退课区原「退课原因」字段 SHALL 展示为「补充说明」，且为非必填（无必填星、提交不因空而失败）。

#### Scenario: Submit drop without notes
- **WHEN** 用户提交含退课行的申请且补充说明为空
- **THEN** 不因补充说明为空而校验失败
