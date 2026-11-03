## Decisions

1. `isRowBlockedByCoreSectionLock` 仅当 `action` 为 `Add` 或 `AddDrop`。
2. 提交：`RetakeDrop` 去掉 `hasCoreOtherSectionReaddViolation`；`AddDrop` 保留；纯 `Add` 若有原组上下文可同样校验（与弹窗一致，用 enrolled/seed 原组）。
3. 提示键：`coreMustSameSectionReadd` 改为短句；`coreMustSameSectionRetake` 标记弃用（同短句兜底）。
4. 加课白名单换组逻辑不变。
