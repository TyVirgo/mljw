## 背景说明

审核弹框由两个结构相同的组件承载，均渲染：

```vue
<label v-for="opt in approvalActionOptions">
  <input type="radio" :value="opt" />
  <span>{{ tr(opt) }}</span>   <!-- 当前：走 zh-flat 全局键 -->
</label>
```

全局 `zh-flat` 中 `Approved: '已通过'`、`Rejected: '已驳回'` 同时被 **状态筛选、列表徽章** 等复用，不能直接改全局键。

```
┌─────────────────────────────────────────────────────────┐
│                    文案使用场景                          │
├──────────────────────┬──────────────────────────────────┤
│ 审核弹框 Action 单选  │  通过 / 不通过 / 驳回  ← 本次改  │
├──────────────────────┼──────────────────────────────────┤
│ 列表 Status 徽章      │  已通过 / 已驳回 / 需修改  ← 不改 │
├──────────────────────┼──────────────────────────────────┤
│ 时间线 approvalTimeline │ approved / rejected … ← 不改   │
└──────────────────────┴──────────────────────────────────┘
```

## 目标 / 非目标

**目标：**

- 两个 Modal 统一三档操作中文：通过、不通过、驳回
- 存库 action 值不变，引擎零改动
- 英文 Pass / Not Pass / Return（或项目既有习惯）

**非目标：**

- 改 `Update Required` 枚举值为 `Return`
- 时间线 / 列表 status 文案联动修改

## 设计决策

### D1：专用 i18n 键，不碰 zh-flat 全局 Approved/Rejected

```js
// zh.js
approvalModal: {
  action: {
    approved: '通过',
    rejected: '不通过',
    updateRequired: '驳回',
  },
}
```

Modal 内映射：

```js
const APPROVAL_ACTION_LABEL_KEYS = {
  Approved: 'approvalModal.action.approved',
  Rejected: 'approvalModal.action.rejected',
  'Update Required': 'approvalModal.action.updateRequired',
}
```

或抽取 `src/utils/approvalActionLabels.js` + `getApprovalActionLabel(action, t)` 供两 Modal 共用。

### D2：两 Modal 共用 helper（推荐）

避免 `MovementApprovalModal` 与 `CourseApprovalModal` 各写一份 map；helper 单点维护。

### D3：语义对照（产品确认）

| 操作 | 业务含义 |
|------|----------|
| 通过 | 本节点同意；非终审则推进下一 stage |
| 不通过 | 终态拒绝（Rejected），流程终止 |
| 驳回 | 退回修改（Update Required），申请人可 Resubmit |

与 `add-new-course-approval` design 中 Rejected vs Update Required 区分一致。

## 风险与应对

| 风险 | 缓解 |
|------|------|
| 改 zh-flat 误伤状态筛选 | 使用专用 key，不改全局 |
| 两 Modal 漏改一处 | tasks 列出全部引用点 + 冒烟 |
| 英文文案不统一 | en.js 同步三键 |

## 迁移说明

纯展示层变更，无 mock 数据迁移。
