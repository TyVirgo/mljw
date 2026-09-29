# 设计：polish-r1-skip-already-completed

## Context

- `evaluateCourseEligibility`：`passedCodes.has(course.code)` → `alreadyCompleted` → 整课 `eligible=false`
- Demo 学生已修 COMP101，ME 课库仍挂 COMP101 → R1 全部分组灰掉
- `getSelectableCoursesForStudent` / `assertEligibleAndNotInCart` 已把 `roundKey` 传入 `buildEligibilityContext`
- R1 `isCourseOccupied(courseId, sectionId)` 已按分组占用

## Goals / Non-Goals

**Goals:**

- R1 不因成绩单已修禁交志愿、不展示「已修读该课程」禁因
- 同课已交一组，其它组仍可交
- R2/R3 保留已修读门禁

**Non-Goals:**

- 不改占用文案体系（R2/R3「已选/排队」仍独立）

## Decisions

### 1. 在资格层按轮次跳过

```js
if (passedCodes.has(code) && context.roundKey !== 'preselect') {
  // alreadyCompleted
}
```

UI / 提交门禁共用同一 `eligibility`，无需三处各写过滤。

### 2. 同课多分组

不改 `isCourseOccupied`；规格确认 R1 仅同 `sectionId` 占用。

## Risks

| 风险 | 缓解 |
|------|------|
| roundKey 未传入时误跳过 | 仅当显式 `preselect` 才跳过；空 roundKey 仍拦已修 |
| 已修课进 R1 志愿池 | 产品允许；抽签多分组只取一个 |

## 影响文件

- `src/data/courseRegistration/studentEligibility.js`
