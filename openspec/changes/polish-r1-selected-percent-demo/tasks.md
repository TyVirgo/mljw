# 任务：polish-r1-selected-percent-demo

## 1. 种子与选退步进

- [x] 1.1 `seedSectionStates`：GE/ME 种子热度改为约 90%–120%（去掉 ~1.7×）
- [x] 1.2 `submitStudentPreselectVolunteer`：提交时写入真实志愿并设 `demoHeatByStudent`（合计等效 +4 人）
- [x] 1.3 `removeStudentPreselectVolunteer`：退选时移除真实学生并清除对应热度
- [x] 1.4 导出展示人数 helper；去重/`hasStudentVolunteeredSection` 仍只认真实 studentId

## 2. 收尾

- [x] 2.1 `StudentRegisterView` 百分比/胶囊色改读展示人数
- [x] 2.2 自测：GE/ME 提交升、退选降；勾选本 tasks

## 3. 初始待分配 sync（增量）

- [x] 3.1 抽出 `ensureVolunteerSeatAndHeat`（写名单+热度，不经 pending 判重）
- [x] 3.2 `syncPendingAssignIntoVolunteerStates` 改调 ensure；`submit` 仍走判重
- [x] 3.3 自测：打开即有的待分配课退选后百分比下降；勾选本节
