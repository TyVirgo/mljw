# 变更：student-selection-group-display

## Why

学生在线选课主表目前是扁平的「课程 × 教学分组」列表，无法看出多门不同课程是否归属同一选课约束包（如「4 门至少选 3 门」）。开课侧会配置课程组，学生端需在主表体现归属与最少选课规则，避免误读。

## What Changes

- 批次增加 `selectionGroups` 数据（demo：**ME** 三档批各 3 组；GE 不使用课程组）
- 学生在线选课主表新增 **「课程组」列**（方案 A，**仅 ME 批次**）：展示组名；无组显示 `—`
- 同组行增加 **浅蓝/浅黄交替底色**（方案 C，**仅 ME**）；构建行列表时按组聚块排序
- **GE 批次**：不展示课程组列、不应用组行底色、不聚块排序（恢复普通扁平选课表）
- **增量 §8**：主表课级 `rowspan` 合并（序号/代码/名称/类型/校选课类型/学分/课程组/先修）；**按课程分页**（每页 20 门课，同课分组不跨页）；页内分组行多时出现纵向滚动；有余量/已满按**课**过滤（任一分组命中则展示该课全部分组行）；ME 组内同课分组行必须相邻
- **增量 §9**：ME 组名 demo 改为 `Group{n}(Intake:2025/09~至今)`；操作列前新增 **备注** 列（组级 rowspan，几选几整句文案）；demo 各 1 组展示 4选3 / 3选2 / 2选1；**组感知分页**（选课组整块不跨页）；备注可换行，其余列值不换行
- **增量 §10**：课程组列两行展示（`Group{n}` + `(Intake:…~至今/Present)`）；在线选课默认 **50 门课/页**；ME 校选类型不得为「—」（同专业 demo 统一文科）；补 SE201/WEB220 课库与志愿 seed
- **增量 §11**：课程组 intake 行不换行、Group 居中；任课教师列略收窄；`synthesizeDemoMeetings` 同分组内同周几不重叠；AI101 显式 meetings
- **增量 §12**：待开放预览容量列已选恒为 0；主表/预览表表头 nowrap 自适应列宽
- i18n 中英文案；列位于「课程名称」之后、「课程分组」（教学分组）之前

## Non-goals

- 不实现提交时「组内是否选满」校验
- 不做管理端课程组配置 UI
- 不改「本轮选课情况」进度展示（如「人文包 2/3」）
- 不改课表冲突 / WeekScheduleGrid
- 不用组头折叠行（方案 B）

## Capabilities

### New Capabilities

- `course-selection-group`: 学生主表展示跨课程选课组归属与最少选课规则（仅展示）

### Modified Capabilities

- （无；`openspec/specs/` 尚无主规格，本变更为新增能力）

## Impact

- `src/data/courseRegistration/registrationBatches.js`（或独立 groups 模块）
- `src/data/courseRegistration/courseSelectionGroups.js`（新建：解析/排序辅助）
- `src/views/courseRegistration/student/StudentRegisterView.vue`
- `src/styles/course-registration-list.css` 或视图 scoped 样式
- `src/i18n/locales/zh.js` / `en.js`
