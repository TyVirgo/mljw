## ADDED Requirements

### Requirement: 新增学年学期用年月选择
选课时间配置新建全局学期时，学年学期字段 MUST 使用年月选择（不到日），MUST NOT 使用固定选项下拉。展示与保存格式 MUST 为 `YYYY/MM`（如 `2026/09`）。修改已有学期时学年学期 MUST 仍为只读展示。

#### Scenario: 新建可选年月
- **WHEN** 用户打开选课时间配置并点击新增
- **THEN** 学年学期为年月选择控件，展示格式为 `YYYY/MM`
- **AND** 不是下拉选项列表

### Requirement: 学期起月快捷与自定义月
年月选择 MUST 提供当前 popover 浏览年份下 02、04、09 三个快捷选项（位于 popover 内、年份标题与月份格之间），MUST NOT 在输入框上方单独占一行快捷按钮。快捷标签 MAY 简化为「2月 / 4月 / 9月」。用户 MUST 也可通过月份面板选择其它月份。中文界面下月份格 MUST 使用「一月…十二月」展示，MUST NOT 使用 Jan/Feb 等英文缩写。

#### Scenario: 快捷选 9 月
- **WHEN** 用户打开年月 popover 并点击快捷「9月」（或等价文案）
- **THEN** 学年学期值为 popover 当前年的 `YYYY/09`
- **AND** popover 关闭

#### Scenario: 自定义其它月
- **WHEN** 用户在月份面板选择 3 月
- **THEN** 学年学期值为该年的 `YYYY/03`

#### Scenario: 中文月份展示
- **WHEN** 界面语言为中文且用户打开年月 popover
- **THEN** 月份格可见「一月…十二月」
- **AND** 快捷位于 popover 内、不在输入框上方
