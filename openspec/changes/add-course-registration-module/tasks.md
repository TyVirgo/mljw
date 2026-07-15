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
- [x] 5.3 **选课报表** `RegistrationReportView.vue`
- [x] 5.4 演示环境默认入口：`App.vue` 刷新直达 `course-registration` / `crs-register`（学生端）
- [x] 5.5 Demo 数据增厚：批次/课程/监控/审批/补注册全类别覆盖
- [x] 5.6 学生端选课五页：`StudentRegisterView` 等 + demo 种子数据 + 队列联动

## 11. 学生端体验收敛（Phase 5）

- [x] 11.1 `RoundTimelineBar.vue` — 四轮时间轴组件，5 页复用
- [x] 11.2 课表/加退课/候补/结果页补充统计卡、page-note、批次上下文
- [x] 11.3 选课队列改为半透明灯箱；等待时间默认 5–8 秒
- [x] 11.4 按钮 `link-btn`、tooltip popover 与学籍模块对齐
- [x] 11.5 更新 proposal / design / spec

## 12. 在线选课页排版与轮次交互

- [x] 12.1 G1 进度收拢至统计卡内；移除主区 G1 大面板
- [x] 12.2 `RoundTimelineBar` 在线选课可点击切换 + 轮次 tooltip
- [x] 12.3 轮次差异化内容：预选志愿 / 正选补选列表；Add/Drop 点击直接菜单跳转
- [x] 12.4 `selectableCourses` demo 扩充至 15 门（batch-2504-m1）

## 13. 选课资格引擎（Phase 6）

- [x] 13.1 新建 `studentEligibility.js`（范围/学籍/先修/已修/受众判定）
- [x] 13.2 `getSelectableCoursesForStudent` / `addToCart` 接入资格引擎
- [x] 13.3 `StudentRegisterView` 资格列、不可选原因、筛选与统计卡
- [x] 13.4 demo 数据：`SWE×2409` 批次范围、`SWE302` 专业限选、i18n 文案
- [x] 13.5 更新 proposal / design / spec

## 14. 模块流程说明页（Phase 7）

- [x] 14.1 菜单置顶 `cr-flow-guide` + `courseRegistrationFlowGuide.js` 数据
- [x] 14.2 `CourseRegistrationFlowGuideView` 单页四段布局 + 节点/联动可点击跳转
- [x] 14.3 时间轴阶段点击高亮关联节点
- [x] 14.4 i18n 中英文 + `course-registration-flow-guide.css`
- [x] 14.5 更新 proposal / design / spec

## 15. 批次抽屉体验对齐（Phase 8）

- [x] 15.1 四步序号 + field-label 必填/选填标注
- [x] 15.2 学年学期 `academicSession` 下拉（2024/09 格式）+ demo 数据迁移
- [x] 15.3 轮次日期 `DatePickerEn` + `registrationBatchFormUtils` 格式转换
- [x] 15.4 草稿最小保存校验；列表搜索学年学期下拉
- [x] 15.5 更新 proposal / design / spec

## 16. 类型术语 ME/GE/Mandatory（Phase 9）

- [x] 16.1 `registrationTypes.js` + M1/G1→ME/GE 迁移与兼容
- [x] 16.2 批次抽屉类型 tooltip + 下拉标签；列表/导出展示
- [x] 16.3 课程 type、学生筛选、详情抽屉同步
- [x] 16.4 监控/预警/流程说明 i18n：G1 展示改为 GE
- [x] 16.5 更新 proposal / design / spec

## 17. 学生端课程详情与列表优化（Phase 17）

- [x] 17.1 新建 `CourseSectionCard.vue` — 教学分组卡片（选中/满员禁用）
- [x] 17.2 新建 `StudentCourseDetailDrawer.vue` — 三段 section + footer「立即选课」，无资格区块
- [x] 17.3 `StudentRegisterView` 列表：合并名额状态列；资格短标签 + tooltip；操作列仅按钮
- [x] 17.4 立即选课：单分组直达加购；多分组打开详情选组
- [x] 17.5 i18n 中英文 + `course-registration-student.css` 样式
- [x] 17.6 更新 proposal / design / spec

## 19. 批次与可选课程融合（Phase 19）

- [x] 19.1 新建 `CourseLibraryImportModal` — 课程库多选导入
- [x] 19.2 新建 `BatchCoursesDrawer` — 绑定批次的课程管理抽屉
- [x] 19.3 `RegistrationBatchView` 操作列「管理课程」+ 课程数打开抽屉
- [x] 19.4 侧边栏移除 `cr-courses`；`App.vue` 旧路由重定向
- [x] 19.5 流程说明 / i18n / 扩 `courseLibraryDemo`；更新 proposal / design / spec
- [x] 19.6 `BatchCoursesDrawer` 样式对齐列表页：搜索→工具栏→表格；补全 btn 样式；空态引导导入

## 20. 批次列表轮次拆列（Phase 20）

- [x] 20.1 `formatRoundRange`：按阶段输出时间段，格式与 DatePickerEn 一致（DD/MM/YYYY）
- [x] 20.2 批次列表四列：预选 / 正选 / 补选 / Add/Drop
- [x] 20.3 导出字段与列表一致四列；移除合并 `roundsSummary` 导出项
- [x] 20.4 i18n + 更新 proposal / design / spec

## 21. 学生端排课四字段（Phase 21）

- [x] 21.1 `sectionScheduleFields.js` + demo section 补齐 weekRange / classTime
- [x] 21.2 `CourseSectionCard` 四字段标签布局；起止周/上课时间 ⓘ 说明
- [x] 21.3 选课篮、课表、选课结果同步四字段；管理端教学分组表同步
- [x] 21.4 i18n + 更新 proposal / design / spec

## 22. 术语：班 → 分组 / Section → Group（Phase 22）

- [x] 22.1 `zh.js` 选课模块：教学班→教学分组、班号→分组编号等全量替换
- [x] 22.2 `en.js` 选课模块：Section→Group、Sections→Groups、Group No. 等全量替换
- [x] 22.3 注释/OpenSpec 用语同步；代码标识 `section` 不改名

## 23. 学生端加退课申请体验（Phase 23）

- [x] 23.1 去掉 RoundTimelineBar；工具栏仅批次名 + 发起申请
- [x] 23.2 「发起申请」弹框填类型/课程并提交；Drop 用已选课程
- [x] 23.3 修复 approval.type 键冲突；类型本地化
- [x] 23.4 页内/弹框 Callout；弹框按钮底色
- [x] 23.5 「申请内容」→「申请课程」，仅展示课号

## 24. 候补 / 选课结果去统计卡（Phase 24）

- [x] 24.1 `StudentMyWaitlistView` 去掉 stats-row
- [x] 24.2 `StudentMyResultView` 去掉 stats-row
- [x] 24.3 更新 proposal / design / spec

## 25. 我的候补只读（Phase 25）

- [x] 25.1 去掉候补页 join 区与 RoundTimelineBar；仅当前学生记录
- [x] 25.2 更新 waitlist 提示 / module brief；状态本地化
- [x] 25.3 更新 proposal / design / spec

## 26. 在线选课 demo 情况覆盖（Phase 26）

- [x] 26.1 重构 selectableCourses demo 覆盖与精简
- [x] 26.2 sortCoursesForStudentDemo；waitlistCourses / demo seed 对齐满员可选课
- [x] 26.3 更新 proposal / design / spec

## 27. 在线选课去统计卡（Phase 27）

- [x] 27.1 `StudentRegisterView` 去掉 stats-row 及相关无用计算
- [x] 27.2 更新 proposal / design / spec

## 28. 我的课表去统计卡（Phase 28）

- [x] 28.1 `StudentScheduleView` 去掉 stats-row 及相关无用计算
- [x] 28.2 更新 proposal / design / spec

## 29. 弹框提示与课表轮次条精简（Phase 29）

- [x] 29.1 加退课弹框去掉内嵌 Callout
- [x] 29.2 我的课表去掉 RoundTimelineBar 与 page-note
- [x] 29.3 更新 proposal / design / spec

## 30. 详情 / 选课 / 候补职责拆分（Phase 30）

- [x] 30.1 详情抽屉只读（无选中态、无 footer 选课）
- [x] 30.2 立即选课始终打开 `StudentSectionPickerDrawer`
- [x] 30.3 候补进篮（预计位）+ 提交时入队列；选课篮展示区分 intent
- [x] 30.4 更新 proposal / design / spec / i18n

## 6. 联调预留（非 Phase 1）

- [ ] 6.1 Study Plan 同步接口占位
- [ ] 6.2 财务账单状态接口占位
- [ ] 6.3 课程库/排课只读 API 替换 demo 数据

## 7. 验证

- [x] 7.1 Phase 1 冒烟：创建批次 → 配置课程 → 监控学生 → 审批 Add/Drop/Retake 演示路径
- [ ] 7.2 `npm run build` 通过

## 8. 布局对齐（Phase 3 补充）

- [x] 8.1 新建 `course-registration-list.css`，统一 page-card / toolbar / table-section 样式
- [x] 8.2 10 个列表页调整为「搜索区 → 工具栏 → 表格」顺序，对齐 `StudentProfileView` / `MovementApprovalView`
- [x] 8.3 审批页导出按钮从 Tab 栏移至工具栏；移除工具栏「共 N 条」冗余展示（分页组件已含总数）
- [x] 8.4 更新 proposal / design / spec 记录布局规范

## 9. 视觉增强与模块说明（Phase 4）

- [x] 9.1 `CourseRegistrationCallout` 三级底色（info / warning / rule）
- [x] 9.2 `ModuleBriefPanel` — 每页顶部调研来源 + 需求要点 + 本页功能
- [x] 9.3 选课报表默认选中首张卡片、去掉关闭、明细常驻、i18n 列头
- [x] 9.4 候补/白名单/审批等关键说明升级为 callout

## 10. 核心功能加厚（Phase 4）

- [x] 10.1 批次表单结构化轮次（Pre/Main/Supp + Add/Drop + 退课周）
- [x] 10.2 白名单新建申请 `WhitelistFormDrawer`
- [x] 10.3 高并发选课队列 `RegistrationQueueOverlay`（半透明灯箱；监控/学生提交/加课审批）
- [ ] 10.4 `npm run build` 验证
