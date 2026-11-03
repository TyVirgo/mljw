## Decisions

1. 行级：`feeAmount` 不含税；`sstAmount = computeSstAmount(fee, category)`；`amount = fee + sst`。
2. Demo seed 计税类别固定 `China`（展示清晰）；live 行用 profile.studentCategory。
3. `unitRate` 用 `feeAmount / billableCredits`。
4. STORAGE_KEY 升 `v3`，避免旧缓存裸 amount 污染。
5. 结算：课程费合计、SST 合计、应付合计。
6. 订单 `total` 以当前行 `amount` 之和为准（hydrate / 展示时 `syncOrderMoneyFromLines`），避免 SST 上线前快照漏税。
7. 进入页固定默认「待缴费」；结算明细分行展示，禁止 nowrap 横滚。
