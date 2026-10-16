## Decisions

1. 缴费导出：`btn-default` → `btn-outline`；位置不变。
2. 审批展示：`ensureDateTimeWithSeconds(row.submittedAt)`；种子 `studentDemoSeed` 无秒项补 `:00`。
3. 白名单：`formatWhitelistAddedAt` 改为输出 `YYYY-MM-DD HH:mm:ss`（复用 `formatLocalDateTimeWithSeconds` / `ensureDateTimeWithSeconds`）；兼容解析旧 `DD-Mon-YYYY`，缺时补 `00:00:00`。
4. 导出行若直接读 `submittedAt`/`addedAt`，与列表同源格式化。

## 影响文件

见 proposal Impact。
