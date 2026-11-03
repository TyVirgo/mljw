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

## Decisions（UX 打磨增量）

6. **课程选择器搜索**：补 `search-bar` 以吃到全局 `list-page-search` 横排规则；`pageSize` 默认 20。
7. **邀请门时长**：UI 只绑 `permissionHours.supplement`；保存前把该值抄到已开的 `canAdd`/`canDrop`/`canRetake`。常量 `SUPPLEMENT_INVITE_HOURS` 改为 48。
8. **多选学生**：`WhitelistStudentPickModal` 对齐 `AdminAddStudentPickModal`（checkbox + Map + `initialSelected`）；抽屉标签回显对齐 `AdminAddCourseForStudentModal`；`addStudentToSupplementList` 循环写入，已存在跳过。

## Decisions（文案 / 必填 / demo）

9. **去掉最高学分**：抽屉不再勾选；保存强制 `bypassCreditMax=false`；seed 改用 `bypassCreditMin` 等。数据层 key 可暂留以兼容旧闸门读取。
10. **先修必填**：勾选后课程与学期必填；`hasWhitelistPrerequisiteBypass` 在无课号时返回 false（不再「空=全部豁免」）。
11. **全选**：课程选择器表头 checkbox 仅作用于**当前页**。
12. **标签单行**：先修课程 tag-field `nowrap + overflow:hidden`，不加 `+N`。

## Decisions（通知列与操作）

13. **发送通知**：`attempt===0` 或门仍有效时可点；每次 `attempt+1` 并 `applyInviteWindow` 重置截止；**不限次数**。
14. **再次开放**：仅 `attempt>=1` 且门已逾期；与发送通知分按钮；去掉 `SUPPLEMENT_MAX_INVITE_ATTEMPTS` 拦截与 `needsManual`。
15. **演示逾期**：列表不再暴露。
16. **日期**：`formatWhitelistAddedAt` → `DD-Mon-YYYY`；新建写入与列表展示共用。

## Decisions（Callout / 菜单 / demo）

17. **capacityHint**：白名单页不再展示。
18. **模块说明**：`cr-guide-group` 从菜单树移除（路由/页面可保留，侧栏不挂）。
19. **demo 邀请态**：种子用相对「当前时刻」的 `deadlineAt`（过去=逾期，未来=有效），加载即可看到再次开放。
20. **父项勾选**：打开时默认三子项 true；取消父项仍清空子项。

## Decisions（通知弹框 / 演示学生）

21. **弹框**：复用 `MonitorRemindModal`（`titleKey` / `confirmKey` / `draftBuilder`）；再次开放确认文案「开放并发送通知」。
22. **演示学生**：`XMUM2309001` 保持有效门（窗外可申请）；逾期行用如 `COS2409001` / `AIT2409010` 等。

## Risks

- 旧 WhitelistView 若将来挂回菜单须用 `whitelistBoa` 键。
- 历史行若曾按子权限配置不同小时数，编辑时以父项 `supplement.validHours` 为准展示。
- 历史「空课号=全部豁免」行在逻辑收紧后将不再豁免，需靠 demo/编辑补课号。
