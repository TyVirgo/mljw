## ADDED Requirements

### Requirement: List shows primary type only

学生端与审批端申请列表的「申请类型」列 SHALL 仅展示主类型文案（加课 / 退课 / 重修），不得再展示「加课（退课）」「重修（退课）」等五分复合文案。内部 type 为 AddDrop / RetakeDrop 时，标签仍映射为加课 / 重修。

#### Scenario: AddDrop row type label

- **WHEN** 列表行 `type` 为 `AddDrop`
- **THEN** 类型列显示「加课」（或英文 Add），色标按主类型 Add

### Requirement: Need-drop column on lists

学生端与审批端列表 SHALL 包含「是否退课」列。值为是当且仅当该申请需要/包含退课（`needDrop=yes`，或 type 为 Drop / AddDrop / RetakeDrop）；Add / Retake 为否。学生端列序为类型 → 是否退课 → 状态；审批端在类型列之后。

#### Scenario: Drop is yes

- **WHEN** 行 `type` 为 `Drop`（且未显式 `needDrop=no`）
- **THEN**「是否退课」显示「是」

#### Scenario: Add is no

- **WHEN** 行 `type` 为 `Add`
- **THEN**「是否退课」显示「否」

### Requirement: Detail aligns with list

详情基本信息的申请类型 SHALL 与列表一致（主类型三字）。纯退课申请亦 SHALL 展示「是否退课」且值为「是」。

#### Scenario: Drop detail needDrop

- **WHEN** 打开 type=Drop 的详情
- **THEN** 可见是否退课字段且值为「是」

### Requirement: Primary option labels are three words

表单与筛选的主类型三选一文案 SHALL 为加课 / 退课 / 重修（英文 Add / Drop / Retake），不得再带「（退课）」后缀。

#### Scenario: Filter Add option

- **WHEN** 用户查看类型筛选项
- **THEN** Add 选项文案为「加课」而非「加课（退课）」
