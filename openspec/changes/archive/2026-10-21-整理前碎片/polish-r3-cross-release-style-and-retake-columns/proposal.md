## Why

选课结果第三轮互释时间展示偏弱、日期仍为存储格式，不易与「本学期累计学分」类提示对齐；加退课表单「选择的重修课程」表代码/名称分列冗余，且无法一眼区分同课重修与同组换课重修。

## What Changes

- R3 工具栏互释时间：加粗 + 浅底色胶囊样式；时刻展示为 `DD/MM/YYYY HH:mm:ss`
- 「选择的重修课程」表：课程代码+名称合并为「重修课程」（值 `代码/名称`）
- 在「曾修课程」后增加「是否同课程曾修」（课号相同为是，否则为否）

## Non-goals

- 不改正文存储的互释时刻格式（仅展示转换）
- 不改审批详情页重修表列结构（除非后续单独对齐）
- 不改同组重修业务判定逻辑，仅展示是否同课号

## Capabilities

### New Capabilities

- `r3-cross-release-style-and-retake-columns`: R3 互释提示样式与重修表列合并/同课标识

### Modified Capabilities

- （无）

## Impact

- `RegistrationResultView.vue`
- `AddDropApplicationFormSections.vue`
- `zh.js` / `en.js`
- 复用 `batchDateToPicker` / `formatDateTimeDisplay`
