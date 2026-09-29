# 选课管理-学生加退课 — 任务清单（合并归档）

> 历史 tasks 已在各次 apply 中完成。本清单仅作追溯；**无需再次实现**。

- [x] 1. 合并本菜单下历史变更包为中文需求包
- [x] 2. 保留合并来源列表便于需求文档回溯
- [x] 3. 删除已被合并的旧变更目录

## 增量（2026-07）

- [x] 去掉退课通道列；申请课程拆为添加/退课/重修三列（编码+名称）
- [x] 学生端详情抽屉展全申请内容
- [x] 菜单与选课历史互换；审批前可取消；详情分区/附件对齐学籍

## 增量（2026-08）：方案 B 学分 + 申请不排队

- [x] 4.1 加课选课弹窗展示 GE/ME 双组文商理胶囊
- [x] 4.2 学生提交与管理端审批去掉选课排队；Add/Retake 提交锁名额，取消/拒绝释放
- [x] 4.3 审批通过写 CR107 缴费截止日；文案不再声称申请进队列

## 增量（2026-08）：加课文商理 + 审批列表展示

- [x] 5.1 ME 默认文科；演示生文科；加课/在线选课按科类过滤 ME；GE 加课补齐文商理；COMP201-03 保留时间冲突；冲突文案「时间冲突」
- [x] 5.2 审批已提交/历史无勾选时重算冻结列；去掉学分列；状态列足够宽
- [x] 5.3 上课时间地点：时段分行且同行 nowrap（审批/学生列表/选择器）
- [x] 5.4 超出学分、费用、账单同源派生（超出才有费）

## 增量（2026-08）：选择器冻结 + 详情

- [x] 6.1 选择器状态列右侧冻结；默认每页 20 行
- [x] 6.2 审批详情去掉学分摘要条与校验结果
- [x] 6.3 学年学期、联系电话 demo 补值；详情必有值
- [x] 6.4 详情加课/退课/重修：左课程名称、右课程编码
- [x] 6.5 去掉课程分区重复预估费用；金额统一 RMB
- [x] 6.6 详情学生声明复用申请时底色、说明与只读勾选框

## 增量（2026-08）：重修节先选本学期课

- [x] 7.1 去掉成绩单下拉与曾修课程字段；顺序改为选课 → 成绩/学期 → 类型+分组 → 课信息/费用
- [x] 7.2 曾修学年学期默认申请学年学期的上一学期；选课按 retakeCourseId 带回成绩

## 增量（2026-08）：屏蔽加退关联

- [x] 8.1 学生 Tab / 审批筛选与列表过滤去掉 AddDrop
- [x] 8.2 访问闸门与提交不再允许发起加退关联

## 增量（2026-08）：重修节对齐问卷 SECTION IV

- [x] 9.1 成绩/学期改为必填下拉；时间地点与教师可手填并带示例提示
- [x] 9.2 校验必填；不单独展示曾修课名

## 增量（2026-09）：PDF 主类型分支 + 列表去 Tab

- [x] 10.1 去掉类型 Tab；列表公共列 + 搜索类型筛选；个性字段仅详情
- [x] 10.2 表单：主类型加/退/重修 +「是否同时退课」推导 AddDrop/RetakeDrop；禁止加+重修
- [x] 10.3 `getVisibleAddDropSections` / 校验 / i18n 对齐；冒烟五类路径

## 增量（2026-09）：主类型三字展示 + 去抵免 + 请选择

- [x] 11.1 列表/筛选类型映射为加课/退课/重修（AddDrop→加课，RetakeDrop→重修）
- [x] 11.2 「是否需要退课」文案；申请类型默认请选择
- [x] 11.3 去掉退费抵免（表单/校验/详情/费用抵扣）

## 增量（2026-09）：审批费用列前移

- [x] 12.1 超出学分 / 预估费用 / 账单移到学号前

## 增量（2026-09）：审批历史账单明细 / 催缴 / 延期

- [x] 13.1 数据：按申请聚合课级已缴/未缴 + 剩余时间 + 延期写回 API
- [x] 13.2 历史 Tab：缴费剩余列；账单明细抽屉；&lt;24h 催缴；超时重新生成订单
- [x] 13.3 demo 相对截止日 + i18n；冒烟三种状态行

## 增量（2026-09）：审批历史缴费 UI 打磨

- [x] 14.1 列名「缴费剩余时间」；时长统一为天/时/分且去掉「剩余」
- [x] 14.2 Teleport 弹窗底栏按钮样式对齐列表页
- [x] 14.3 操作列同一行不换行并加宽

## 增量（2026-09）：加课选择器学分分行 + 学生列表解冻

- [x] 15.1 选择课程弹窗 GE/ME 学分胶囊分行，去掉 `|`
- [x] 15.2 学生加退课列表取消左右 sticky 冻结列

## 历史来源任务摘要

### add-adddrop-course-picker

```
## 1. 课程选择器

- [x] 1.1 新增 `AddDropCoursePickerModal`（搜索/表格/分页/单选/确认）
- [x] 1.2 `StudentAddDropView`：下拉改为触发器 + picker；数据仍用 `courseOptions`
- [x] 1.3 i18n：选择器标题、确认、名额状态等
```

### enrich-student-adddrop-form

```
## 1. 表单与数据

- [x] 1.1 弹窗字段、校验与提交写入学年学期/说明/退费抵免
- [x] 1.2 demo 与列表列补充；i18n 文案
```

### polish-adddrop-form-layout

```
## 1. UI

- [x] 1.1 弹窗两列、退费抵免单选、红色必填星号
- [x] 1.2 callout rule 变体改为浅蓝 + 感叹号
```

### polish-adddrop-label-intake-desc

```
## 1. 实现

- [x] 1.1 i18n 文案统一
- [x] 1.2 学年学期与入学批次选项倒序
```

### polish-demo-teaching-week-callout

```
## 1. 一体条带

- [x] 1.1 演示教学周与通道说明共用一整行 tip 底色与字体
```

### polish-student-adddrop-list

```
## 1. 布局与列表

- [x] 1.1 搜索区 + toolbar 发起申请 + callout/演示周同行
- [x] 1.2 分页、筛选、退课通道「非退课申请」、demo 数据加厚
```

## 增量（2026-09）：选课器状态 tip + 拟退动态冲突 + 退课操作列

- [x] 16.1 拟退排除键同时匹配 courseId 与 courseCode；基线剔除同步支持 id/课号
- [x] 16.2 加课选课器不可选状态提供 tip（冲突点名课+时段；学分点名类别）
- [x] 16.3 退课清单表头空列改为「操作」

## 增量（2026-09）：退课空确认 + 类型列 + 学分行布局

- [x] 17.1 退课选课器允许空确认并清空清单；父级接受空 selections；再开回显
- [x] 17.2 退课清单增加课程类型列
- [x] 17.3 退课总学分 / 专业选修 / 公共选修同一行；加课与重修三字段同行

## 增量（2026-09）：名额数字 + 退课学分投影

- [x] 18.1 选课器有余量状态改为剩余/容量数字
- [x] 18.2 退课/加课投影仅跟当前勾选；空勾选=基线
- [x] 18.3 投影分类键对齐基线并默认桶；总分与分类一致；GE 无校选类别计入默认桶

## 增量（2026-09）：退课投影批次同源 + 选择计数

- [x] 19.1 mapEnrolledToPickerCourse 透传 batchId；投影用同批次 selectionGroups
- [x] 19.2 coursePickerSelected 文案改为带 {count} 动态计数

## 增量（2026-09）：状态表头 + 同课程单分组

- [x] 20.1 选课器状态列表头改为「可选名额/总名额」
- [x] 20.2 加课/重修同课程选一个分组后其余置灰不可勾选

## 增量（2026-09）：重修选课器展示曾修成绩

- [x] 21.1 重修选课器传入往期成绩；最后一列改为「曾修学期/成绩」并课级 rowspan
- [x] 21.2 保留分组/教师/时间地点列；i18n + 样式

## 增量（2026-09）：重修选课器扁平逐行展示

- [x] 22.1 `attachCourseLevelRowSpans` 支持 `flat` 选项：每行独立块、序号按行、课级列 rowspan=1 全部 show
- [x] 22.2 重修模式 `paginatedRows` 传 `{ flat: true }` 并按行号计序号；移除 anchor 方案
- [x] 22.3 提案/spec/tasks 同步 §22

## 增量（2026-09）：重修一次选多门 + 学分帽不阻断

- [x] 23.1 `termGateForRow` 对 `Retake` action 跳过闸门；`isRowCreditBlocked` 对重修行返回 false
- [x] 23.2 `handleCoursePicked` 重修分支按每门课解析 `retakeHistoryFromCourse`，挂 latestGrade 到对应行；首课历史用于顶部摘要
- [x] 23.3 提案/spec/tasks 同步 §23

## 增量（2026-09）：重修候选池 demo 增加不同课程种类

- [x] 24.1 `studentTranscript.js` 提升池补齐 COMP201 / MATH201 / PHYS101 / BUS201 / AI110 / GE201 / EMB210 等；挂科池补齐 SE201 / WEB210
- [x] 24.2 提案/spec/tasks 同步 §24

## 增量（2026-09）：重修选课器每课只展一行 + 关闭同课单分组锁

- [x] 25.1 `sectionRowsForCourse` 重修模式只取 `sections[0]`，不展开全部分组
- [x] 25.2 `isRowDisabledBySibling` 对 `Retake` action 返回 false，关闭同课单分组锁
- [x] 25.3 修订 §21「重修仍需选教学分组」语义；提案/spec/tasks 同步 §25

## 增量（2026-09）：重修选课器「超出学分」提示改为基于学期学分超限

- [x] 26.1 `AddDropCoursePickerModal.vue` `showFooterExcessHint`：重修模式改为基于 `computeNetCreditsAfterLines(currentCredits, dropLines, pickedLines) > creditMax` 判断（减 dropLines、不叠加 addLines，与 `termGateForRow` 同源）；加课模式保持 `billableCredits > 0`
- [x] 26.2 提案/spec/tasks 同步 §26

## 增量（2026-09）：重修关联描述措辞优化 + 同步 §23/§26 语义

- [x] 27.1 `zh.js`：`formNotesTitleRetakeDrop` / `formNotesDropThenRetake` / `declarationExtraRetakeDrop` / `retakeDropLinkedHint` 4 处文案优化
- [x] 27.2 `en.js` 对应 4 处 key 同步翻译
- [x] 27.3 提案/spec/tasks 同步 §27

## 增量（2026-09）：去掉提交成功后「可在管理端查看进度」提示

- [x] 28.1 `StudentAddDropView.vue` `finishOk`：移除 `message.value = t('...addDropSubmitted')`，提交后仅关闭表单 + 刷新列表
- [x] 28.2 `zh.js` / `en.js` 删除 `addDropSubmitted` key
- [x] 28.3 提案/spec/tasks 同步 §28

## 增量（2026-09）：详情声明勾选框蓝色已勾选效果

- [x] 29.1 `AddDropApplicationDetailBody.vue` `.checkbox-row input`：`appearance: none` + `:checked` 自定义蓝色底白对勾样式，`opacity: 1` 覆盖 disabled 灰
- [x] 29.2 提案/spec/tasks 同步 §29

## 增量（2026-09）：详情回显是否退课/退课学分 + 超出学分与费用同源

- [x] 30.1 `AddDropApplicationFormSections.vue` `sectionExcessCredits`：改为优先 `feeEstimate.billableCredits`，与费用同源
- [x] 30.2 `AddDropApplicationDetailBody.vue`：回显「是否需要退课」只读蓝勾选单选；退课 SECTION 回显学分三字段；超出学分优先计费学分
- [x] 30.3 `addDropScheduleDemo.js` `deriveExcessCredits` / `reconcileExcessFeeBill`：计费/账单优先，避免 excess=0 清零正数账单
- [x] 30.4 列表 `listExcessCredits`（学生端/审批端）与费用计费学分对齐
- [x] 30.5 提案/spec/tasks 同步 §30

## 增量（2026-09）：统一毕业计费 + 学期帽闸门；废除退费抵免

- [x] 31.1 `addDropFeeRates.js`：重修与加课统一毕业类别计费；废除 feeWaiverOffset；新增 clone/boost/consume planRemaining
- [x] 31.2 `StudentAddDropView.vue` feeEstimate：加/重修逐课扣减毕业剩余；含退课先 boost；去掉退费抵免 wiring
- [x] 31.3 `AddDropCoursePickerModal.vue`：重修恢复学期帽闸门；缴费提示仅 billable>0；去掉退费抵免 props
- [x] 31.4 i18n：去掉「退课学分抵扣重修费用」文案
- [x] 31.5 提案/spec/tasks 同步 §31

## 增量（2026-09）：重修切换保留 + 学期超分类提示 + 曾修入表

- [x] 32.1 `applyPrimaryTypePatch`：仅 needDrop 切换时选择性清空（是→否清退课节；否→是保留重修等）
- [x] 32.2 `retakeType` 切换：保留电话/退课/备注；跨池时仅清重修课清单；select 样式与申请类型对齐
- [x] 32.3 选课器白名单 footer：按超限学期类别拼「已经超出本学期{类别}学分要求」
- [x] 32.4 表单「超出学分」跟学期类别超额实时同步；费用仍仅毕业超额（`billableCredits`）
- [x] 32.5 重修表：曾修成绩并入列；操作列表头「操作」；去掉独立曾修块；详情同步
- [x] 32.6 提案/spec/tasks 同步 §32
