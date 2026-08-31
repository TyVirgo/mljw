# 任务：polish-student-r1-volunteer-slots

## 1. 数据层

- [x] 1.1 逐次入池、调序、确认锁、公示快照
- [x] 1.2 拖拽落序 API（按 courseId 列表重排）
- [x] 1.3 我的选课行：仅已确认快照 / release

## 2. 本轮选课情况 UI

- [x] 2.1 排队/志愿分表；志愿表含次序列；确认在前、调序在后
- [x] 2.2 「调整志愿顺序」拖拽模式（完成/取消）
- [x] 2.3 排队操作：取消排队在前、查看进度在后

## 3. 我的选课

- [x] 3.1 去掉确认志愿、继续选课、未确认黄条 callout
- [x] 3.2 顶栏压缩+更多展开；代码/名称分列；结果文案
- [x] 3.3 i18n

## 4. 收尾

- [x] 4.1 自测拖拽/确认/只读汇总
- [x] 4.2 勾选本 tasks

## 5. 待分配志愿互撞提示（增量）

- [x] 5.1 按当前批次过滤待分配；检测志愿互撞（meetings + 同日时段相交）
- [x] 5.2 抽屉 callout + 行标记；不禁用确认；i18n
- [x] 5.3 GE HUM / ME SWE 种子各含一对互撞课；公示 demo 互撞对高志愿中签低志愿落选
- [x] 5.4 更新 proposal/design/spec；勾选本 tasks

## 6. 本轮选课情况内嵌（2026-08）

- [x] 6.1 `StudentRegistrationRoundStatusPanel`：收起前 3 行 + 排队摘要；展开其余
- [x] 6.2 去掉确认/调序按钮；首列拖拽即时保存；顺序即确认
- [x] 6.3 `StudentRegisterView` 嵌入面板、去掉按钮与抽屉；排队成功展开并滚动
- [x] 6.4 R2/R3 已选前 3 + 展开；i18n
- [x] 6.5 更新 proposal/design/spec；勾选本 tasks

## 7. 拖拽可见 + 操作列 + tip 层级（增量）

- [x] 7.1 R1 进行中：拖拽列可见可拖；操作列保留退选等；锁死只认 demo（公示/非 R1），不靠真实时钟误锁
- [x] 7.2 冲突说明 tip/Callout 提到顶层，不被 sticky 表头裁切
- [x] 7.3 更新 proposal/design/spec；勾选本 tasks

## 8. 内嵌面板抽屉收纳（增量）

- [x] 8.1 去掉冲突 Callout；保留行内 `!` tip
- [x] 8.2 去掉标题旁展开按钮；表下抽屉条默认收起；内含第 4 门+及排队全表字段
- [x] 8.3 R2/R3 已选操作列恢复退选（志愿锁不挡已选退选）
- [x] 8.4 i18n；更新 proposal/design/spec；勾选本 tasks

## 9. 抽屉收口条脚注式 + 展开/收起文案（增量）

- [x] 9.1 收口条移到展开内容（其余行 + 排队）之后；展开时不夹在第 3/4 行之间
- [x] 9.2 条右侧箭头左侧增加「展开」/「收起」文案；i18n
- [x] 9.3 更新 proposal/design/spec；勾选本 tasks

## 10. 本轮选课情况单表头（增量）

- [x] 10.1 主表收起前 3 / 展开同表追加其余行；去掉第二套 thead
- [x] 10.2 抽屉 body 仅排队（若有）；收口条仍在末尾
- [x] 10.3 更新 proposal/design/spec；勾选本 tasks

## 11. R1 待分配可操作 + 失败行约束 + 排队对齐（增量）

- [x] 11.1 `isVolunteerListLocked` 与结果页 sheet.releaseMode 解耦
- [x] 11.2 待分配：退选+拖拽；失败行：无退选、不可拖；GE/ME 同规则
- [x] 11.3 排队表左侧占位与志愿表列宽对齐
- [x] 11.4 更新 proposal/design/spec；勾选本 tasks

## 12. 本轮选课与课表预览全量叠显同步（增量）

- [x] 12.1 预览数据与本轮选课情况同源（R1 待分配 / R2·R3 已选）；不认结果页 releaseMode 清空
- [x] 12.2 WeekScheduleGrid 同格叠显多块虚线
- [x] 12.3 更新 proposal/design/spec；勾选本 tasks
