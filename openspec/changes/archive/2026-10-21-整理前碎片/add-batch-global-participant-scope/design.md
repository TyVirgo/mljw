## Context

现有 `batch.scopeRules` 按 `round`（preselect/main/supplement）配置；`matchScopeRules` 在某轮无专属规则时判定不可选。批次表单 §1–§3 已有，无全局参与范围。名单能力已有 `listStudentsForScopeRule` / 学生清单抽屉可复用只读表。

## Goals / Non-Goals

**Goals:**

- 编辑批次 §4 只读：培养方案来源说明 + 人数 + 查看清单。
- 新建不出现 §4。
- 全局由 `academicSession` + `type` + `programme`（ME）推导，不可手改。
- 轮次 `scopeRules` 默认 `[]`；有则覆盖该轮。
- 匹配与按轮名单：无轮次规则 → 用全局。

**Non-Goals:**

- 全局规则表编辑、真实培养方案 API。
- 大改轮次管理 UI。

## Decisions

### 1. 全局不落可编辑字段

全局参与人选**即时推导**（`deriveGlobalScopeRuleFromProgrammePlan`），不提供 `globalScopeRules` 编辑存档。保存批次时仍只保留轮次 `scopeRules`（默认可空）。

**否决**：在表单中维护可编辑全局规则表（与「只展示人数和清单」冲突）。

### 2. 覆盖语义

```
resolveEffective(round):
  if round 有 scopeRules → 该轮规则
  else → [deriveGlobal(...)]
```

`matchBatchScope` 与 `listStudentsForBatchRound` 共用该解析。

### 3. §4 仅编辑可见

`v-if="batch"`（已有批次实体）。新建无实体 → 不渲染。

### 4. Demo 种子

新建/默认批次 `scopeRules: []`；个别 demo 仍可带轮次规则以演示覆盖。空态文案改为「不设则使用批次全局参与范围」。

## Risks / Trade-offs

- 清空调试种子的轮次规则后，三轮名单趋同（均为全局）——符合产品语义。
- GE 无所属专业时用宽口径（维「全部」）保证编辑态全局非空。
