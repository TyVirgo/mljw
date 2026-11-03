## Context

Section IV 内 Tab 已只滤原课；费用框在 IV 外。退课 `dropReason` 仍必填。

## Goals / Non-Goals

**Goals:** 原课/公共区结构清晰；费用三行明细贴公共区；退课补充说明可选。

**Non-Goals:** 按课明细行；在线选课。

## Decisions

1. 模板拆 `retake-original-block` / `retake-common-block`；有 IV 时费用框放进 common；无 IV 时仍在声明前展示。
2. 去掉 `validateAddDropSectionForm` 对 `dropReason` 的必填；文案改「补充说明」。

## Risks / Trade-offs

- [历史申请详情仍显示 dropReason 字段] → 标签随 i18n 变为补充说明即可。
