## Current Whereabout

- 值域：`In Campus` | `Out of Campus`
- 必填；placeholder：`Select Current Whereabout`

## Current Academic Session

- 数据 key：`currentAcademicSession`
- 来源：`student.enrollment.academicSession`（normalize `YYYY/MM`）
- 与 `applicationSession`（intake）并列展示，只读
- **布局**：Section I 第 2 行 — 左 `currentAcademicSession`，右 `applicationSession`
- 转专业 Section I 第 3 行左 — `dateOfApplication`（只读，create 默认当天）
- Section I 末段 — `personalEmail`、`phoneNumber`（四异动）；`accommodationRoomNo`（休学/退学）；选学生 snapshot 带出，submit 不校验必填
- 转专业 Section II — `transferReason` 长文本 textarea（必填）；保留 `reasonId` 数据层兼容；Section V Declaration 不变
