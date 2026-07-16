## ADDED Requirements

### Requirement: 学生详情信息变更记录 Tab

学生基本信息详情视图 MUST 在「状态日志」右侧提供「信息变更记录」Tab。该 Tab MUST 只读展示基本信息与住宿信息字段的变更流水；MUST NOT 展示学籍 enrollment 字段变更，也 MUST NOT 替代状态日志。

#### Scenario: Tab 位置与名称
- **WHEN** 用户打开学生详情并查看 Tab 栏
- **THEN** 「信息变更记录」出现在「状态日志」右侧
- **AND** 英文界面显示等价标签（如 Profile Change Log）

#### Scenario: 字段级对比列
- **WHEN** 用户打开「信息变更记录」且存在变更数据
- **THEN** 表格展示变更时间、分区（基本信息/住宿）、字段、原值、新值、变更人、角色（老师/学生）
- **AND** 每行对应单个字段的一次变更

#### Scenario: 无数据
- **WHEN** 该生无信息变更记录
- **THEN** 显示空状态（与详情其它空列表一致）

#### Scenario: 与状态日志分离
- **WHEN** 用户查看「状态日志」
- **THEN** 内容仍仅为学籍状态相关条目，不含基本信息/住宿字段对比行
