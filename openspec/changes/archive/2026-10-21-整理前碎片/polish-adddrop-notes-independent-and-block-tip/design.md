## Decisions

1. 字段：`dropReason` / `addNotes` / `retakeNotes` 三者独立；关对应「是否」时清空该侧说明。
2. 旧单仅重修且只有 `addNotes`：详情「重修补充说明」回退显示 `addNotes`。
3. 二次提示挂在学分条估算提示下方（pin 区），滚动区去掉 `pointer-events: none` 对滚动的阻断，改用字段 disabled / 已有 formOpsDisabled 禁用输入。

## Risks

- 旧组合单把加课说明写在 addNotes：加课区仍显示；重修区无 retakeNotes 则空或回退策略仅限「无加课有重修」。
