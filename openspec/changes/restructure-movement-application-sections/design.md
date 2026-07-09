# 设计：Section II–IV 重组

## Section II grid

| 类型 | Row 1 | Row 2 | Row 3 |
|------|-------|-------|-------|
| 休学 | Deferment Period \| Main Reason | Detailed Reason (span-2) | — |
| 退学 | Whereabout \| Destination | Last Date \| Main Reason | Detailed Reason (span-2) |
| 复学 | Deferment Period \| Resumption Period | — | — |
| 转专业 | Start Semester (span-2 或单列) | 1st Choice \| 2nd Choice | transferReason textarea (span-2) |

休学 `defermentStartDate`/`defermentEndDate` 仍由 period 联动计算并持久化，**不出现在 Section II 表单**；详情可继续展示。

转专业 Section I 末尾增加 Current Programme / Intake / School 只读快照。

## Section III grid（休学/退学）

```
Name          | Relationship
NRIC/Passport | Contact No.
Email         (span-2)
```

`snapshot` 使用 `getPrimaryFamilyContact(student)`。

## Section IV

- `getMovementDocumentFields('resumption')` 不含 consent letter 槽位与下载按钮
- 休学/退学/转专业保留 consent 下载
