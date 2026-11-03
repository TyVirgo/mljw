## ADDED Requirements

### Requirement: Credit bypass amount stays inline and always visible

在白名单新增/编辑表单中，当展示「允许突破本学期学分要求」时，系统 MUST 在同一行展示可超学分输入（「可超 [N] 分」或等价英文），以逗号（或语言等价分隔）接在权限文案之后；该输入 MUST 始终可见，不得仅在勾选后才出现。未勾选该权限时，可超学分输入 MUST 为不可编辑（disabled）。勾选该权限保存时，可超学分 MUST 仍为 1–3 的整数校验。

#### Scenario: Unchecked still shows amount field

- **WHEN** 用户打开新增白名单且未勾选「允许突破本学期学分要求」
- **THEN** 同行仍显示可超学分数字框，且该数字框不可编辑

#### Scenario: Checked allows editing amount on same line

- **WHEN** 用户勾选「允许突破本学期学分要求」
- **THEN** 可超学分数字框与权限文案同一行可编辑，无独立缩进换行块

### Requirement: Form hint uses numbered layering

白名单表单顶栏说明 MUST 按权限语义分条并带序号（至少覆盖：加退课/重修父项、先修豁免、学分例外、未来学期必修），使内容分层可读；MUST NOT 要求整页改为批次式 `step-badge` 大分区。

#### Scenario: Hint lists numbered permission notes

- **WHEN** 用户打开新增或编辑白名单表单
- **THEN** 顶栏说明以带序号的分条形式展示各权限含义
