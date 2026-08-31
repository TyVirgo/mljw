# 设计：polish-student-r1-volunteer-slots

## Context

- R1 单课提交 → 待分配；加权依赖确认后的次序
- 「我的选课」定位为汇总/结果，不适合再做确认台

## Decisions

1. **两轴**：提交志愿=入池；确认志愿=锁序（入口在「本轮选课情况」抽屉）
2. **列表拆分**：待分配志愿在上、排队中在下；排队无志愿次序列
3. **工具条**：确认志愿在前、调整志愿顺序在后；拖拽调序
4. **排队操作**：取消排队在前，查看进度在后
5. **锁死**：确认后至公示前不可调序/撤出/追加
6. **我的选课**：只读已确认志愿结果 + release；无确认按钮、无继续选课、无未确认黄条 callout；顶栏一行核心学分+「更多」展开；表标题标明志愿选课结果；课程代码/名称分列
7. **拖拽**：原生 HTML5 DnD
8. **待分配志愿互撞（软提示）**  
   - 只比较待分配行之间的 meetings / 上课时段（同星期几且时间相交）；不含排队中、不含已确认课表  
   - 主表「提交志愿」仍只处理已占课/已选课硬冲突，不因志愿互撞置灰  
   - 内嵌区：warning callout 列出冲突课号 + 调序/落选说明；冲突行标记  
   - 检测复用 `detectScheduleConflict` + `getSectionMeetings`

9. **内嵌本轮选课情况（2026-08）**  
   - 搜索区与工具条之间常驻 `StudentRegistrationRoundStatusPanel`；去掉「本轮选课情况」按钮与侧拉抽屉  
   - 收起：志愿/已选前 3 行 + 排队摘要常显；展开：第 4 行起  
   - 无「确认志愿」「调整志愿顺序」；首列拖拽柄随时调序（截止前），松手即 `applyPendingVolunteerOrder` 并同步快照  
   - 锁死：仅显式 demo 公示（`releaseMode`/`demoVolunteerReleaseMode`）或当前开放轮非第一轮；**不**按 `resultReleaseAt` / `Date.now` 自动锁死  
   - R2/R3：已选前 3 + 展开；排队摘要常显

10. **冲突 tip 层级**  
    - 行内冲突 tip 与顶部 Callout 须高于 sticky 列；避免被 `overflow` 裁切遮挡

11. **内嵌抽屉收纳（§8）**  
    - 去掉顶部冲突 Callout；保留行内 `!` tip  
    - 去掉标题旁「展开其余」按钮；主表常显前 3 行  
    - 表下抽屉式展开条（非独立大按钮）：默认收起；展开后含第 4 门及以后 + 排队中完整表行  
    - `canUnselect`：R1 志愿仍受 `isVolunteerListLocked`；R2/R3 已选仅要求轮次开放 + 批次 active

12. **抽屉收口条脚注式（§9）**  
    - DOM：`body`（其余行 + 排队）在前，`rail` 在后；展开时条跟随该块末尾，不夹在主表第 3 行与第 4 行之间  
    - 收起时条仍紧贴主表前 3 行下方（body 隐藏）  
    - 左侧仍为「还有 N / 排队 M」汇总；右侧文案「展开」|「收起」+ 箭头

13. **本轮选课情况单表头（§10）**  
    - 主表一张：收起前 3 行，展开同一表追加第 4+ 行，禁止第二套 thead  
    - 抽屉 body 仅收纳排队表（若有）；收口条仍在末尾

14. **在线锁与结果页解耦（§11）**  
    - `isVolunteerListLocked`：只认 `demoVolunteerReleaseMode === 'released'` 或开放轮非 `preselect`  
    - 不认结果页 `volunteerSheetsByBatch[batchId].releaseMode`（该字段仅服务「我的选课」公示 demo）

15. **按行退选/拖拽（§11）**  
    - 待分配：可退选 + 可拖  
    - 选课失败（`failed` / `miss`）：不可退选、不可拖  
    - R2/R3 已选成功仍可退选（失败行除外）

16. **排队表列对齐（§11）**  
    - 志愿模式下排队表左侧增加与拖拽列同宽的空列，序号列对齐志愿次序列宽；共用固定列宽

17. **本轮与课表预览同步（§12）**  
    - RegisterView 向 `buildPreviewSchedule` 传入与本轮选课情况同源的 `wishPreview`  
    - `listVolunteerWishCoursesForSchedule` 不认结果页 sheet.releaseMode  
    - `WeekScheduleGrid`：同日起止多门叠显多块（虚线可叠）

## Risks

- 确认入口易被忽略 → 抽屉副文案；空表提示引导在线选课

## Open Questions

- 无
