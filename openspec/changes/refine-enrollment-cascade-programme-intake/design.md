## 背景

```
专业批次 (initialProgrammeIntakes, active=Yes)
        + 专业目录 level (programmeCatalogue)
                    │
                    ▼
         enrich → programmeLevel, school, programmeName …
                    │
    ┌───────────────┼───────────────┐
    ▼               ▼               ▼
 Level 下拉      School 下拉     Programme 下拉
 (distinct)    (filter level)  (filter level+school)
                                    │
                                    ▼
                          programmeIntakeKey
                                    │
                                    ▼
              派生：code, duration, semester, intake, academicSession
              （readonly + 灰色背景）
```

## 设计决策

### D1：第三级「专业」选项 = 活跃专业批次记录

同一学院+层次下若同一专业名存在多个活跃批次，下拉标签显示为 `专业名 (YYYY/MM)`，值为 `programmeIntake` 唯一键。

### D2：派生字段映射

| 表单字段 | 批次来源 |
|---------|---------|
| programmeCode | programmeCode |
| duration | years |
| intake | intake |
| academicSession | startingSemester |
| semester | startingSemester 的月份部分（如 2025/09 → 09） |

faculty 为用户在第二级所选学院名称，不再从专业反向覆盖。

### D3：编辑回显

保存 `enrollment.programmeIntakeKey`。打开编辑时按 key 或 programmeCode+intake+faculty 匹配批次；若无匹配仍展示已存派生值，级联下拉尽量预选。

### D4：置灰样式

`StudentFormField` 新增 `derived` prop：`readonly`/`disabled` 输入 + 灰色背景，与可编辑白底区分。

## 风险

| 风险 | 缓解 |
|------|------|
| 演示学籍与批次种子不一致 | 补充 SWE 等批次种子并对齐 mock |
| 历史学籍无 programmeIntakeKey | infer 函数 best-effort 匹配 |
