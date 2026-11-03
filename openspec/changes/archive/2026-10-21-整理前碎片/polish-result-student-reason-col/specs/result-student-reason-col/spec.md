## ADDED Requirements

### Requirement: 主表不展示选课志愿

选课结果学生维主表 MUST NOT 展示「选课志愿」列；详情抽屉 MUST 仍展示选课志愿。

#### Scenario: 主表无志愿列

- **WHEN** 用户查看学生维主表
- **THEN** 表头与数据行不包含选课志愿列

#### Scenario: 详情仍有志愿

- **WHEN** 用户打开某行详情
- **THEN** 详情中仍可看到选课志愿（预选有值，非预选可为 —）

### Requirement: 主表展示原因

学生维主表 MUST 在操作时间与选课结果之间展示「原因」列；无原因时显示 —；过长文本 MUST 可省略并以 title 展示全文。

#### Scenario: 代选行可见原因

- **WHEN** 某行存在 adminAddReason
- **THEN** 主表原因列显示该文案（可截断）

### Requirement: Demo 原因与附件有实质内容

演示数据中课程来源为代选（admin）的行 MUST 提供非空的原因文案，且 SHOULD 提供附件文件名；不同行 MUST 轮转多种文案/文件名，避免全部相同或全部为空。

#### Scenario: 翻页可见多样留痕

- **WHEN** 用户在学生维浏览含代选来源的行
- **THEN** 至少部分行原因非 —，打开详情时附件名亦非 —
