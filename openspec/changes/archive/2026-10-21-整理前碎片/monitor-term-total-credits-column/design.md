## Context

监控主表已用 `getMonitorTermInsight` 提供 `term.ge` / `term.me`（学期已选）及对应要求；分组表头在入学批次之后是 GE/ME/必修组。

## Decisions

1. **口径**：学期总学分 = `Number(term.ge) + Number(term.me)`，仅已选分子；不含必修、不含要求分母。
2. **位置**：入学批次后、GE 分组前；`th`/`td` 均为 `rowspan=2` 单列。
3. **导出**：`monitorExportFields` 在 `intake` 后插入 `termTotalCredits`；`formatMonitorExportRow` 写入同值。

## Risks / Trade-offs

- 列名易被理解为「含必修」→ 文案可用「学期总学分」，callout 不强制；规格写明仅 GE+ME。
