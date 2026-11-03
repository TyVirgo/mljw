## 增量（2026-07）

- [x] 列表分页：选课管理菜单主页默认每页 20
- [x] 补注册编辑抽屉：勾选行与 footer 对齐批次表单

## 历史来源任务摘要

### add-course-capacity-settings

```
## 1. 实现

- [x] 1.1 enrich/导入写入 sourceCapacity 与新生老生配额；已选拆分 demo
- [x] 1.2 updateCoursesCapacityPercent API
- [x] 1.3 容量设置弹窗
- [x] 1.4 主表列与按钮、i18n/tooltip

## 2. 补强

- [x] 2.1 文案「源最大容量」+ tooltip
- [x] 2.2 弹窗默认当前百分比；确认后主表立即刷新
- [x] 2.3 主表 nowrap + 横向滚动

## 3. 列与冻结

- [x] 3.1 恢复「已选/有效最大容量」+ tooltip
- [x] 3.2 「容量设置」百分比列
- [x] 3.3 左冻结 ☐/序号/代码/名称

## 4. 说明文案

- [x] 4.1 可选设置弹窗 hint + help
- [x] 4.2 源最大容量 / 有效最大容量 tip 补充含义
```

### add-course-programme-scope-settings

```
## 1. 实现

- [x] 1.1 专业选项并集 + updateCoursesProgrammeScope API
- [x] 1.2 专业范围设置弹窗（不限/多选）
- [x] 1.3 主表按钮、列、i18n
```

### add-course-registration-module

```
## 1. 门户与骨架

- [x] 1.1 `AcademicPortalView` 增加选课管理应用卡片（developed: true）
- [x] 1.2 `App.vue` 增加 `course-registration` 视图切换与默认页 `cr-batch`
- [x] 1.3 新建 `courseRegistrationMenu.js`、面包屑、`courseRegistrationDevelopedPages`
- [x] 1.4 i18n 增加 `menu.courseRegistration` 及 10 个子菜单中英文
- [x] 1.5 Phase 2/3 页面路由到 `UnderConstructionView`

## 2. 公共组件与数据

- [x] 2.1 `ExternalDataHint.vue` — 外部数据 tooltip 组件
- [x] 2.2 `RegistrationBatchStatusBadge.vue` — 批次状态标签
- [x] 2.3 `CreditProgressRing.vue` — 学分进度展示（监控抽屉用）
- [x] 2.4 `WeekScheduleGrid.vue` — 周课表网格（冲突高亮）
- [x] 2.5 demo 数据：`registrationBatches.js`、`selectableCourses.js`、`registrationMonitorQueue.js`、`addDropApprovalQueue.js`、`registrationRules.js`

## 3. Phase 1 页面

- [x] 3.1 **选课批次** `RegistrationBatchView.vue` + `RegistrationBatchFormDrawer.vue`
- [x] 3.2 **可选课程** `SelectableCoursesView.vue` + `SelectableCourseDetailDrawer.vue`
- [x] 3.3 **学生选课监控** `RegistrationMonitorView.vue` + `RegistrationMonitorDetailDrawer.vue`
- [x] 3.4 **加退课/重修审批** `AddDropApprovalView.vue` + `AddDropApprovalDetailDrawer.vue` + `addDropApprovalEngine.js`

## 4. Phase 2 页面

- [x] 4.1 **补注册名单** `SupplementListView.vue`
- [x] 4.2 **选课结果** `RegistrationResultView.vue`（学生/课程双视图）
- [x] 4.3 **学业预警** `AcademicAlertView.vue`
- [x] 4.4 监控/预警 → 补注册名单联动动作
- [x] 4.5 导出 Excel（批次、监控、审批队列）

## 5. Phase 3 页面

- [x] 5.1 **候补名单** `WaitlistView.vue` + `WaitlistDetailDrawer.vue`（人工审批，无自动递补）
- [x] 5.2 **白名单管理** `WhitelistView.vue` + `WhitelistDetailDrawer.vue`
- [x] 5.3 **选课报表** `Registrat
```

### hide-registration-report-menu

```
## 1. 菜单与路由

- [x] 1.1 侧栏去掉 `cr-report`；developedPages 同步移除
- [x] 1.2 App.vue 去掉报表 import / 条件渲染；分组 i18n 改为特殊名单

## 2. 导览与 brief

- [x] 2.1 流程导览去掉报表节点；阶段 J 关联页清空
- [x] 2.2 moduleBriefs 去掉 `cr-report`
```

### mark-prototype-callouts

```
## 1. 文案与样式

- [x] 1.1 i18n：`common.prototypeOnlySuffix`（中/英，挂在根级 `common`）
- [x] 1.2 `StudentRegisterView`：轮次说明改 Callout；panel / 篮 tip / tooltip 加后缀
- [x] 1.3 学生候补只读说明等纯讲解 Callout 加后缀；业务 warning 不加
- [x] 1.4 修复后缀键误挂 `modal` 导致界面显示 key 原文的问题
```

### move-module-brief-to-breadcrumb

```
## 1. 面包屑与说明组件

- [x] 1.1 `PageBreadcrumb` 支持右侧 slot，与 crumbs 同行两端对齐
- [x] 1.2 精简 `ModuleBriefPanel`：仅保留页面说明；去掉学生信息与受众徽章
- [x] 1.3 `App.vue` 在选课应用下将 `ModuleBriefPanel` 挂到面包屑右侧

## 2. 各页移除顶栏

- [x] 2.1 `StudentPageShell` 与全部 `cr-*` / `crs-*` 页移除内嵌 `ModuleBriefPanel`
- [x] 2.2 确认有 brief / 无 brief 页布局与说明气泡正常
```

### polish-course-group-label-and-menu

```
## 1. 实现

- [x] 1.1 学生列表列头改为课程分组
- [x] 1.2 Demo 调整为 9 行
- [x] 1.3 模块说明一级标题分行
```

### polish-student-page-layout

```
## 1. 排版统一

- [x] 1.1 加退课：callout+演示周上移，去掉「我的申请 · N」
- [x] 1.2 候补结果：顶 tip，去掉「候补结果 · N」
- [x] 1.3 选课结果：阶段提示改 callout，去掉「已选课程」
- [x] 1.4 在线选课：去掉「可选课程列表」标题与 meta
```

### realign-cr-admin-menu-ia

```
## 1. 菜单与文案

- [x] 1.1 重组 `courseRegistrationMenu.js` 为四段 IA
- [x] 1.2 更新 zh/en 一级菜单命名
```

### remove-student-page-note-to-brief

```
## 1. 学生端去占位行

- [x] 1.1 在线选课移除批次名 + 轮次说明行；说明写入 brief
- [x] 1.2 选课结果 / 候补结果 / 加退课移除批次名占位；静态说明写入 brief
- [x] 1.3 保留加退课通道 callout、退选阶段关闭等状态提示
```

### scope-multiselect-course-selectable

```
## 1. 实现

- [x] 1.1 范围规则数组模型与匹配（`faculties[]` / `programmes[]` / `intakes[]`）
- [x] 1.2 范围弹窗多选 Tag UI；文案「选课轮次」「全部轮次」
- [x] 1.3 范围表展示适配 `formatDimList`
- [x] 1.4 课程 `isSelectable`；主表多选 +「是否可选」列；去掉开放轮次
- [x] 1.5 可选设置弹窗对齐图示3（标题「是否可选」、*单选、取消/确定、回写）
```

### simplify-special-application-flow

```
## 1. 菜单收敛

- [x] 1.1 去掉例外分组与白名单菜单；补注册移入过程组；更新 developedPages
- [x] 1.2 流程说明 / briefs / i18n 与主路径对齐（白名单标为暂缓）

## 2. 补注册瘦身

- [x] 2.1 `supplementListQueue`：类型仅 supplement；清洗 demo 数据；监控加入逻辑同步
- [x] 2.2 `SupplementListView`：去掉多类型筛选噪音，文案改为开门名单

## 3. 申请 / 审批主链

- [x] 3.1 学生申请：联合 Drop+Add；窗口外名单校验；隐藏 Replace
- [x] 3.2 审批：隐藏 Replace；确保通过写回结果；文案/callout 对齐主流程

## 4. 监控轻优化

- [x] 4.1 监控页保留一键补注册与跳转；统计/筛选项保持可用、不扩 scope
```
