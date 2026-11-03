## ADDED Requirements

### Requirement: R2/R3 course dimension shows section rows like round 1

选课结果课程维度第二轮、第三轮 SHALL 按课程分组展平为多行，并对课级字段（序号、批次名称、课程代码、课程名称、学分、有效最大容量、新生/老生容量已选、特殊新加坡学生数量）使用与第一轮一致的 rowspan；分页按课程数计。

#### Scenario: Multi-section course spans course-level cells

- **WHEN** 当前轮次为第二轮或第三轮，且某课有多个课程分组
- **THEN** 表格为每个分组一行，课程代码等课级列仅在首行显示并跨行合并

### Requirement: GE shows section column; ME shows section and selection group

GE 批次的第二/三轮结果表 SHALL 展示「课程分组」列；ME 批次 SHALL 同时展示「课程分组」与「课程组」列。课程组展示 SHALL 与学生在线选课一致（组名与入学学期范围）。GE 批次 MUST NOT 展示「课程组」列。

#### Scenario: Switch batch type changes columns

- **WHEN** 用户将选课批次从 GE 切换为 ME
- **THEN** 表头出现「课程组」列；切回 GE 后该列消失，仍保留「课程分组」

### Requirement: ME senior enrolled opens readonly grade quota

当批次类型为 ME 时，课程维度（含第一轮、第二轮、第三轮）的「老生容量」/「老生容量已选」值 SHALL 可点击；点击后系统 SHALL 以只读方式展示该课老生年级占比配置（人员类型/入学学期、占比、名额数），数据来源与抽签解析一致。用户 MUST NOT 在该弹窗内修改并保存配置。GE 批次该列 MUST 保持不可点击文本。

#### Scenario: Open ME senior quota from R2

- **WHEN** 用户在 ME 批次第二轮点击某课「老生容量已选」
- **THEN** 弹出只读年级占比视图，展示该课解析后的 meQuota 行；关闭后列表数据不变

#### Scenario: Empty quota config

- **WHEN** 该课与所属批次均无老生年级占比配置
- **THEN** 弹窗仍打开并提示未配置，不报错
