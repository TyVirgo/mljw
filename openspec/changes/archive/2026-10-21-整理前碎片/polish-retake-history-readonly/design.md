## Context

在已完成的重修节只读改造之上，补齐：退课禁必修、重修关联「退费抵免」冲抵计费、选课提示与超出学分同源。

相关文件：`addDropFeeRates.js`、`StudentAddDropView.vue`、`AddDropCoursePickerModal.vue`、`studentTranscript.js`。

## Goals / Non-Goals

**Goals:**

- 重修节曾修成绩历史只读（中文等级 / 缺考）
- 退课侧仅选修；与课表 confirmed 选修同源
- RetakeDrop：`feeWaiver === yes` 时冲抵；`amount` 与 `billableCredits` 同源；选重修课即算好并条件提示
- 表单超出学分 = 上述 billableCredits

**Non-Goals:**

- 不改 GE/ME 加课文商理超额公式
- 不开放退必修

## Decisions

### 1–5（既有）

成绩历史合并、中文映射、去分组下拉、只读带回、demo 成绩单 — 保持不变。

### 6. 退课仅选修

- Drop / AddDrop / RetakeDrop 的退课选课列表：排除 `type === 'CORE'` 与 `sourceType === 'required'`。
- 数据仍来自课表 confirmed 半池（与我的课表选修一致）；必修仅出现在课表预览。

### 7. 重修关联费用与退费抵免

「抵扣费用」= 表单「退费抵免」`feeWaiver === 'yes'`。

```
estimateRetakeFee({ course, dropCourse, feeWaiverOffset })
  baseRate = 科类单价
  retakeCr = 重修学分
  if feeWaiverOffset && dropCourse:
    billable = max(0, retakeCr − dropCredits)
  else:
    billable = retakeCr
  amount = billable × baseRate
```

- 纯 Retake：无退课，整课计费。
- RetakeDrop + 抵免否：整课计费。
- RetakeDrop + 抵免是：仅超出部分计费；相等则 0 费用、不提示。

选课弹窗在选重修（含 RetakeDrop 的重修侧）时传入已选退课学分与是否抵免；`billable > 0` 才页脚提示 + 确认框。表单超出学分读同一结果。

### 8. 成绩匹配加固

`listTranscriptForRetakeCourse` 同时按 `retakeCourseId` 与课号匹配，避免 courseId 为课号时带出为空。

### 9. 重修类型默认不及格重修

- `RETAKE_TYPE_OPTIONS`：`failed` 置顶，其次 `improve_grade`。
- 新建/切到 `Retake`|`RetakeDrop` 且 `retakeType` 为空时默认 `failed`；编辑已有申请保留原值。
- 下拉去掉 `value=""` 的「请选择」；`retakeTypeFirstHint` 文案不动。

## Risks / Trade-offs

- [先选重修再改退费抵免] → watch feeWaiver / dropCourse 重算 feeEstimate（computed 已覆盖表单；弹窗仅在打开时用当前值）。
- [抵免语义与退费文案] → 产品已确认等同；文案暂不改字段名。

## Migration Plan

纯前端；无后端迁移。

## Open Questions

无。

## 影响文件

| 路径 | 改动 |
|------|------|
| `addDropFeeRates.js` | `estimateRetakeFee` 冲抵 |
| `StudentAddDropView.vue` | 退课过滤；RetakeDrop 计费；picker 传参 |
| `AddDropCoursePickerModal.vue` | 冲抵后计费与提示 |
| `studentTranscript.js` | 课号匹配加固 |
| proposal/design/spec/tasks | 本增量 |
