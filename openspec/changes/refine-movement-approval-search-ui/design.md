## Context

```
变更前（add-movement-approval-app）          变更后（本 change）
────────────────────────────────────        ────────────────────────────
[Role: Pending Review ▼]                    （移除）
[Submitted][Pending][History]               [Submitted][Pending][History]
搜索：3 字段 + 更多 → 2 字段                   搜索：5 字段响应式栅格 + Search/Reset
```

审批引擎 `classifyApprovalBucket(item, currentRole)` 仍依赖角色；UI 不再暴露切换，v1 使用固定默认角色。

## Goals / Non-Goals

**Goals:**

- 列表页视觉与产品图示一致：无 Current approver role
- 搜索 5 字段在同一区域自适应换行，宽屏多列、窄屏自动折行
- Search / Reset 始终右对齐于搜索区首行

**Non-goals:**

- 权限系统、Header 角色切换
- 搜索字段增删或 Tab 逻辑变更

## Decisions

### 1. 默认审批角色

```javascript
// movementApprovalEngine.js（或 MovementApprovalView 顶部常量）
export const DEFAULT_APPROVER_ROLE = 'Pending Review'
```

- `MovementApprovalView` 使用 `const currentRole = DEFAULT_APPROVER_ROLE`（非 `ref` 亦可，除非未来从 composable 注入）
- `MovementApprovalReviewView` 继续接收 `:current-role="currentRole"`
- 批量审批、`applyMovementDecision`、`canRecallMovement` 入参不变

**Trade-off:** 失去页内多角色 demo；开发调试可改常量或后续接 auth mock。

### 2. 页面结构顺序

```
┌ MovementApprovalView ─────────────────────────────────────┐
│ [Submitted] [Pending] [History]                             │
│ ┌ search-fields (grid) ──────────────┐ [Search] [Reset]   │
│ │ Academic Session | Movement Reason │                      │
│ │ Status | Student ID | Student Name  │                      │
│ └────────────────────────────────────┘                      │
│ [Review] [Export]  （仅 Pending Tab 显示 Review）           │
│ 表格 + 分页                                                  │
└─────────────────────────────────────────────────────────────┘
```

Tab 栏置于搜索区之上（与图示一致）。

### 3. 搜索区 CSS

参考 `CourseApprovalView.vue` 的 `.search-row` + `.search-fields` 模式，本页采用：

```css
.search-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
  justify-content: space-between;
}

.search-fields {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px 16px;
  flex: 1;
  min-width: 0;
}

.search-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  align-self: flex-end;
}
```

- 移除 `.search-row-secondary`、`searchExpanded`、`toggleSearchExpanded`
- 移除 `.role-bar`、`.role-select`、`.role-label` 样式块
- 每个 `.search-item` 保持 `label + input/select` 纵向堆叠

**断点行为：**

| 视口 | 预期 |
|------|------|
| ≥1200px | 5 字段约 3+2 或 5 列一行 |
| 768–1199px | 2–3 列换行 |
| <768px | 1–2 列；Search/Reset 可换行至字段下方全宽居中（flex-wrap） |

### 4. Script 清理

| 移除 | 保留 |
|------|------|
| `import { approverRoleOptions }` | `classifyApprovalBucket`, `filterByBucket`, … |
| `watch(currentRole, …)` | `watch(activeTab, …)` |
| `searchExpanded`, `toggleSearchExpanded` | `searchForm`, `appliedSearch`, `handleSearch/Reset` |

### 5. i18n

- UI 不再调用 `t('movementApproval.currentRole')`
- `movementApproval.search.*` 保持不变

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 无法 demo 多角色 Tab | 文档注明改 `DEFAULT_APPROVER_ROLE`；后续 auth 接入 |
| 窄屏按钮被挤到第二行 | `flex-wrap` + `align-self: flex-end` |

## Migration Plan

1. 导出 `DEFAULT_APPROVER_ROLE` 并替换 `ref('Pending Review')`
2. 删除 role-bar 模板与样式
3. 合并搜索字段、更新 CSS、删除展开逻辑
4. 冒烟 + `npm run build`

## Open Questions

（无阻塞项；默认角色 `Pending Review` 与现网 mock 一致。）
