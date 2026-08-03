# 选课管理-加退课审批 — 设计要点（合并）

## 文档用途

汇总历史 design 中与本菜单相关的决策与约束，供写需求文档时对照。冲突处以较新变更及当前代码为准。

## 来源：add-drop-deadline-branches

## Context

批次已有 `dropDeadlineWeek`（默认 5）。学生 Drop 现一律 `submitStudentAddDropApplication` → Pending。需用可切换的「当前教学周」驱动两条通道。

## Goals / Non-Goals

**Goals:**
- 演示周 ≤ 截止周 → 自助 Drop；可配免审立即生效
- 演示周 > 截止周 → 特殊 Drop，强制理由 + 佐证文件名
- 管理端可见渠道差异

**Non-Goals:**
- 真实学术日历、多级审批节点引擎、对象存储

## Decisions

1. **演示教学周**  
   `ref` 存于模块（如 `demoTeachingWeek.js`），加退课页顶部下拉 1～14，默认 3。不持久化亦可。

2. **渠道字段**  
   申请：`dropChannel: 'self' | 'special'`；特殊时 `reason`、`attachments: [{ name }]`。

3. **免多级审批**  
   批次 `selfServiceDropNoApproval`（默认 `true`）。为 true 且常规 Drop → `status: 'Approved'`，并调用移除已确认课程（不校验选课阶段）。为 false → Pending + channel self。

4. **超期 UI**  
   选 Drop 后展示理由 textarea + file input；校验非空；按钮文案「提交特殊审批」。

5. **与退选边界**  
   本页仅 Drop；不改结果页退选。

## Risks / Trade-offs

- [Risk] 评审误以为教学周是真实教务周 → Mitigation：控件标注「演示」
- [Risk] 自助立即 Approved 与管理端列表混淆 → Mitigation：渠道徽章 + 审批日志「自助退课生效」

## Migration Plan

1. 改批次默认字段与表单  
2. 改提交与学生/管理端 UI  
3. 冒烟：周 3 自助；周 6 特殊必填；管理端可见

## Open Questions

（无）
