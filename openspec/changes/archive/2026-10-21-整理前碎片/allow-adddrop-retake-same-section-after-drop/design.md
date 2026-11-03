## Terminology

- **课程分组（同组）**：同一 `courseCode` + 同一 `sectionCode`（如 MATH101::01）
- **课程组**：仅选修 GE/ME 组内替代，与本锁无关

## Rules

| 路径 | 同课程分组 | 异课程分组 |
|------|------------|------------|
| 加退 · 必修 | 允许（默认） | 需白名单换组 |
| 重修（含退）· 必修 | 允许 | 允许（无换组锁） |

## Implementation

1. 删除 `validateAddDropSectionForm` 中 `hasSameCourseSameSectionOverlap(dropLines, addLines)`。
2. 保留 `hasCoreOtherSectionReaddViolation`（仅 addLines / 加课路径）。
3. `addDropSameCourseSameSection` 标 `@deprecated`。
