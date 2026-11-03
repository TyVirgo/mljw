## Decisions

1. **方案 A**：列表/详情用 `approval.type.*` 五分法；表单/筛选用 `approval.primaryOption.{Add|Drop|Retake}`，不改 `type.Add`/`type.Retake`。
2. 共用 `addDropTypeDisplay.js`：`addDropTypeLabelKey`、`addDropTypeTagClass`、`addDropPrimaryOptionLabelKey`。
3. 学生列表 type 列渲染 `type-tag`；详情「申请类型」同步色标。
4. 筛选仍按主类型匹配（`matchesPrimaryTypeFilter`），选项文案走 primaryOption。
