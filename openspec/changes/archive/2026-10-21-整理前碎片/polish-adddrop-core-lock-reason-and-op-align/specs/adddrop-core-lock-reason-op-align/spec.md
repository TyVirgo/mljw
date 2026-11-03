## ADDED Requirements

### Requirement: Core same-section lock reason wording

选课弹框因换组锁不可选时展示的原因文案 SHALL 为「不符合该分组选课要求」（英文语义对等）；旁侧白名单 tip SHALL 保持不变。

#### Scenario: Disabled row reason
- **WHEN** 必修课因默认不可换组而置灰展示原因
- **THEN** 原因文本为「不符合该分组选课要求」（或英文对等），且 tip 仍可查看

### Requirement: Retake original actions column alignment

重修原课程表操作列 SHALL 表头左对齐、单元格内容右对齐。

#### Scenario: Header left content right
- **WHEN** 用户查看原课程表操作列
- **THEN** 「操作」表头左对齐，「选择重修课程」链接右对齐
