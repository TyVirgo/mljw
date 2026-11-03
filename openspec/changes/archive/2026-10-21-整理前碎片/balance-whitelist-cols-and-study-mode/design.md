## Context

白名单两列布局在 `SupplementEntryDrawer`；重修列在 `AddDropApplicationFormSections`；名单在 `SectionStudentRosterView`，demo 现为英文 Normal/Retake。

## Goals / Non-Goals

**Goals:** 左右列数量更匀；修读方式三值统一展示。

**Non-Goals:** 不改换组/豁免等业务逻辑。

## Decisions

1. **列平衡**：左列 = 父项+可加/退/重修 + 未来必修/选修勾选；右列 = 换组 + 豁免 + 超学分 + 退课下限。未来学期下方配置块仍全宽。
2. **枚举键**：`normal` | `retakeSameCourse` | `retakeSameGroup`；i18n 在 `courseRegistration.studyMode.*`。
3. **重修表**：`courseCode === replacesCourseCode`（含既有回退）→ retakeSameCourse，否则 retakeSameGroup；永不显示 normal。
4. **名单**：demo 轮转三值；展示用 i18n；筛选改为下拉三值+全部（替换模糊英文）。
5. **旧键**：`retakeSameCourseAsOriginal` 标记弃用，改指向修读方式文案或新键。

## Risks / Trade-offs

- [旧导出含 Normal/Retake] → demo 刷新后为新键；导出同步 label

## 影响文件

- `SupplementEntryDrawer.vue`
- `AddDropApplicationFormSections.vue`
- `sectionStudentRoster.js`、`SectionStudentRosterView.vue`
- `zh.js`、`en.js`
