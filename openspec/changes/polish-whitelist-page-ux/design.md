# 设计：polish-whitelist-page-ux

## Context

- 侧栏「白名单」→ `SupplementListView` + `supplementListQueue`
- `courseRegistration.whitelist` 在 zh/en 中出现两次，后者（BOA）覆盖前者（突破限制文案）
- 编辑抽屉已有权限勾选与小时数，但只能改已有行

## Decisions

1. **i18n**：保留现行键在 `whitelist`；将 BOA 块整体迁到 `whitelistBoa`；briefs 下旧 whitelist 说明可改指向或保留在 briefs 内（briefs.whitelist 不冲突）。
2. **新增**：同一 `SupplementEntryDrawer` 增加 `mode=create`：选人 + 权限 + 时长；调用 `addStudentToSupplementList`。
3. **选人**：复用 `BatchSpecialStudentPickModal` 同源候选人 API（`listAdminAddStudentCandidates`），排除已在白名单者；可新建轻量 `WhitelistStudentPickModal` 或内嵌复用 pick。
4. **来源列**：展示 `manual` / `registration-monitor` 的 i18n。
5. **未发邀请文案**：改为「已在名单（未发邀请）」避免与「未生效」混淆；闸门逻辑暂不改。

## Risks

- 旧 WhitelistView 若将来挂回菜单须用 `whitelistBoa` 键。
