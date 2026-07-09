# 设计：休学起止时间

## 数据 lookup

```
defermentPeriod (YYYY/MM)
    → findSemesterRecordByKey (calendarInfo + initialSemesterRecords)
    → defermentStartDate / defermentEndDate (dd/MM/YYYY, 快照存申请)
```

`defermentPeriodOptions` 改为由 `initialSemesterRecords` 生成，与基础数据学年学期维护一致。

## 表单联动

- 选择/变更 `defermentPeriod` 时同步起止时间；清空期间则清空起止时间。
- 字段只读，Save Draft / Submit 时随申请持久化。

## 状态日志

Implement 时 `applyStudentProfileFromMovement(studentId, config, { sourceKey, item })`：

- 对 `deferment`：按该生已有 Deferment 日志条数 +1 生成 ordinal（1st/2nd/3rd…）
- `remarkLines` 首行：`{ordinal} Deferment: {start}-{end}`
- 保留 `Deferment Period : …`、`Reason : …`（若有）

不含 Resumption 内容。
