## 背景

课表抽屉标题固定为「我的课表」；subtitle 现用于提示文案。管理端监控详情内嵌周课表，亦无表头身份行。讲师模块有 Staff ID，尚无课表表头身份。

## 目标 / 非目标

**目标：**

- 抽屉支持 `personLine`（单行省略 + title 全文）
- 学生：`{studentId} {studentName}`
- 老师（管理端讲师详情课表区）：`{staffId} {姓名}`
- 提示文案仍可用 subtitle / 面板 hint

**非目标：**

- 不实现完整教师端门户选课

## 决策

1. 身份行放在 title 与 subtitle 之间，避免改周格组件  
2. 姓名过长用 CSS ellipsis，不做按字符硬截断（更稳）  
3. 管理端老师侧：在 `LecturerDetailModal` 基本信息步骤末增加「本学期课表」区块；表头为 Staff ID + 姓名，下方为 `WeekScheduleGrid`（`buildLecturerDemoSchedule`）  
4. 管理端学生侧：`RegistrationMonitorDetailDrawer` 抽屉 `personLine` 展示学号 + 姓名（与学生端同一格式工具）

## 风险

- [提示与身份抢位置] → 身份优先，提示降为次行小字
