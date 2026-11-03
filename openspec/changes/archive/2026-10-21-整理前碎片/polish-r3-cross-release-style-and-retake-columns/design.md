## Context

R3 互释文案已挂在选课结果工具栏；重修汇总表在 `AddDropApplicationFormSections`。展示日期工具已有 `batchDateToPicker`；曾修列已有 `lineRetakeOriginalCourse`（`代码/名称`）。

## Goals / Non-Goals

**Goals:**

- 互释提示视觉接近「本学期累计学分」：加粗 + 浅底色；日期 `DD/MM/YYYY HH:mm:ss`
- 重修表合并「重修课程」列，并增加「是否同课程曾修」

**Non-Goals:**

- 详情页列同步、互释配置字段改动

## Decisions

1. **日期**：`r3CrossReleaseAtDisplay` 对 `resolveEffectiveCrossReleaseAt` 结果走 `batchDateToPicker`；空仍为 `—`。
2. **样式**：`.r3-cross-release-status` 设 `font-weight: 700`、浅底（如 `#eff6ff`）、圆角内边距，对齐累计学分强调感；不必拆红数字（时刻非整分数字）。
3. **同课判定**：规范化比较 `line.courseCode` 与 `line.replacesCourseCode`（空 replaces 时按现有曾修回退逻辑视同本行课号则为是）。
4. **列合并**：表头 i18n 新键 `retakeCourseColumn`（重修课程）；值 `${code}/${name}`。

## Risks / Trade-offs

- [详情页仍分列] → 表单与详情暂不一致，可后续对齐
- [无 replaces 的旧行] → 回退与 `lineRetakeOriginalCourse` 一致，避免误标「否」

## 影响文件

- `src/views/courseRegistration/RegistrationResultView.vue`
- `src/components/courseRegistration/AddDropApplicationFormSections.vue`
- `src/i18n/locales/zh.js`、`en.js`
