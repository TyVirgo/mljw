# 选课管理-学生选课结果与历史 — 任务清单（合并归档）

> 历史 tasks 已在各次 apply 中完成。本清单仅作追溯；**无需再次实现**。

- [x] 1. 合并本菜单下历史变更包为中文需求包
- [x] 2. 保留合并来源列表便于需求文档回溯
- [x] 3. 删除已被合并的旧变更目录

## 增量（2026-07 选课历史学年学期与左冻结）

- [x] 1.1 行映射学年学期；表列放课程名称后；搜索下拉过滤
- [x] 1.2 左冻结序号/课程代码/课程名称；保持横滑
- [x] 1.3 i18n（若需）

## 历史来源任务摘要

### enrich-student-history-batch-retake

```
## 1. 实现

- [x] 1.1 demo 补 isRetake；行映射 batchName
- [x] 1.2 选课历史表列 + i18n

## 2. 排版与操作人

- [x] 2.1 表区横向滚动；非批次列 nowrap；批次名称单行省略
- [x] 2.2 操作人：自选=学生姓名，管理员=管理员名；更新 hint
```

### polish-student-waitlist-list

```
## 1. 数据层

- [x] 1.1 `waitlistQueue` 扩列映射、新增 demo 课程
- [x] 1.2 `studentDemoSeed` 增加 `syncDemoWaitlistEntries`

## 2. 页面与 i18n

- [x] 2.1 `StudentMyWaitlistView` 搜索、分页、扩列
- [x] 2.2 i18n 搜索占位文案
```

### refine-student-my-result-unselect

```
## 1. 结果页布局

- [x] 1.1 `StudentMyResultView`：移除 `RoundTimelineBar`；保留 ModuleBrief（经 StudentPageShell）与简短退选/退课区分说明
- [x] 1.2 增加课程名称搜索区（查询 / 重置），复用列表搜索样式

## 2. 表格回显与退选

- [x] 2.1 表格列对齐确认结果字段：序号、课号、课名、学分、分组编号、任课教师、起止周、上课时间、上课地点、操作；列名复用既有 i18n（教学分组/分组编号）
- [x] 2.2 数据行优先来自 `studentConfirmedCourses`（与在线选课提交结果一致）
- [x] 2.3 操作列「退选」：选课阶段可点；确认后调用退选逻辑

## 3. 退选数据逻辑

- [x] 3.1 在 `studentRegistrationStore`（或邻近模块）实现 `unselectConfirmedCourse`：移除 confirmed、更新 schedule、尽量回退 section.enrolled、同步 monitor 行
- [x] 3.2 非选课阶段禁用/隐藏退选，并提示改走加退课办理退课（仅文案）

## 4. 文案与冒烟

- [x] 4.1 补充 zh/en：搜索、退选、确认提示、阶段禁用说明
- [x] 4.2 冒烟：选课确认 → 结果回显字段一致 → 退选后列表与名额变化

## 5. 演示数据加厚与分页

- [x] 5.1 `studentDemoSeed`：加厚 `studentConfirmedCourses`（约 12～13 行，覆盖 ME/GE、学分档、多分组、缺省字段、不同起止周）；同步 schedule 与监控行
- [x] 5.2 `StudentMyResultView`：接入 `TablePagination`；搜索/重置回到第 1 页；序号按页偏移
- [x] 5.3 冒烟：默认超过一页；检索后分页正确；退选仍可用

## 6. 在线选课 / 结果页对半可操作

- [x] 6.1 拆分演示种子：约一半课程进 `studentConfirmedCourses`（可退选）；监控补充 `passedCourses`；同步学分/课表
- [x] 6.2 调整/增补 `selectableCourses`：可选半池有余量且资格通过；保留少量不可选样例
- [x] 6.3 结果页 `pageSize` 适配半池条数（如默认 5）；冒烟双菜单均可操作
```

### remove-student-my-schedule

```
## 1. 菜单与页面卸载

- [x] 1.1 从 `courseRegistrationMenu.js` 移除 `crs-schedule` 菜单项与 `developedPages` 条目
- [x] 1.2 从 `App.vue` 移除 `StudentScheduleView` 导入、计算属性与模板分支
- [x] 1.3 删除 `StudentScheduleView.vue`；从 `courseRegistrationModuleBriefs.js` 移除 `crs-schedule` 配置

## 2. 队列成功 CTA

- [x] 2.1 `RegistrationQueueOverlay`：事件改为 `view-result`，按钮文案改为查看选课结果
- [x] 2.2 `App.vue` 监听改为导航至 `crs-result`

## 3. 流程说明与文案

- [x] 3.1 `courseRegistrationFlowGuide.js`：去掉学生课表节点；阶段 G 与跨链指向选课结果
- [x] 3.2 更新 `zh.js` / `en.js`：菜单、队列 CTA、流程节点/链接、成功提示、briefs；删除仅课表页使用的键

## 4. 冒烟

- [x] 4.1 确认学生侧栏为四项且无「我的课表」；队列成功 CTA 进入「我的选课结果」
```

### remove-waitlist-enrich-history-search

```
## 1. 实现

- [x] 1.1 去掉候补结果菜单与路由/指引引用
- [x] 1.2 选课历史多字段搜索
- [x] 1.3 可选学生名单去掉批次/学院搜索
```

### rename-result-waitlist-add-selected-at

```
## 1. 文案与数据

- [x] 1.1 菜单与相关 i18n：选课结果 / 候补结果（中英）
- [x] 1.2 确认课增加 `selectedAt`：demo 种子 + 提交写入
- [x] 1.3 选课结果表增加选课时间列（`YYYY-MM-DD HH:mm:ss`）
```

### rename-section-code-to-group-name

```
## 1. i18n 与展示

- [x] 1.1 列头改为分组名称/Group Name
- [x] 1.2 单元格与分组卡片展示完整名称（分组名称01）
```
