## Context

两层重修已落地：原课程表 +「选择重修课程」进弹框。类别 Tab（必修/公选/专选）仍在 `AddDropCoursePickerModal`，加课与重修共用 `showCourseTypeTabs`。原课程表目前每课只显示最新一条成绩与学期，操作列偏窄。

## Goals / Non-Goals

**Goals:**

- 退课四学分 1×4。
- 原课程区标题、列结构、多行成绩与外层类别 Tab。
- 重修弹框隐藏类别 Tab，按原课类型锁定候选；加课弹框不变。

**Non-Goals:**

- 加课 Tab / 筛选。
- 不及格门槛与费用逻辑。

## Decisions

1. **过滤分工**：`form.retakeType` 下拉 → 不及格/提升池（沿用 `listTranscriptLatestByRetakeType`）；外层 `retakeOriginalCourseTypeTab`（core/ge/me）→ 再滤原课列表。二者叠加，互不替代。
2. **多行成绩**：按课聚合后用 `listTranscriptForRetakeCourse` 取历史，展示 `session：grade`（最新在上）；池归属仍看最新一条 + `isFailingGrade`。
3. **课程类型列**：用既有 `formatUnifiedCourseCategoryFromLine` / 成绩单字段映射，与明细「课程类型」一致。
4. **弹框锁定**：重修打开时根据 `retakeFocusOriginal` 推导 CORE/GE/ME，设内部 `courseTypeTab` 且不渲染 Tab；加课仍 `showCourseTypeTabs = isAddMode`。
5. **退课学分布局**：`fields-row-2` → `fields-row-4`（样式已存在）。

## Risks / Trade-offs

- [原课类型字段缺失] → 回退 CORE 或按成绩单/课程库补全 demo 数据。
- [外层 Tab + 下拉叠加后空表] → 空态文案保留；切 Tab/类型可恢复。
- [操作列加宽挤压名称] → 名称列 ellipsis + title。

## Migration Plan

纯前端；刷新即可。无需数据迁移。

## Open Questions

- （无；拍板：加课不变；两侧标题均带 *；下拉分池 + 外层 Tab 调类别。）
