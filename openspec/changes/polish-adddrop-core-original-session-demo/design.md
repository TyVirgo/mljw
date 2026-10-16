## Context

加课资格池 `ELIGIBLE_ADD_SEED` 含 `course-math101`（prior_drop），退课池含课表必修 MATH101 同分组，加退时触发同课同分组禁选。加课必修语义应为「以前退掉的课」，与当前可退必修不应重叠。

## Goals / Non-Goals

**Goals:**

- 加课 + 必修 Tab：名额列前展示「原上课学期」（`YYYY/MM`）
- Demo 加课必修 ≠ 退课必修课号；加课必修行默认可选
- 保留同课同分组规则

**Non-Goals:**

- 不改公选/专选/重修列
- 不改 tip 文案

## Decisions

1. **列显隐**：`isAddMode && courseTypeTab === 'core'` 时展示「原上课学期」，插在名额列前。
2. **数据**：`ELIGIBLE_ADD_SEED` 增加 `originalAcademicSession`；`mapSeedToRow` 写入课程行；单元格课级合并（同课多分组同行合并）。
3. **Demo 错开**：加课必修种子去掉 `course-math101`；新增 `course-chem101`（CORE，不在 `DEMO_REQUIRED_COURSES`）作 prior_drop，原上课学期如 `2026/04`；退课仍用 MATH101/PHYS101/INT300。
4. **规则**：`isRowBlockedByDropSameSection` 不改；错开后 demo 不再误触。

## Risks / Trade-offs

- [重修/成绩单仍引用 MATH101] → 仅动加课资格种子，不动课表必修与重修池。
