# 设计：polish-credit-capsule-label-sep

## Context

列表 `.cr-credit-matrix` 为 5 列 grid（总分 + 4 明细）；CSS 已有 `.cr-list-context-sep`，模板未插入。i18n 现为 `…(已选/要求)(ME)`。

## Decisions

1. i18n 改为 `ME毕业学分(已选/要求)` 等；英文 `ME Graduation credits (selected/required)`。
2. 总分后、明细前插入 `<span class="cr-list-context-sep" aria-hidden="true">|</span>`。
3. grid：`max-content auto repeat(4, max-content)`（总分 | sep | 4 明细）。
4. 入口卡 `dd.cr-type-entry-credits` 同样插 sep（flex/inline，无需改 grid）。

## Risks

- 窄屏换行：sep 随 grid 占一列，两行结构仍清晰。
