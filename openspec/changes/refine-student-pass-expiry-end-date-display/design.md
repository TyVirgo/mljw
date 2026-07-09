## 展示 vs 搜索

```
studentPassExpiryStartDate ─┐
studentPassExpiryEndDate   ─┼─▶ 展示：formatStudentPassExpiryEndDate → dd/mm/yyyy
                            │
                            └─▶ 搜索：matchesStudentPassExpiryDateRange(endDate) 不变
```

## 异动 snapshot

- 新建/选学生：`resolveMovementVisaExpiryFromStudent` 写入 end date 单值
- 旧数据 `15/09/2024 - 14/09/2029`：`displayMovementVisaExpiry` 解析取 `-` 后段
