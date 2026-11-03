## ADDED Requirements

### Requirement: Chinese preference labels use han numerals

中文界面下选课志愿文案 SHALL 使用汉字序数（如第一志愿、第二志愿、第三志愿），SHALL NOT 在「第」与「志愿」之间使用阿拉伯数字（如第3志愿）。列表与导出 SHALL 使用同一格式化结果。

#### Scenario: Third preference in Chinese

- **WHEN** 界面为中文且 preferenceRank 为 3
- **THEN** 显示「第三志愿」

#### Scenario: First preference unchanged

- **WHEN** preferenceRank 为 1 且界面为中文
- **THEN** 显示「第一志愿」

### Requirement: Schedule required and confirmed elective colors

学生周课表（含「我的课表」与在线选课「我的课表预览」）中，必修课 solid 色块 SHALL 为深蓝底白字（约 `#1d4ed8` / `#fff`）；已确认选修 / 选修课 solid 色块 SHALL 为浅蓝底黑字（约 `#bfdbfe` / `#111827`）；图例 solid swatch SHALL 与色块一致。「本轮选择」虚线样式 SHALL NOT 改变。

#### Scenario: My result required block

- **WHEN** 学生打开我的课表且存在必修图层色块
- **THEN** 色块为深蓝背景与白色文字

#### Scenario: Register preview required and confirmed

- **WHEN** 学生在在线选课打开我的课表预览
- **THEN** 必修为深蓝白字、已确认选修为浅蓝黑字，与我的课表 solid 色一致

#### Scenario: This-round selection unchanged

- **WHEN** 预览中存在本轮选择（虚线）色块
- **THEN** 仍为绿虚线样式，不改为深蓝/浅蓝实心
