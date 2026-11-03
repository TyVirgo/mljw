## Decisions

1. 仅 `.data-table--queue`：操作列约 108px，内层 `.queue-actions` 竖排两按钮。
2. sticky：`capacity.right = 108`；`has-capacity-col` 时 `status.right = 220`（108+112）。
3. 主表 `--pref` / `--flat` 无 queue 时保持原 72px。
