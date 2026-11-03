## Context

加课选课器已有表头 `th-label-with-tip` + `tip-icon`（`title`）。需在 GE/ME Tab 复用。

## Goals / Non-Goals

**Goals:** 加课 GE/ME Tab 旁「？」说明 R3 规则；交互不变。

**Non-Goals:** 不置灰、不禁选、不改重修 Tab。

## Decisions

1. 仅 `isAddMode` 且 `tab.key` 为 `ge`/`me` 显示 tip。
2. 文案 i18n：`pickerElectiveTabRound3Tip`。
3. 「？」放在 Tab 按钮内，`@click.stop` 避免误切 Tab（或 tip 用 span 不冒泡到 button——tip 在 button 内 hover 即可，点击 tip 仍切 Tab 可接受）。

## Risks / Trade-offs

- 文案写「开放前置灰」但未实现 → 产品已知，后续可另开 change
