# 设计
## Programme Structure 命名

```
intake: 2024/09  →  period: 202409
programme: Bachelor of Software Engineering (Honours)
           → shortName: Software Engineering

→ Programme Structure of Software Engineering (202409 Version)
```

- 专业简称：去掉 `Bachelor of / Bachelor in / (Honours)`（沿用 `programmeShortName`）
- 批次：由 `parseIntakeBatch` + `formatIntakeBatch` 得到 YYYYMM
- 培养方案目录无匹配 code 时，回退用 `enrollment.programme` 名称推导简称

## normalizeStudent 回填

```
enrollment.intake 存在
  ├─ registrationTime 空 → syncRegistrationTimeWithIntake
  ├─ expected* 空 → syncEnrollmentDerivedScheduleFields
  └─ programmeStructure 空 + programmeCode → formatEnrollmentProgrammeStructure(code, intake, programme)
```

Outstanding Fee **不在 normalize 中默认**；在 seed `basicInfo.outstandingFee` 逐条填写 N/Y。

## 与 Enrollment 表单一致

`resolveEnrollmentByProgrammeIntakeKey` 写入 programmeStructure 时传入 `item.intake`，与列表规则相同。
