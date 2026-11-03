## Decisions

1. 仅移除详情 UI 中 `dropChannel` / `teachingWeek` 展示块；附件必填等仍可读 `dropChannel === 'special'`。
2. 课性展示：用 `formatUnifiedCourseCategoryLabel`；解析对象合并 item 与课库（`getCourseById` / `getCourseByCode`），保证缺行字段时仍得 GE0x/ME0x。
3. 表头文案：列名可仍用现有 `courses.type`（课程类型）；**值**必须为统一类别。
4. Demo：优先依赖课库回落；对无课库命中的码补 `type` + `schoolElectiveCategory`。

## Risks

- 课库缺校选时统一码默认 GE01/ME01（`schoolElectiveToIndex` 缺省 1）——与选课侧一致。
