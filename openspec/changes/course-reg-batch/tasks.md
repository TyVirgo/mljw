# 选课管理-选课批次 — 任务清单（合并归档）

> 历史 tasks 已在各次 apply 中完成。本清单仅作追溯；**无需再次实现**。

- [x] 1. 合并本菜单下历史变更包为中文需求包
- [x] 2. 保留合并来源列表便于需求文档回溯
- [x] 3. 删除已被合并的旧变更目录

## 增量（2026-07 学生范围·专业批次·每轮一条）

- [x] 1.1 `batchScopeRules`：`programmeIntakes` 维度；默认全部；旧 programmes×intakes 迁移；匹配按专业批次码
- [x] 1.2 弹窗：学院+专业批次，非必填默认全部，无联动
- [x] 1.3 管理轮次：每轮至多一条；表列专业批次；学生数量可点开名单对应轮
- [x] 1.4 demo scopeRules / i18n / 名单抽屉 initialRound

## 增量（2026-07 学生范围按钮 + 专业范围扩展）

- [x] 2.1 `BatchScopeRuleModal` 补齐取消/确定按钮 scoped 样式
- [x] 2.2 专业范围设置增加学生类别、校选类别（必选≥1）；写入 `audience`；本轮不接校验
- [x] 2.3 i18n

## 增量（2026-08 ME 入学年名额占比）

- [x] 1.1 默认三年改为 50/30/20；i18n 列名为名额占比（%）；合计/超限/保存校验文案
- [x] 1.2 去掉表上入学年下拉；表下「+ 新增」追加 0% 行；单行与合计校验；保存拦合计≠100
- [x] 1.3 表上左新增、右合计；说明移到表下；入学年行内下拉（新年在前，默认 2027–2022 共 6 年）

## 增量（2026-08 管理轮次时间与系数必填）

- [x] 1.1 第一轮开始/结束、结果发布时间、衰减系数 r / 名额占比加 `*`；参与范围不加
- [x] 1.2 保存校验空时间与 r；第二轮锁定文案改为公布时间自动锁定

## 增量（2026-08）：去掉退课截止周填写

- [x] 1.1 批次表单移除退课截止周输入与 tip，保存仍可用默认周次

## 增量（2026-08 管理轮次一次配齐三轮 + 全局名单）

- [x] 1.1 废除 R2/R3 配置闸门与黄条；老生/新生均可一次编辑三轮时间
- [x] 1.2 管理轮次去掉分轮学生范围 UI；保存不改写 scopeRules
- [x] 1.3 时间链 min-date：老生 R2≥公布；新生 R2≥R1 结束；撞车清空后续；保存必填三轮
- [x] 1.4 学生清单去掉内层轮次 Tab，可选学生只展全局培养方案名单
- [x] 1.5 资格/名单解析忽略分轮覆盖，统一全局；demo 时间按链重排；i18n 提示文案

## 历史来源任务摘要

### add-batch-local-rules-selectable

```
## 1. 数据与表单

- [x] 1.1 批次默认 `isSelectable` + `localRules`；新建/编辑读写
- [x] 1.1b `localRules.releaseCrossAudienceOnRound3`（第三轮选课新老生名额互释，默认勾选；与 align-ge-me 联动）
- [x] 1.2 列表 YnSwitch 列切换写回
- [x] 1.3 i18n

## 2. 文案与规则项

- [x] 2.1 标题改为「选课规则描述」；去掉规则区 callout 与加退课说明
- [x] 2.2 增加「允许超过最高学分」（默认否）
- [x] 2.3 可退自选规则行对齐

## 3. 标题、时间与对象限制

- [x] 3.1 标题改为「选课规则」
- [x] 3.2 批次时间标签统一「开始时间」「结束时间」（含加退课）
- [x] 3.3 对象限制：默认展开；去掉说明灰字；仅限学期大于 X（默认 1）
```

### add-batch-special-student-roster

```
## 1. 数据

- [x] 1.1 `batchStudentRoster`：special 增加 selectable；提供 add/removeMany/import/查找池学生 API
- [x] 1.2 `updateBatchSpecialStudents`：按学号批量覆盖 selectable + remark

## 2. UI

- [x] 2.1 `BatchScopeRuleRosterDrawer` 外层双 Tab；可选保留三轮内容
- [x] 2.2 特殊 Tab：工具条新增/删除/导入；勾选表；新增弹窗；导入弹窗
- [x] 2.3 i18n 中英文案
- [x] 2.4 外层 Tab 顺序：特殊学生名单 → 可选学生名单；内外层 Tab 样式统一
- [x] 2.5 新增「选择」对齐添加学生选课：完整筛选表 + 单选 + 分页（`BatchSpecialStudentPickModal`）
- [x] 2.6 选择器候选人与 `AddStudentRegistrationModal` 同源（admin candidates，排除已在特殊名单）
- [x] 2.7 工具条「是否可选」+ `BatchSpecialStudentEditModal`（批量覆盖）
- [x] 2.8 去掉特殊 Tab 人数角标；打开抽屉默认进特殊名单 Tab
- [x] 2.9 进行中批次：特殊名单只读（禁用写操作、隐藏勾选列，保留搜索查看）
- [x] 2.10 特殊名单工具条 disabled 置灰样式
```

### add-batch-student-roster

```
## 1. 数据与抽屉

- [x] 1.1 demo 名单数据层
- [x] 1.2 BatchStudentRosterDrawer（双 Tab、搜索、分页）

## 2. 接入

- [x] 2.1 批次列表操作列入口
- [x] 2.2 参与范围说明文案；i18n
```

### add-course-visible-from-round

```
## 1. 提案与数据

- [x] 1.1 写入 proposal / design / spec / tasks
- [x] 1.2 课程字段 `visibleFromRound`、更新 API、demo 种子、学生端过滤

## 2. UI

- [x] 2.1 工具条「可选设置」+ `BatchCourseOptionalSettingsModal`
- [x] 2.2 列表列与详情限制条件编辑
- [x] 2.3 i18n
```

### batch-table-horizontal-scroll

```
## 1. 批次列表表格

- [x] 1.1 批次页表格按内容撑宽，`table-wrap` 可横向滚动
- [x] 1.2 名称列两行截断；其余列 nowrap
- [x] 1.3 左冻结序号与批次名称；右冻结状态与操作
```

### differentiate-round-demo-courses

```
## 1. 实现

- [x] 1.1 调整主批次 demo `visibleFromRound`，拉开一二轮列表差异
```

### enrich-batch-active-demo

```
## 1. Demo 种子

- [x] 1.1 `registrationBatches.js`：删部分草稿；增 3 条左右 active（多 scopeRules）；保证 `batch-2504-m1` 为第一个 active
- [x] 1.2 `selectableCourses.js`：为新增 active 批次各挂约 8～12 门 demo 课程
```

### enrich-batch-scope-demo-data

```
## 1. Demo 种子

- [x] 1.1 `batchScopeRules`：专业→学院映射；默认规则带分组名；扩充分组选项
- [x] 1.2 `registrationBatches`：活跃批次与 GE/Mandatory 种子补具体学院/分组
```

### enrich-scope-detail-roster

```
## 1. 实现

- [x] 1.1 学生池 + 按 scopeRule 列表/计数 API
- [x] 1.2 范围明细增加人数与选课人员名单入口
- [x] 1.3 按行只读名单抽屉（叠层）
- [x] 1.4 i18n
```

### isolate-rounds-and-enrich-sections

```
## 1. 轮次隔离

- [x] 1.1 `studentRegistrationStore`：预选/正选/补选分桶 cart；按当前轮次读写
- [x] 1.2 `StudentRegisterView`：分轮搜索与篮；切换 tab 不串数据；挂出 roundPanel / 篮 tip

## 2. 预选优先规则

- [x] 2.1 批次数据与表单：预选优先勾选项 + tooltip
- [x] 2.2 i18n：轮次 tip / 面板 / 优先规则说明文案
- [x] 2.3 正选等说明补强：篮按轮独立、课程容量跨轮共享

## 3. 教学分组 demo

- [x] 3.1 `selectableCourses`：主路径课补 2～3 个 section，重算 capacity 汇总
```

### polish-batch-courses-main-table

```
## 1. 实现

- [x] 1.1 主表列：加课程类别/先修课；改名课程分组数；去配额摘要与详情列
- [x] 1.2 点击分组数打开分组明细
- [x] 1.3 i18n 文案
- [x] 1.4 主表容量改为「已选/容量」列头与数值
- [x] 1.5 分组明细改为侧滑抽屉（非弹框）
- [x] 1.6 副标题类型中文化；管理课程与选课人员名单默认 20 条/页
- [x] 1.7 各批次课程 demo 补齐至 ≥25 门
- [x] 1.8 `revokeRegistrationBatch`；列表进行中行「撤销」确认回草稿
- [x] 1.9 管理课程进行中只读：禁用四钮、隐藏勾选、保留搜索与查看分组
- [x] 1.10 无勾选时冻结列 left 前移对齐；disabled 按钮置灰样式
```

### polish-batch-drawer-tables

```
## 1. 实现

- [x] 1.1 明细/名单表样式与表头 14px
- [x] 1.2 管理课程去框铺满 + 同表样式
- [x] 1.3 发布 window.confirm + i18n
```

### polish-batch-form-draft-scope-dates

```
## 1. 实现

- [x] 1.1 DatePickerEn 支持 min/max 禁用
- [x] 1.2 批次表单时间链、范围表格、存草稿、文案与发布校验
- [x] 1.3 i18n
- [x] 1.4 去掉表单「学分规则」区块；草稿提示文案同步
```

### polish-batch-manage-students-entry

```
## 1. 已完成

- [x] 1.1 可选学生名单：专业列 + 学号/姓名分搜
- [x] 1.2 批次列表：入口按钮；去掉两数量列
- [x] 1.3 名单抽屉壳层样式对齐管理课程

## 2. 待实现（入口直达 + 轮次 Tab）

- [x] 2.1 文案：「管理学生」→「学生清单」；抽屉标题同步
- [x] 2.2 列表点击直接打开名单抽屉；删除 `BatchScopeRulesDrawer`
- [x] 2.3 名单按批次 + 三轮 Tab 聚合学生；无规则轮次空数据
- [x] 2.4 `batchStudentRoster` 增加按批次/轮次列名单；i18n

## 3. 空态与 mock

- [x] 3.1 无参与范围轮次保留 Tab，空态提示先设置学生参与范围
- [x] 3.2 demo 各状态/轮次名单可区分

## 4. 列表可选课人数

- [x] 4.1 `countEligibleStudentsAcrossRounds`：三轮 Tab 人数相加
- [x] 4.2 批次列表「是否可选」前展示「可选课人数」

## 5. 可点人数与抽屉合计

- [x] 5.1 人数 link 打开学生清单；表头问号 tooltip
- [x] 5.2 抽屉不展示批次合计横幅；Tab 无角标；保留各轮统计
```

### polish-batch-names-and-drop-ui

```
## 1. 批次 demo

- [x] 1.1 按图示更新 `registrationBatches` 名称与 `2026/04`；SWE (I) 保持 `batch-2504-m1` + active
- [x] 1.2 学年学期选项增加 `2026/04`；硬编码旧批次名改为动态读取

## 2. Drop UI 打磨

- [x] 2.1 加退课页：search-bar 演示周、精简 callout、通道 tag、特殊表单控件对齐
- [x] 2.2 批次表单免多级审批布局微调；必要 i18n 润色
```

### polish-batch-preview-suffix

```
## 1. 实现

- [x] 1.1 全局统一 prototypeOnlySuffix
- [x] 1.2 去掉 roundsPreview 与相关样式
```

### polish-batch-roster-table

```
## 1. 抽屉壳与表格样式

- [x] 1.1 `BatchStudentRosterDrawer`：对齐 `BatchCoursesDrawer` 的 drawer-scroll 灰底、白卡片 body、table-wrap/data-table、footer 关闭
- [x] 1.2 Tab / link-btn.danger / empty-cell 与参考抽屉一致；核对视觉无回归
```

### polish-batch-scope-count-column

```
## 1. 列表与抽屉

- [x] 1.1 新增只读 `BatchScopeRulesDrawer`（对齐课程抽屉壳与表格样式）
- [x] 1.2 批次列表参与范围列改为数量链接；接入抽屉；补充 i18n
```

### polish-register-scope-adddrop-ui

```
## 1. 实现

- [x] 1.1 学分/先修课查询（含无先修）
- [x] 1.2 范围专业/批次互换与表头
- [x] 1.3 退课分组名称 + 表单布局
```

### polish-scope-detail-layout

```
## 1. 实现

- [x] 1.1 列头「参与范围数量」
- [x] 1.2 扩 demo 池 ≥20 / 行间人数不同
- [x] 1.3 明细与名单抽屉去框铺满
```

### progressive-batch-round-setup

```
## 1. 闸门与数据

- [x] 1.1 `batchRoundSetupGates` + 批次 `volunteerFinalConfirmedAt`；确认写入批次
- [x] 1.2 Demo 分层（仅 R1 / R2 / R3 阶段）

## 2. 表单与入口

- [x] 2.1 新建/编辑仅 R1 + Add/Drop（已被 4.x 取代）
- [x] 2.2 列表「管理轮次」下钻配 R2/R3
- [x] 2.3 列表空轮次「未配置」；i18n

## 3. 管理轮次 UX

- [x] 3.1 锁定轮次仍展示字段（置灰）+ 原因说明
- [x] 3.2 各轮次区块可折叠，默认全展开

## 4. 第一轮迁入管理轮次

- [x] 4.1 新建/编辑去掉第一轮区块；保存保留已有轮次/scope
- [x] 4.2 管理轮次增加第一轮（时间/对象限制/范围）
- [x] 4.3 文案与 tasks 同步
```

### refine-batch-adddrop-bill-days

```
## 1. 实现

- [x] 1.1 选课规则新增延迟缴费天数 CR107；常量与导出对齐
- [x] 1.2 批次表单：去 billHours / 截止周 / 免审批；改名加退课申请；优先仅高年级
- [x] 1.3 批次数据默认值与 demo 申请窗口日期
- [x] 1.4 学生加退课：窗口闸门、Drop 进审批、去掉教学周演示通道
- [x] 1.5 更新 i18n
```

### refine-batch-elective-round1-scope

```
## 1. 实现

- [x] 1.1 类型选项去 Mandatory；规范化与 demo 数据
- [x] 1.2 第一轮对象限制文案（中英）
- [x] 1.3 范围弹窗/明细/标签/匹配去掉分组展示与采集
- [x] 1.4 范围说明文案同步

## 2. 对象限制 UX 打磨

- [x] 2.1 对象限制区块折叠（默认收起 + 摘要）
- [x] 2.2 `fixedRound` 时隐藏选课轮次字段
- [x] 2.3 文案「高年级」→「老生」；i18n 同步
```

### refine-batch-scope-by-faculty-grade

```
## 1. 范围模型与匹配

- [x] 1.1 `scopeRules` 增加可选 `round`；`filterScopeRulesForRound` + 资格按轮匹配
- [x] 1.2 学生端选课传入当前轮次做范围判断

## 2. 弹窗与展示

- [x] 2.1 `BatchScopeRuleModal`：两列布局 + 非必填轮次
- [x] 2.2 批次表单范围列表展示轮次；说明 i18n 更新
```

### refine-batch-scope-intake

```
## 1. 实现

- [x] 1.1 batchScopeRules：intake 模型、选项、匹配、demo 默认规则
- [x] 1.2 弹窗必选校验 + 全部；表格/明细列
- [x] 1.3 registrationBatches demo 映射
- [x] 1.4 i18n

## 2. 多选数组展示

- [x] 2.1 `formatDimList` 统一为 `[值]` / `[A,B]`（表格、摘要、导出）

## 3. 参与范围编辑

- [x] 3.1 弹窗支持 initialRule / 编辑标题
- [x] 3.2 管理轮次三轮表：编辑按钮；确认替换；锁定轮禁用
```

### remove-batch-courses-empty-import-btn

```
## 1. 实现

- [x] 1.1 写入 proposal / design / spec / tasks
- [x] 1.2 移除 `BatchCoursesDrawer` 空状态中部导入按钮
```

### rename-import-from-programme

```
## 1. 实现

- [x] 1.1 更新导入相关中英文文案（培养方案）
```

### flatten-batch-courses-by-section（2026-08）

```
## 1. 规格与数据

- [x] 1.1 更新 proposal / spec（按分组展平、勾选与容量、隐藏添加）
- [x] 1.2 `enrichCourse`：为各 section 派生/保留新老容量与已选；提供 `updateSectionsAudienceQuota`

## 2. 管理课程抽屉

- [x] 2.1 隐藏「添加课程」；工具条其余按钮靠左
- [x] 2.2 主表按 section 展平；去掉分组数列；外提分组/教师/起止周/上课时间地点
- [x] 2.3 勾选 sectionId；分页总数=行数；名额分配按分组；可选/容量/专业范围按课去重
- [x] 2.4 空态与 i18n 文案（不引导添加入口）
- [x] 2.5 去掉源最大容量列；课程分组移到课名后并冻结；工具条「门数+分组数」文案
```

### require-scope-round-specific

```
## 1. 实现

- [x] 1.1 去掉「全部轮次」；校验必选具体轮次；更新说明文案
- [x] 1.2 匹配逻辑不再把空 round 当全轮
- [x] 1.3 主活跃批次 + defaultScopeRules demo 改为三轮基本形态
```

### enrich-draft-batch-courses-and-table-spacing

```
## 1. 实现

- [x] 1.1 规格：草稿/轻量批 ≥20 门；管理课程行距可读
- [x] 1.2 `selectableCourses`：轻量挂课批各补至 20 门（约 40 分组行）
- [x] 1.3 `registrationBatches`：对应批次 `courseCount` 同步为 20
- [x] 1.4 `BatchCoursesDrawer`：主表单元格略增 padding；时间地点行间距
```

### reuse-form-view-list-student-roster

```
## 1. 实现

- [x] 1.1 编辑批次「查看清单」跳转 BatchScopeRuleRosterDrawer · 全局选课名单
- [x] 1.2 去掉表单内独立 BatchGlobalParticipantRosterDrawer
```
