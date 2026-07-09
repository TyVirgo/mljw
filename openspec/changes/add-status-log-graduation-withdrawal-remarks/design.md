# 设计
## 毕业 Status Log

| 列 | 值 |
|----|-----|
| status | `Graduated` |
| movementCategory | 空（—） |
| remarkTitle | `Graduation` |
| remarkLines | 四行 Label : Value（图示 2） |

批次格式 `YYYYMM`；日期 `dd/mm/yyyy`。毕业模块未建，mock 用 `DEMO_GRADUATION_STATUS_LOG` 常量。

## 退学 Status Log

```
Last Date of Attendance : dd/mm/yyyy
Reason : {resolveReasonLabel(WDR001, reasonId)}
Note : {optional}
```

Implement 时 `movementContext.sourceKey === 'withdrawal'` 调用 builder。

## 学籍状态

`studentStatusOptions` 增加 `Graduated`；`studentProfile.status.graduated` i18n。
