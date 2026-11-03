## 背景

`AddDropCoursePickerModal` 加课模式下，必修 Tab 已有「原上课学期」；GE/ME 仅有名额列，无法展示开课学期。资格种子 `originalAcademicSession` 对未来选修行实际表示计划开课学期。

## 目标 / 非目标

**目标：**

- GE/ME（加课）始终显示「上课学年学期」，位于名额列前；表头 tip 说明默认与白名单排序口径
- 列表按学年学期字符串比较升序（同学期内保持相对稳定）

**非目标：**

- 不对接 Study Plan API；排序键为 `YYYY/MM` 字符串比较

## 决策

1. 展示条件：`isAddMode && (ge|me) Tab`；与 `showOriginalSessionColumn`（仅 core）并列、互斥 Tab
2. 单元格：`offeringAcademicSession || originalAcademicSession || fallbackCurrentSession`（fallback 来自弹窗申请学期 / 活跃批次）
3. 排序：在 GE/ME 过滤后的列表上，按上述学期键 `localeCompare` 升序；白名单未开未来选修时多数同行，仍执行排序无害
4. tip 复用 `th-label-with-tip` 模式

## 风险

- [与「原上课学期」混淆] → 独立 i18n key 与独立 show 开关
- [当前行无学期字段] → 申请学期兜底，避免空列
