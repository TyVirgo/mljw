# 任务
## 1. 数据与查询

- [x] 1.1 向 semesterInfo 补充 2024 学年学期记录，覆盖 mock 查询
- [x] 1.2 在 deferments.js 实现 resolveDefermentPeriodDates、getDefermentPeriodOptions
- [x] 1.3 createEmptyDeferment、normalizeDeferment 增加 defermentStartDate / defermentEndDate

## 2. 界面

- [x] 2.1 DefermentFormModal：监听休学期间，只读展示起止日期行
- [x] 2.2 DefermentDetailModal + MovementDetailContent 同步展示
- [x] 2.3 i18n zh/en + zh-flat

## 3. 状态日志集成

- [x] 3.1 buildDefermentStatusLogRemarkLines + 扩展 applyStudentProfileFromMovement
- [x] 3.2 维护与审批引擎传入异动上下文
- [x] 3.3 更新 mock deferments 与学生 statusLogs
