## Why

选课志愿出现「第3志愿」阿拉伯数字，与「第一/第二志愿」不一致；我的课表必修/选修配色与产品期望（深蓝白字 / 浅蓝黑字）不符。

## What Changes

- 中文选课志愿统一汉字序数（第三志愿…），不再插入阿拉伯数字
- 我的课表（`legendMode=myResult`）：必修深蓝底白字，选修浅蓝底黑字；图例 swatch 同步
- 纠偏色值：必修 `#1d4ed8` + 白字；选修/已确认选修 `#bfdbfe` + 黑字
- 在线选课「我的课表预览」与「我的课表」solid 色同步；**本轮选择**虚线绿样式不变

## Non-goals

- 不改「其他课程」橙色样式、不改「本轮选择」虚线绿
- 不改志愿排序/抽签逻辑

## Capabilities

### New Capabilities

- `preference-han-my-schedule-colors`: 志愿汉字序数 + 我的课表必修/选修色

### Modified Capabilities

- （无）

## Impact

- `registrationResult.js`（formatCoursePreferenceLabel）、zh i18n
- `WeekScheduleGrid.vue`（myResult 作用域配色与图例）
