## Context

`SupplementEntryDrawer` 权限区为左右两列：左为加退课父子权限，右为豁免/未来学期等并列项。换组目前嵌在左列「可加课」下。

## Goals / Non-Goals

**Goals:** UI 整块（勾选 + 选择行）移到右列；启用仍依赖 `supplement && canAdd`。

**Non-Goals:** 不改业务数据与换组锁判定。

## Decisions

1. **搬家**：剪切 `permission-nested` 换组块到 `permission-side` 顶部（豁免先修之前，便于一眼看到）。
2. **门禁**：`:disabled` / `is-disabled` / `v-if` 展示选择行仍要求 `!permissionsLocked && form.supplement && form.canAdd`（方案 A）。
3. **清理**：取消可加课时仍走现有 `onCanAddChange` 清空换组；左列不再保留空 nested 容器。
4. **文案**：whitelist 操作说明第③条改为右列表述。

## Risks / Trade-offs

- [右列变长] → 可接受；原左列变短更清晰

## 影响文件

- `src/components/courseRegistration/SupplementEntryDrawer.vue`
- `src/i18n/locales/zh.js`、`en.js`
