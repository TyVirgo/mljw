## Decisions

1. 单行容器：`search-row` 内 `search-fields`（flex-wrap）+ `search-actions`（右贴）。
2. 次要条件：`v-if/v-show="searchExpanded"` 挂在同一 `search-fields` 内，删除 `search-row-secondary`。
3. 默认 input/select 宽约 150px；区间控件保持更窄。
