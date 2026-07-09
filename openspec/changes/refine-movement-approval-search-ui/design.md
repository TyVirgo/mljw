## 背景说明

```
变更前（add-movement-approval-app）          §1–§5 已交付              §6–§10 目标态
────────────────────────────────────        ─────────────────          ─────────────────────────
[Role: Pending Review ▼]                    （已移除）                  —
[Submitted][Pending][History]               同左（顺序未改）            [Pending][Submitted][History]
搜索：3 字段 + 更多 → 2 字段                   5 字段响应式栅格           4 字段（无异动原因）
表格：含异动原因；状态 badge 不可见            同左                       去原因 + 加申请日期；历史 Tab 才 Y/N
```

审批引擎 `classifyApprovalBucket(item, currentRole)` 仍依赖角色；UI 不再暴露切换，v1 使用固定默认角色 `Pending Review`。

## 目标 / 非目标

**目标：**

- 列表页视觉与产品图示一致：无 Current approver role
- 搜索字段在同一区域自适应换行（§8 后 **4 字段**）
- Search / Reset 始终右对齐于搜索区
- Tab 顺序 **待我审批 → 已提交 → 历史**；仅待我审批显示角标
- 表格：状态 badge 可见；去异动原因；加申请日期；历史 Tab 才显示是否实施 Y/N

**非目标：**

- 权限系统、Header 角色切换
- ~~搜索字段增删或 Tab 逻辑变更~~（§6 允许搜索减字段、Tab 顺序/角标与列展示调整；**不**改 `classifyApprovalBucket` 语义）

## 设计决策

### 1. 默认审批角色

```javascript
// movementApprovalEngine.js（或 MovementApprovalView 顶部常量）
export const DEFAULT_APPROVER_ROLE = 'Pending Review'
```

- `MovementApprovalView` 使用 `const currentRole = DEFAULT_APPROVER_ROLE`（非 `ref` 亦可，除非未来从 composable 注入）
- `MovementApprovalReviewView` 继续接收 `:current-role="currentRole"`
- 批量审批、`applyMovementDecision`、`canRecallMovement` 入参不变

**权衡：** 失去页内多角色 demo；开发调试可改常量或后续接 auth mock。

### 2. 页面结构顺序（§6–§10 目标态）

```
┌ MovementApprovalView ─────────────────────────────────────┐
│ [Pending (7)] [Submitted] [History]   ← 仅 Pending 角标   │
│ ┌ search-fields (grid, 4) ───────────┐ [Search] [Reset]   │
│ │ Academic Session | Status           │                     │
│ │ Student ID | Student Name         │                     │
│ └────────────────────────────────────┘                     │
│ [Review] [Export]  （仅 Pending Tab 显示 Review）          │
│ 表格 + 分页（History 多「是否实施 Y/N」列）                 │
└────────────────────────────────────────────────────────────┘
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
| ≥1200px | 4 字段约 2+2 或 4 列一行 |
| 768–1199px | 2 列换行 |
| <768px | 1–2 列；Search/Reset 可换行至字段下方 |

### 4. Script 清理

| 移除 | 保留 |
|------|------|
| `import { approverRoleOptions }` | `classifyApprovalBucket`, `filterByBucket`, … |
| `watch(currentRole, …)` | `watch(activeTab, …)` |
| `searchExpanded`, `toggleSearchExpanded` | `searchForm`, `appliedSearch`, `handleSearch/Reset` |

### 5. i18n

- UI 不再调用 `t('movementApproval.currentRole')`
- `movementApproval.search.*` 保持不变（§6 后移除 `movementReason` 搜索 key 引用）

### 6. Tab 顺序与角标

```
现在:  [已提交 11] [待我审批 7] [历史 10]
目标:  [待我审批 7] [已提交]    [历史]
              ↑ 仅此 Tab 显示 tab-count
```

```javascript
const APPROVAL_TABS = [
  { id: 'pending', labelKey: 'movementApproval.tabs.pending' },
  { id: 'submitted', labelKey: 'movementApproval.tabs.submitted' },
  { id: 'history', labelKey: 'movementApproval.tabs.history' },
]
```

模板：`v-if="tab.id === 'pending'"` 渲染角标。

### 7. 表格列（按 Tab 差异）

**公共列（三 Tab）：**

```
序号 | 状态 | 审批阶段 | 学号 | 姓名 | 申请学期 | 生效学期 | 异动类别 | 申请日期 | 操作
```

**仅历史 Tab 额外插入「是否实施」（建议在审批阶段之后）：**

```
… | 审批阶段 | 是否实施(Y/N) | 学号 | …
```

| 列 | 待我审批 / 已提交 | 历史 |
|----|-------------------|------|
| 状态 | ✅ badge 可见 | ✅ |
| 是否实施 | ❌ 不显示列 | ✅ Y/N |
| 异动原因 | ❌ 移除 | ❌ |
| 申请日期 | ✅ | ✅ |

**状态列修复：** 引入与申请列表一致的 `.status-draft` / `.status-progress` / … 背景色（可复用 `DefermentView` 配色或抽 `movement-status-badge.css`），并补 `Expired` 的 `statusLabel`。

**是否实施 Y/N：**

```javascript
function formatImplementedYn(value) {
  return value === 'Implemented' ? 'Y' : 'N'
}
```

待我审批 / 已提交在审批未完成前不会出现「已实施」，故不展示该列；历史 Tab 中 Approved 待实施仍为 **N**。

**申请日期：**

```javascript
function formatApprovalApplicationDate(sourceKey, item) {
  const raw = item.submittedAt || item.applicationDate || item.dateOfApplication
  switch (sourceKey) {
    case 'programme-transfer': return formatTransferListDate(raw)
    case 'deferment': return formatDefermentListDate(raw)
    // …
  }
}
```

与四异动 `*View.vue` 的 `displayDate` 回退链一致。

### 8. 搜索区（4 字段）

移除 Movement Reason 后：

```
学年学期 | 状态 | 学号 | 学生姓名 | [查询] [重置]
```

- `createEmptySearch` / `filterBySearch` 删除 `movementReason`
- `movementApproval.search.movementReason` i18n 可保留或删除

### 9. Mock seed（历史 Tab 的 Y 样本）

部分 **历史 Tab、Approved 且已维护实施** 的记录显式设 `implemented: 'Implemented'` → 列显示 **Y**；其余 Approved 保持默认 Pending → **N**。

### 10. 审批详情 footer + Modal（§12）

**现状（§12 前）：**

```
MovementApprovalReviewView
├── DetailModal（只读）
└── approval-section（mode=approve）  ← 内联 Action/Comments/Submit + 转专业 Section VII
```

**目标：**

```
MovementApprovalReviewView
├── DetailModal（只读）
│     footer: [审批] [关闭]   ← showApprovalAction=true（仅 Pending）
├── MovementApprovalModal（Teleport，点击审批打开）
└── recall-section（mode=history，不变）
```

**与课程审批对齐：** `CourseApprovalView` 详情只读，审批仅经列表 Modal；异动 Pending 详情改为「footer 触发同一 Modal」。

**Section VII（决策 A）：**

- 列表 `MovementApprovalModal` 当前无 Dean/HoP 教务区
- §12 **不扩展** Modal；转专业最终审批依赖申请内 `newProgrammeFirstChoice` / 已有 `adminNewProgramme`
- 若后续需 Modal 内编辑教务字段，另开 change（决策 B）

**DetailModal 接口：**

```javascript
// props
showApprovalAction: { type: Boolean, default: false }
// emits
'approve'  // ReviewView 打开 MovementApprovalModal
```

**ReviewView Modal 接线：**

```javascript
// 打开：approvalModalVisible = true; approvalModalStage = liveItem.approvalStage
// 确认：applyMovementDecision(sourceKey, liveItem, action, comment, currentRole)
//       → emit('decided')
```

按钮顺序：`btn-primary` 审批 → `btn-default` 关闭。

## 风险与应对

| 风险 | 缓解 |
|------|------|
| 无法 demo 多角色 Tab | 文档注明改 `DEFAULT_APPROVER_ROLE`；后续 auth 接入 |
| 窄屏按钮被挤到第二行 | `flex-wrap` + `align-self: flex-end` |
| 三 Tab 列数不同导致 colspan 错误 | 动态 `tableColspan` / `v-if` 列 |
| 状态 badge 仍不可见 | 必须引入 status-* 背景色，不仅补 mock |
| §12 转专业 Dean/HoP 无 Modal 教务区 | 决策 A：与列表一致；mock 数据预填 first choice |

## 迁移说明

1. 导出 `DEFAULT_APPROVER_ROLE` 并替换 `ref('Pending Review')`
2. 删除 role-bar 模板与样式
3. 合并搜索字段、更新 CSS、删除展开逻辑
4. 冒烟 + `npm run build`
5. **§6**：Tab 顺序/角标、列调整、status CSS、implemented Y/N、搜索减字段、seed、export CSV 同步
6. **§12**：ReviewView 删内联审批；DetailModal footer 审批；Modal 复用

## 待决问题

（§12 Section VII 已选 A；若产品要求 Modal 内教务编辑，另开 change。）
