## Context

加课池仅 `ELIGIBLE_ADD_SEED`；拟退必修在 `form.dropLines`。换组锁已用 `mergeCoreLockOriginLines`，但课不在列表则无效。

## Goals / Non-Goals

**Goals:** 拟退必修并入加课池；换组锁文案后「？」白名单 tip。

**Non-Goals:** 不重做冲突算法；不改红文案主句。

## Decisions

1. `mergeEligibleAddWithPendingDropCores(eligible, dropLines)`：对每条必修拟退，用课库展开全部分组；`originalSectionCode` 取拟退 `sectionCode`；`eligibilitySource: 'same_term_drop'`（展示可回退 prior_drop 文案或新键）。
2. 同课号已在种子中：用拟退原组覆盖 `originalSectionCode`（本单拟退优先）。
3. View：`pickingFor === 'add' || action === 'Add'` 时合并 `form.dropLines`；AddDrop 选加时 `pickingFor === 'add'`。
4. Tip：仅 `isRowBlockedByCoreSectionLock` 时在状态旁显示「？」；`title` 用新 i18n `coreSameSectionReaddWhitelistTip`。

## Risks / Trade-offs

- [拟退选修是否并入] → 本变更仅必修  
- [同课种子原组与拟退不同] → 拟退覆盖
