## Context

内部仍保留 Add / Drop / Retake / AddDrop / RetakeDrop 五种 action；展示层用 `displayPrimaryType` + `resolveAppNeedDrop`。

## Goals / Non-Goals

**Goals:**
- 列表/详情类型标签只映射主类型三字与对应色标
- 是否退课：优先 `app.needDrop`，否则 `needDropFromAction`；纯 Drop 默认为 yes
- 列位置：学生 `type → needDrop → status`；审批 `type` 后接 `needDrop`

**Non-Goals:**
- 不新增申请类型；不改提交 payload 的内部 type

## Decisions

1. **Drop 的 needDrop**：倾向「是」，与「是否退课」列语义一致（纯退课即为退课）。
2. **primaryOption**：与列表 type 文案对齐为三字，是否退课由独立控件/列表达。
3. **列头**：短文案「是否退课」/`Need drop`（`needDropColumn`），表单仍可用较长 `needDropLabel`。

## Risks / Trade-offs

- 旧 demo 若无 `needDrop` 字段，靠 type 推导；Drop 历史数据一律显示「是」。
