## Context

```
当前（refine-movement-approval-search-ui）     目标（本 change）
─────────────────────────────────────────     ─────────────────────────────
Academic Session                              Academic Session  [________]
[______________]                              Movement Reason   [________]
（标签与输入分两行）                            Status            [▼ All    ]
                                              （标签与输入同一行）
```

全局样式 `list-page-search.css` 已定义 inline 布局；`MovementApprovalView` scoped 样式覆盖了该行为。

## Goals / Non-Goals

**Goals:**

- 每个搜索项：标签 + 输入/下拉 **同一行**，标签 `white-space: nowrap`
- 搜索区整体与课程审批等模块视觉一致
- 删除冗余 scoped 搜索样式，避免再次覆盖全局规范

**Non-goals:**

- 强制 5 个字段永不折行（窄屏时字段组可 wrap，但组内不换行）
- 搜索逻辑变更

## Decisions

### 1. 采用全局 `list-page-search.css`，删除 scoped 覆盖

**删除** `MovementApprovalView.vue` scoped 中的：

- `.search-fields` grid 定义
- `.search-item { flex-direction: column }`
- `.search-item label` 小字号覆盖（改用全局 13px）
- `.search-input, .search-select` 重复定义（全局已有）
- `.search-row { align-items: flex-end }`（改为全局 `align-items: center`）

**保留**（页面特有、不与 `.search-bar` 冲突）：

- `.search-bar { margin-bottom: 16px }` 可删除（全局已有 border-bottom）；若与 page-card 间距需微调可留 `margin-bottom` only

### 2. 模板结构

保持现有 DOM 结构不变（已符合全局选择器）：

```html
<div class="search-bar">
  <div class="search-row">
    <div class="search-fields">
      <div class="search-item">
        <label>...</label>
        <input class="search-input" />
      </div>
      ...
    </div>
    <div class="search-actions">...</div>
  </div>
</div>
```

### 3. 标签冒号（可选）

与 `CourseApprovalView` 对齐时，英文 flat key 常带 `:`（如 `Student ID:`）。当前 movement 搜索 label 使用 i18n nested key 无冒号——**v1 不改文案**，仅调布局；若视觉需冒号可在 i18n 或 label 模板追加。

### 4. 窄屏行为

| 层级 | 行为 |
|------|------|
| 单字段内 | 标签 + 控件始终同行，`label { white-space: nowrap }` |
| 字段之间 | `search-fields` flex-wrap，空间不足时整组换行 |
| 操作按钮 | `search-actions` 保持右侧，`margin-left: auto` |

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 长中文标签挤压输入框 | `label` nowrap + 输入固定宽度 180px；必要时缩短 i18n |
| scoped 删除后与其他页面样式耦合 | 有意复用全局规范，降低维护成本 |

## Migration Plan

1. 删除 `MovementApprovalView.vue` scoped 搜索相关 CSS
2. 目视对比 `CourseApprovalView` 搜索区
3. `npm run build` + 浏览器缩放冒烟

## Open Questions

（无阻塞项。）
