## 1. 演示中签班次错开确认集

- [x] 1.1 将 `studentVolunteerSheet.js` 中 COMP201 种子/结果/公示中签的 `sectionId` 从 `sec-2` 改为 `sec-comp201-3`（Wed 11–13）
- [x] 1.2 核对 `sec-2` 仍保留 Fri 10–12 供加退冲突样例；必要时在课库注释标明中签用 `sec-comp201-3`

## 2. R1 确认志愿顺序硬闸

- [x] 2.1 在 `studentRegistrationScheduleConflict.js`（或 store）新增待分配志愿相对必修基线的硬冲突扫描函数
- [x] 2.2 `confirmVolunteerPreferenceOrder` 内断言硬闸，失败返回 `scheduleConflictHard` 参数
- [x] 2.3 `StudentRegistrationCartDrawer`：`canConfirmOrder` 纳入硬闸；置灰时展示冲突提示

## 3. 验收

- [x] 3.1 硬刷新后打开在线选课 R2「我的课表预览」：COMP101 与 COMP201 不再周五并排冲突
- [x] 3.2 抽查 R1：撞必修行不可提交；仅志愿互撞时「确认志愿顺序」仍可用
