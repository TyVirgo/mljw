## Context

`WhitelistCoursePickModal` 服务先修豁免（course）与未来必修/换组（section）；`AddDropCoursePickerModal` 服务加退课选课。两者均用课级 rowspan + 分组分行列。

## Goals / Non-Goals

**Goals:**

- 列序：课级字段在前、分组字段在后
- section 模式：每行分组独立勾选

**Non-Goals:**

- 不改 course 模式勾选；不改数据模型

## Decisions

1. **白名单列序**：`代码 | 名称 | 学分 | 分组 | 教师 | 时间`。
2. **加退课列序**：`勾选 | 序号 | 代码 | 名称 | [课程组] | 学分 | 类别 | [原上课学期] | 分组 | 教师 | 周次 | 时间 | [重修史] | [是否可选/名额]`（条件列仍按原 show* 开关）。
3. **section 勾选**：checkbox 不再 rowspan；`toggleSection(sectionKey)`；表头/全选按当前页或过滤结果的分组键；`pickedCount` = 已选 sectionKeys 数量；`sectionPickHint` 改为分组粒度说明。
4. **换组弹框**：同 `selectionUnit=section`，一并细化（与未来必修一致）。

## Risks / Trade-offs

- [旧提示文案误导] → 同步改 i18n
- [半选态表头] → 按页内分组键计算 indeterminate

## 影响文件

- `src/components/courseRegistration/WhitelistCoursePickModal.vue`
- `src/components/courseRegistration/AddDropCoursePickerModal.vue`
- `src/i18n/locales/zh.js`、`en.js`
