# 设计
## 字段映射

| 片段 | 来源 |
|------|------|
| oldCode | `currentProgramme` → 专业短代码 |
| newCode | `adminNewProgramme \|\| newProgrammeFirstChoice` |
| approved in | `applicationSession`（申请学年学期） |
| effective from | `adminNewIntake \|\| startSemester` |

## Implement 行为

PT001 `modifyStudentStatus: false`：仅追加 `statusLogs`，`status` 保持当前 enrollment（通常 Active）。

## 参考格式

`Programme transfer, SWE to DS, approved in 2025/02, effective from 2025/09`
