## Context

`allowFutureMandatory` 为布尔，放开 futureSession 必修。选修需独立权限与额度配置。

## Goals / Non-Goals

**Goals:**

- 新权限勾选后配置 GE 学分、ME 学分、ME 类别多选
- GE 无组选择器（学生可选 GE 即一大组）
- 加课池按配置纳入未来学期选修

**Non-Goals:**

- 不改必修权限
- 不强制先修式课号清单

## Decisions

1. **key**：`allowFutureElective`；非邀请门。
2. **落库**（permission 扩展字段）：
   - `geCredits` / `meCredits`：正整数
   - `meCategoryKeys`：`group4of3` | `group3of2` | `group2of1` | `ordinary`（与现进度文案一致）
3. **表单**：勾选后展开两行学分 + ME 类别 checkbox 组；未勾清空配置。
4. **加课池**：seed 增加 `futureSession` 的 GE/ME；有权限时纳入；ME 须 `selectionGroupToMeKey` ∈ `meCategoryKeys`；GE 仅 `courseMatchesStudentSchoolElective`。学分字段用于校验/提示额度（演示：tip 展示额度；选课合计超额度可软提示，首期以展示+落库为准）。
5. **校验**：勾选则 GE、ME 学分均 ≥1；ME 至少选一类。

## Risks / Trade-offs

- [与必修权限并列] → 文案区分「必修 / 选修」；formHint 增⑤。
