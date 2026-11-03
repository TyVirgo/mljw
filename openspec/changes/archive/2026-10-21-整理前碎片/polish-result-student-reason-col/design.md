## Context

承接 `polish-result-student-main-four-cols`：主表现有来源/志愿/操作人/时间/选课结果。志愿列大量空值；原因字段已在详情与导出中存在。

## Goals / Non-Goals

**Goals:**

- 主表列序：… | 课程来源 | 操作人 | 操作时间 | 原因 | 选课结果 | 详情
- 详情仍展示选课志愿、原因、附件
- admin 来源 demo 行：原因与附件名多样轮转，不全是空

**Non-Goals:**

- 主表不加附件列
- 不改 `log.resultLabel` / `selectionResult` 文案策略

## Decisions

1. **原因展示**：直接读 `row.adminAddReason`；空 → `—`；`max-width` + ellipsis + `title`
2. **Demo 抽取**：新增 `demoAdminAddTrace(rowIndex)`，返回 `{ adminAddReason, adminAddAttachment }`，在 `buildStudentRegistrationResults` 与 `buildBatchCoverageStudentResults` 的 admin 行共用
3. **附件**：仅详情/导出；主表不展示

## Risks / Trade-offs

- [非 admin 行原因仍多为 —] → 符合业务；扫表时有内容的行即为代选留痕

## 影响文件

- `src/views/courseRegistration/RegistrationResultView.vue`
- `src/data/courseRegistration/registrationResult.js`
