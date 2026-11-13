## 1. 文档整合

- [x] 1.1 按叶菜单合并
- [x] 1.2 全文中文
- [x] 1.3 旧包归档

## 2. 功能状态

- [x] 2.1 已落地（本包仅规格整理）

## 3. 退课学分摘要（增量）

- [x] 3.1 弹窗文案调整 + 有选中红字
- [x] 3.2 申请表「选择」旁摘要（无课灰 / 有课红）

## 4. 课程表序号 / 费用说明对调 / 详情同课号重修（增量）

- [x] 4.1 申请表退课、加课、重修表首列序号，无横滑
- [x] 4.2 重修区费用预估与重修补充说明对调
- [x] 4.3 详情退/加/重修表首列序号；重修表补同课号重修列；无横滑

## 5. 学分条跨 Tab 一致（增量）

- [x] 5.1 学分条投影统一补齐课程 type
- [x] 5.2 重修选课器保留其它原课/Tab 已选重修，学分条与申请表一致动态

## 6. 详情与审批审结同源（增量）

- [x] 6.1 学生详情学分/费用随审批写回与 ensure 投影，与历史详情一致

## 7. 缴费整单与预估一致（增量）

- [x] 7.1 待缴整单按审批后 feeEstimate reconcile，不含加课 0 元与其它申请课

## 8. 账单列、二次申请门控与缴完学分（增量）

- [x] 8.1 申请列表状态后增加账单列
- [x] 8.2 待缴未结阻断发起申请；提示去缴费
- [x] 8.3 配合审批侧缴完才落课，二次表单学分为缴费后基线

## 9. 二次申请门控排除 demo（增量）

- [x] 9.1 `unpaidBillBlocked` 仅计 `adr-stu-` 真实提交，与未审门控一致

## 10. 开窗提示与审结学分一致（增量）

- [x] 10.1 发起申请可开窗；未审/待缴提示 + formOpsDisabled + 禁提交
- [x] 10.2 `buildLiveConfirmedTermCreditStrip`；落课后写回；审结详情与二次表单同源

## 11. 重修选课器单课互斥（增量）

- [x] 11.1 重修模式勾选一门后其余行置灰；取消恢复
- [x] 11.2 重修禁用表头全选；tip 区分「已选其它重修课」
- [x] 11.3 确认/合并保证一门原课至多一行重修

## 12. 学分要求条一级二级配色（增量）

- [x] 12.1 一级：未满灰底；选满仅数值绿；超出仅数值红；表头黑
- [x] 12.2 二级第3/5列学期与毕业均橙底黑字

## 13. 退课弹窗选修 tip（增量）

- [x] 13.1 i18n 退课选修 tip 文案（zh/en）
- [x] 13.2 退课 selection-meta 旁 tip-icon（未选/已选均显示）

## 14. 落下 tip 口径与 demo 必修约 10（增量）

- [x] 14.1 i18n situationDeficit 改为截止到当前学期落下；无缺口仍出 0
- [x] 14.2 DEMO_PRIOR 必修调至 tip 约 10；注释与条上展示匹配

## 15. 换组锁按原上课学期（增量）

- [x] 15.1 isCoreOtherSectionReaddBlocked / 提交校验接入当前学期；早先学期不锁
- [x] 15.2 origin 行带 originalAcademicSession；弹窗传入 academicSession
- [x] 15.3 MATH101 demo：当前学期 09 + 原组 01，异组置灰

## 16. 落下额度入选修上限与 ME 组视图（增量）

- [x] 16.1 tip demo 必修/GE/ME ≈ 4/4/3；spec/design 同步
- [x] 16.2 GE/ME 加课·重修硬拦 = termMax+因修未修；条分母不变；超限文案含合计说明
- [x] 16.3 加课 ME：孤立课保留；未完成 3选2 组展开（已选置灰、其余可选）

## 17. 加课 ME 课程组表合并展示（增量）

- [x] 17.1 加课有组时合并课程组列 rowspan（与重修/在线选课一致）
- [x] 17.2 有组时保持同组相邻（避免上课学期重排拆组）；分页 groupAware

## 18. 落下 tip GE/ME 随投影动态（增量）

- [x] 18.1 tip 三类均按 prior+条上已选算缺口；退/加勾选后 GE/ME 与必修一并变化
- [x] 18.2 硬拦因修未修用「含拟退不含本窗拟加」，避免与学期已选双计

## 19. 孤立 ME 课程组列与重修曾修列（增量）

- [x] 19.1 无组 ME 课程组列按课合并为一个「—」
- [x] 19.2 重修曾修列课级合并、有成绩不配「—」、移到一级末列

## 20. Tab 计数 / ME 组门数帽 / 学期超出口径（增量）

- [x] 20.1 不及格原课三 Tab 动态「（N门课程）」
- [x] 20.2 加课 ME 组（3选2/4选3/2选1）选满 minPick 禁其它课 + tip；展开未完成组覆盖三类
- [x] 20.3 学期超出扣因修未修；字段 tip；demo 仍展示

## 21. 学分条学期格合计展示（增量 j）

- [x] 21.1 更新 proposal/design/spec：学期格 `已选/总要求（要求+因修未修）`，base 固定；推翻「分母仍为学期要求」
- [x] 21.2 GE/ME/必修学期列表头与数值格式；必修要求无配额按 0；tone 按合计
- [x] 21.3 表单/选课器传入固定 catchUp base；i18n zh/en

## 22. 学分条列宽与必修学期要求 demo（增量 k）

- [x] 22.1 更新 proposal/design/spec：列宽自适应+同列上下对齐；必修学期要求 demo=9
- [x] 22.2 AddDropTermCreditStrip 列宽按 max-content；同列共用 track
- [x] 22.3 build/baseline 写入 mandatoryMax（demo 9）；展示可呈 9/13（9+4）

## 23. 学分条一页展示与选修/总已选要求（增量 l）

- [x] 23.1 更新 proposal/design/spec：无横滚；学期选修/总为已选/要求（不含因修未修）
- [x] 23.2 AddDropTermCreditStrip 布局一页无横滚（缩字/表头换行）
- [x] 23.3 学期选修、学期总数值与 i18n；毕业橙格保持已选

## 24. 学分要求二维表（增量 m）

- [x] 24.1 更新 proposal/design/spec：3×5 矩阵；未修/因修；底色保留
- [x] 24.2 AddDropTermCreditStrip 改为表格布局，全入口同源
- [x] 24.3 学期已选/要求不含因修括号；未修=动态落下，因修=已选+未修；i18n

## 25. 矩阵表容器去掉 R1 Grid（增量 n）

- [x] 25.1 更新 proposal/design/spec：禁止套用 cr-r1-credit-panel
- [x] 25.2 AddDropTermCreditStrip 面板自带边框；列与数值可见

## 26. 申请弹窗课程预览（增量 o）

- [x] 26.1 更新 proposal/design/spec：课程预览投影与虚线分色
- [x] 26.2 buildAddDropApplicationSchedulePreview；WeekScheduleGrid 支持 op 虚线色与图例
- [x] 26.3 说明区按钮 + 抽屉；i18n

## 27. 课程预览默认同课表与参考说明（增量 p）

- [x] 27.1 更新 proposal/design/spec：无勾选=我的课表；仅本单同步；参考非最终
- [x] 27.2 无本单行时复用我的课表 slots；hint/标题文案

## 28. 课程预览置顶与图例/tip（增量 q）

- [x] 28.1 更新 proposal/design/spec：盖过弹窗、去重说明、五项图例+浅蓝短 tip
- [x] 28.2 预览抽屉 elevate；去掉 header subtitle；始终 addDropPreview；浅蓝 tip 置图例下
- [x] 28.3 短 tip i18n（中英）

## 29. 预览标题与图例文案（增量 r）

- [x] 29.1 更新 proposal/design/spec：去「本单参考」、tip 在上、申请（虚线）文案
- [x] 29.2 标题/图例/tip i18n；WeekScheduleGrid tip↔图例对调

## 30. 退课（分）与预览冲突对齐选课（增量 s）

- [x] 30.1 更新 proposal/design/spec：三字段（分）；拟退腾出不假冲突
- [x] 30.2 退课三字段 i18n 加（分）
- [x] 30.3 WeekScheduleGrid addDropPreview：退课不占冲突/不挤占占用组 lane

## 31. 预览不画退课并与选课基线一致（增量 t）

- [x] 31.1 更新 proposal/design/spec：不画退课、去 tip、四项图例、加/重修互不冲突
- [x] 31.2 buildAddDropApplicationSchedulePreview 不输出退课格；pendingDropKeys 剔除
- [x] 31.3 图例去掉退课；抽屉去掉 tip；scheduleBaseline 同源
- [x] 31.4 选课 conflictInfo 叠加已勾加/重修互检

## 32. 退课池与 listMyResultCourses 对齐（增量 u）

- [x] 32.1 更新 proposal/design/spec：退课池含已批准申请课
- [x] 32.2 退课 courseOptions 改为 listMyResultCourses

## 33. 空预览骨架与同侧重修互检（增量 v）

- [x] 33.1 更新 proposal/design/spec：空表时间轴；同侧已确认互检
- [x] 33.2 StudentSchedulePreviewPanel 空 schedule 仍渲染 Grid
- [x] 33.3 peerAddRetakeBaselineSlots 并入表单同侧加/重修

## 34. 申请说明区收紧间距（增量 w）

- [x] 34.1 更新 proposal/design/spec：说明 callout 紧凑
- [x] 34.2 AddDropApplicationFormSections 内 callout/notes 间距收紧

## 35. 预览按钮/拟退对齐/移除闸门/虚线色（增量 x）

- [x] 35.1 更新 proposal/design/spec：预览左下、说明再压、拟退对齐、移除闸门、橙黄虚线
- [x] 35.2 课程预览移到 modal-actions 左侧；说明标题↔条文再收间距
- [x] 35.3 拟退并入加课池对齐原组/学期；当前学期拟退锁其它分组（MATH101）
- [x] 35.4 拟退移除依赖加课/重修时置灰+tooltip；随表单实时变化
- [x] 35.5 WeekScheduleGrid 加课橙/重修黄虚线；必修亦带申请虚线；图例同步

## 36. 虚线加粗与草稿四态（增量 y）

- [x] 36.1 更新 proposal/design/spec：虚线加粗无底；取消存草稿；四态（驳回=任一驳回，结束=全同意）
- [x] 36.2 WeekScheduleGrid 虚线加粗；图例去橙黄底色
- [x] 36.3 学生列表四态展示/筛选/徽章；草稿不计入未审门控
- [x] 36.4 取消确认存草稿；草稿编辑回填；提交草稿转待审批

## 37. 脏检查/详情四态/驳回换课/老师历史（增量 z）

- [x] 37.1 更新 proposal/design/spec：baseline 脏检查；详情与老师历史四态；重新提交换课弹窗
- [x] 37.2 取消存草稿改为相对打开快照有改动才提示
- [x] 37.3 详情与老师历史状态文案/筛选对齐四态+已取消
- [x] 37.4 已驳回重新提交弹窗：驳回行可修改换课，已通过只读，整单最新行回待审批

## 38. 行决策驱动已驳回/已结束（增量 aa）

- [x] 38.1 更新 proposal/design/spec：有驳回行→已驳回，否则通过/不通过→已结束；混选允许；修改仅驳回行；demo 对齐
- [x] 38.2 `resolveAddDropStudentListStatus` 按 items 的 `update_required` 判定；筛选/徽章传申请对象
- [x] 38.3 审批提交允许混选；有驳回写 `Rejected`+行决策；无驳回终态展示已结束；`requestAddDropUpdate` 不再留 Pending
- [x] 38.4 重新提交门槛与「修改」仅 `update_required`；`rejected` 不通过只读
- [x] 38.5 demo：已驳回样例含 `update_required`；通过+不通过样例为已结束；缺行决策强制 reseed

## 39. 重新提交弹窗课名/行高/学分条（增量 ab）

- [x] 39.1 更新 proposal/design/spec：合理课名类型、时间缩写、学分条、hint
- [x] 39.2 demo/enrich 补齐 courseName+type（含 BUS201/PHYS101 等）
- [x] 39.3 AddDropResubmitModal：时间地点单行+…；顶部学分要求条；hint 仅驳回可改

## 40. 审批表头完整与重提对齐意见（增量 ac）

- [x] 40.1 更新 proposal/design/spec：表头不缩写；重提加宽/列序/意见详情
- [x] 40.2 AddDropApprovalModal：th 禁 ellipsis，短列 min-width，可横滚
- [x] 40.3 AddDropResubmitModal：加宽、列序对齐、名额列、意见详情只读

## 41. 去名额与因修未修固定（增量 ad）

- [x] 41.1 更新 proposal/design/spec：学生去名额；tip/未修/因修固定落下
- [x] 41.2 AddDropTermCreditStrip + 各入口：展示用基线 catchUp；硬拦可仍含拟退
- [x] 41.3 AddDropResubmitModal 去掉可选名额列

## 42. 重提换课单选与申请规则（增量 ae）

- [x] 42.1 更新 proposal/design/spec：单选、按 action 进池、重修原课、不污染 need*
- [x] 42.2 选课器重提强制单选；courseOptions/gate/拟退键独立于主表单
- [x] 42.3 重修换课写入 retakeType+原课焦点；换课后整单冲突/学分校验

## 43. 预览底栏提示与虚线色（增量 ag）

- [x] 43.1 更新 proposal/design/spec：底栏免责文案；加课绿/重修橙
- [x] 43.2 申请预览抽屉 footer 左提示 + i18n
- [x] 43.3 WeekScheduleGrid 加课绿/重修橙虚线与图例

## 44. 矩阵未修 live / tip 固定（增量 ah）

- [x] 44.1 更新 proposal/design/spec：修订 ad；tip 固定、矩阵跟 strip（含拟退）
- [x] 44.2 AddDropTermCreditStrip：未修行用 live gaps；tip 仍用固定 catchUp
- [x] 44.3 各入口注释：situationCatchUp 仅 tip

## 45. 预览底栏 tip 样式（增量 ai）

- [x] 45.1 更新 proposal/design/spec：底栏提示条样式
- [x] 45.2 申请预览 footer：徽章+浅蓝底+加粗（对齐无排课 tip）

## 46. 重修灰字 / 教师列 / 二次红字合并

- [x] 46.1 去掉 retakeCourseHint 展示
- [x] 46.2 详情任课教师列加宽少缩写
- [x] 46.3 合并二次申请红字；去掉蓝底估算 tip

## 47. 修读方式 / 已驳回门控 / 详情胶囊

- [x] 47.1 修读方式列全文不缩写
- [x] 47.2 已驳回禁发起申请（提示对齐二次申请）
- [x] 47.3 详情行决策彩色胶囊

## 48. 重提换课禁选已同意 + 三池（增量 aj）

- [x] 48.1 本单已通过/不通过占用课在选课器置灰（本行原课除外）
- [x] 48.2 退/加/重修重提各进各池，禁止搬用
- [x] 48.3 i18n 置灰原因文案

## 49. 重提胶囊 / 同类型占用 / 重修可换课（增量 ak）

- [x] 49.1 重提弹窗决策列对齐详情彩色胶囊
- [x] 49.2 占用锁仅同 action；跨类型不灰
- [x] 49.3 重修重提不再用原课焦点过滤候选（预勾选仍可）

## 50. 退课摘要跟可退池（增量 al）

- [x] 50.1 更新 proposal/design/spec：退课前=可退池 Σcredits
- [x] 50.2 选课弹窗 dropMetaOriginal 改为 props.courses 学分总和
- [x] 50.3 申请表摘要传入 dropPoolCreditsTotal，与弹窗同源

## 51. 重修 radio + 我的课表实态（增量 am）

- [x] 51.1 更新 proposal/design/spec
- [x] 51.2 重修选课器 multiple=false（radio，无表头全选）
- [x] 51.3 「我的课表」不扣拟退；hint 改为实课表口径

## 52. 重修 radio 点击对齐（增量 ao）

- [x] 52.1 更新 proposal/design/spec
- [x] 52.2 radio @click.stop + col-check 居中样式

## 53. 重提预览 / 取消行 / 保留锁定决策（增量 at）

- [x] 53.1 更新 proposal/design/spec
- [x] 53.2 重提底栏课程预览跟 workingItems
- [x] 53.3 驳回行「取消」删行；提交保留通过/不通过，驳回→pending
- [x] 53.4 审批弹窗锁定已通过/不通过行；再点确定才结束

## 54. 取消申请确认 + 我的课表无冲突（增量 au）

- [x] 54.1 更新 proposal/design/spec
- [x] 54.2 重提「取消申请」+ ConfirmDialog
- [x] 54.3 调整 demo 冲突时段并同步同 section / 申请行

## 55. 重提回显可改 + 预览过滤 + 曾修列（增量 av）

- [x] 55.1 更新 proposal/design/spec
- [x] 55.2 重提交保留意见；审批取消锁定；回显课数据
- [x] 55.3 重提预览仅已通过+已换课驳回行
- [x] 55.4 详情曾修成绩不换行缩写悬停

## 56. 课表默认调时无冲突 + 去副标题（增量 aw）

- [x] 56.1 更新 proposal/design/spec
- [x] 56.2 统一调整 demo 落课时段（ENGL201/MATH201 等）并 reseed
- [x] 56.3 「我的课表」抽屉去掉 schedulePreviewAddDropHint 副标题

## 57. 全量再扫落课 + FinalHint（增量 ax）

- [x] 57.1 更新 proposal/design/spec
- [x] 57.2 挪开 STAT201/CYS201 等剩余互撞并 reseed；复验无冲突
- [x] 57.3 StudentMyResultView 去掉 schedulePreviewFinalHintAll 副标题

## 58. 重提锁 Tab + 确认提交 + 账单生成时间（增量 ay）

- [x] 58.1 更新 proposal/design/spec
- [x] 58.2 加课重提按课性锁定类别 Tab
- [x] 58.3 确认重新提交 ConfirmDialog
- [x] 58.4 待收费账单补 billGeneratedAt 并展示生成时间

## 59. 草稿不锁 / 退课换课池 / 换课确认（增量 az）

- [x] 59.1 更新 proposal/design/spec
- [x] 59.2 退课重提不因已通过退课 sibling 置灰；换课成功行→pending
- [x] 59.3 选课确认超额弹层抬高 z-index；确认链路可写回

## 60. 退课同课号置灰 / 换后待审批可再改 / 重修可换选（增量 ba）

- [x] 60.1 更新 proposal/design/spec
- [x] 60.2 退课占用锁：本单其它行同课号置灰；换后 pending 显示「待审批」且可再改/取消
- [x] 60.3 重修单选：已选一门不禁选其它行（可点换）

## 61. 加课置灰可取消 / 重提门控 / 缴费生成时间（增量 bb）

- [x] 61.1 更新 proposal/design/spec
- [x] 61.2 加课占用锁对齐退课；重提单选可点取消；确认重新提交须零驳回
- [x] 61.3 缴费 demo/hydrate 全量补齐 billGeneratedAt 并展示

## 62. 去门控红字 / 必修锁 core / ME 限制同源（增量 bc）

- [x] 62.1 更新 proposal/design/spec
- [x] 62.2 去掉重提底栏红字；修复 MANDATORY→ME 课性锁定
- [x] 62.3 Tab 过滤与正式加课课性匹配对齐（含 ME）

## 63. 重提学分钉 / 虚拟课程组列（增量 bd）

- [x] 63.1 更新 proposal/design/spec
- [x] 63.2 重提弹窗学分要求上钉下滚
- [x] 63.3 选课器课程组：虚拟大组显示「—」

## 64. 整单附件材料节（增量 be）

- [x] 64.1 更新 proposal/design/spec
- [x] 64.2 申请表：声明前 SECTION「附件材料」；移出退课区
- [x] 64.3 详情：声明前「附件材料」始终展示（空则无）

## 65. 重提附件 / 已取消 / 锁类别过滤（增量 bf）

- [x] 65.1 更新 proposal/design/spec
- [x] 65.2 重提弹窗课程表下可调「附件材料」；提交写回
- [x] 65.3 取消申请→已取消保留行；可再改→待审批；提交剔除已取消
- [x] 65.4 选课器锁定类别时按 GE/ME/必修过滤（重修+加课重提）

## 66. 附件标题 / 待审批 / 缴费口径（增量 bg）

- [x] 66.1 更新 proposal/design/spec
- [x] 66.2 重提附件标题去 SECTION；样式对齐申请表
- [x] 66.3 详情 pending 展示「待审批」
- [x] 66.4 缴费已缴按订单分组；合计与行课程费口径一致；live 行去重

## 67. 附件居中 + 重修课程组范围（增量 bh）

- [x] 67.1 更新 proposal/design/spec
- [x] 67.2 重提「选择文件」文字居中
- [x] 67.3 重修/加课重提：课性外再按课程组（真实组 vs 普通池）过滤

## 68. 组已选红字 / 类型胶囊 / 同组 / 有效拟退冲突（增量 bi）

- [x] 68.1 更新 proposal/design/spec
- [x] 68.2 「课程组内已选」seatStatusClass → conflict 红
- [x] 68.3 重提/审批申请类型三色胶囊；重提选择文件对齐申请表
- [x] 68.4 收紧 ME 同课程组过滤（补课性/selectionGroup）
- [x] 68.5 有效拟退才抠冲突基线；换课校验与确认重提整单拦时段冲突

## 69. 组已选满文案 / 已驳回 / 附件 / 必修池 / 可取消（增量 bj）

- [x] 69.1 更新 proposal/design/spec
- [x] 69.2 组内已选满文案；操作列「已驳回」
- [x] 69.3 重提选择文件样式再对齐
- [x] 69.4 单选可取消已勾选（含冲突行）；必修重修重提仅原课

## 70. 横线 / 组内细化 / 学分决策投影（增量 bk）

- [x] 70.1 更新 proposal/design/spec
- [x] 70.2 选课器横线对比；组内两类细化文案
- [x] 70.3 详情 Rejected 与重提学分按行决策同源
- [x] 70.4 重提选课器与重提弹窗学分跟手（有效行+申请基线）

## 71. 重提选课红字 / 锚点学分 / 确认反馈 / 可再选（增量 bl）

- [x] 71.1 更新 proposal/design/spec
- [x] 71.2 重提退课隐藏红字摘要；锚点学分对齐外层
- [x] 71.3 确认失败选课器内提示；单选取消后可再选

## 72. 选课器置灰硬禁（增量 bp，收窄 bl）

- [x] 72.1 更新 proposal/design/spec
- [x] 72.2 单选：禁用行不可新选；仅预选行可取消/勾回；状态列先提示

## 73. 退课池与学分条对齐 26（增量 bq）

- [x] 73.1 更新 proposal/design/spec
- [x] 73.2 演示审结额外加/重修不落课；`scheduleApplied: false` 生效

## 74. 重提可留已驳回 + 蓝 tip 第三轮（增量 br）

- [x] 74.1 更新 proposal/design/spec
- [x] 74.2 重提门禁/文案/落库保留 `update_required`；老师再审锁定已驳回行
- [x] 74.3 学分蓝 tip 展示第三轮 `supplement` 起止
