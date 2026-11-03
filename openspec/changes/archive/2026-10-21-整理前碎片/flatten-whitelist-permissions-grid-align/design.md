## Context

`SupplementEntryDrawer` 权限区现为左父项+children、右并列项，未来学期曾误嵌 children，换组仍门禁 canAdd。

## Goals / Non-Goals

**Goals:** 点名权限一级化；两列网格对齐；可加/退/重修保留为父项二级。

**Non-Goals:** 不改后端 permissions 结构。

## Decisions

1. **结构**  
   - 左列一级：supplement(+小时) → 其下 children 仅 canAdd/canDrop/canRetake → 再并列一级 futureMandatory、futureElective（与父项同缩进层级，不在 children 边线内）  
   - 右列一级：coreSwitch(+选课行)、bypassPrerequisite、bypassCreditMax、allowDropBelowCreditMin  
2. **对齐**：`permission-layout` 用两列 grid；左右各列用相同 `gap`；一级行用统一 `min-height`；换组展开选课行不破坏第一行对齐（选课行跟在换组勾选下方占额外高度，右列可多占）。  
3. **换组门禁**：仅 `permissionsLocked`；勾选后展示选课行；`v-if` 改为 `allowCoreSectionSwitchAdd`（不再要求 canAdd）。  
4. **文案**：formHint 去掉「可加课下换组 / 右列」旧述，改为一级权限说明。

## Risks / Trade-offs

- [左列含二级后行高高于右列首行] → 可接受；一级项本身左右顶对齐
- [未勾可加课却勾换组] → 业务仍可按既有逻辑在加课路径使用换组；若需强制联动另做校验（本变更不做）

## 影响文件

- `SupplementEntryDrawer.vue`
- `zh.js`、`en.js`
