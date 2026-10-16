## Context

`SupplementEntryDrawer` 右侧学分例外现为：勾选文案一行 + `v-if` 缩进「可超 [N] 分」。批次 `RegistrationBatchFormDrawer` 的 `local-rule-drop` 已是「勾选 + 句中数字」先例。

## Decisions

1. **同行模板**：对齐 `local-rule-drop`——`☑ 允许突破本学期学分要求，可超 [N] 分`；去掉换行与 `v-if`。
2. **未勾选交互**：数字框始终渲染，`:disabled="!bypassCreditMax"`；保存校验仍仅在勾选时校验 1–3。
3. **tip 分层**：`formHint` 改为序号分条（① 加退课父项 ② 先修豁免 ③ 学分例外/可超 ④ 未来必修）；不引入整页 `step-badge` section。
4. **文案**：中文用顿号/逗号保持一句读感；英文用逗号衔接 `Allow exceeding…, up to [N] credits`。

## Risks / Trade-offs

- 右栏权限列较窄时，长中文可能换行；用 `flex-wrap` + 紧凑 `inline-number`，优先保证「逗号后数字」紧贴文案。
- tip 变长：可接受，换来分层清晰。
