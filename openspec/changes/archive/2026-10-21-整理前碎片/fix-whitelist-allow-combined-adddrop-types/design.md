## Context

`deriveActionFromFlags` 已产出 `AddRetake` / `AddDropRetake`；提交闸门用 `allowedActions.includes(action)` 校验。

## Decisions

1. 组合类型由原子权限推导，与 `AddDrop` / `RetakeDrop` 同一模式。
2. 不要求单独勾选「允许加课+重修」类权限。

## Risks

- 旧演示白名单仅有 canAdd+canRetake 时，提交组合单将从失败变为成功（符合预期）。
