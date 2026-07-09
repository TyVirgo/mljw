# 状态日志：毕业与退学备注

## 背景
学籍详情 Status Log 需展示毕业终态（完成/毕业批次与日期）及退学异动的结构化备注；退学原因须与异动类型 WDR001 配置一致。

## 变更内容
- `buildGraduationStatusLogRemarkLines`：Completion Batch/Date、Graduation Batch/Date
- `buildWithdrawalStatusLogRemarkLines`：`resolveReasonLabel(WDR001)` + Last Date of Attendance
- `applyStudentProfileFromMovement` 退学 Implement 接 builder
- mock：XMUM2309001 毕业行；退学样例对齐 WDR001 原因

## 影响
- `graduationStatusLog.js`、`withdrawalStatusLog.js`、`students.js`
- i18n：`Graduated`、studentProfile.status.graduated
