## 背景说明

已实现 Phase 2.1 refinement 的主体（版本快照、附件列、Edit 仅元数据等）。产品进一步明确：

- **学期与应用** 只在版本快照中维护，Create 不参与
- **新增版本** 时用户显式决定是否立即应用，默认不应用
- 列表与快照 UI 若干微调（见 Phase 2.2）

```
┌─────────────────────────────────────────────────────────────┐
│  Create / Edit          │  Version Snapshot                │
├─────────────────────────┼─────────────────────────────────┤
│  配置身份 + 名称 + 批注   │  学期 + 附件 + 应用状态          │
│  versions[] = []        │  新增版本（含立即应用开关）       │
└─────────────────────────┴─────────────────────────────────┘
```

## 目标 / 非目标

**目标：**

- Create 五字段，无学年学期，无首版 snapshot
- 新增版本：学期 + 附件 + **是否立即应用**（默认关）
- 快照表 Apply 列用 `YnSwitch`，互斥
- 「新增版本」在表格左上角
- 列表无 View；mock 备注各行不同

**非目标：**

- 按申请学期 lookup
- 快照内编辑/删除版本

## 设计决策

### D1：Create 不再创建版本（修订原 D2）

Save Create 时：

```js
{ formName, movementType, studentType, educationLevel, remark, versions: [] }
```

用户保存后进入「版本快照」→「新增版本」完成首次内容录入。

**理由**：学期与应用均属版本维度，与 Create 五字段模型一致。

### D2：Create 布局（修订原 D5）

- 2×2 Grid：名称 | 异动类别 / Student Type | 学历层次
- 批注：单独一行 `grid-column: 1 / -1` 或置于网格最后一格
- 弹宽 ~640–720px

### D3：新增版本 — 是否立即应用（修订原 D3）

`ConsentFormVersionFormModal` 字段：

| 字段 | 必填 | 默认 |
|------|------|------|
| 生效学年学期 | 是 | — |
| 学生同意书 | 是 | — |
| 家长同意书 | 否 | — |
| 是否立即应用 | — | **关** |

Save 逻辑：

```js
isApplied = payload.applyImmediately === true
// 若 isApplied，同 row 其余版本 isApplied = false
```

**废弃**：「无已应用版本时新条目自动 isApplied=true」。

### D4：快照 UX（Phase 2.2 已实现/规格化）

- 「新增版本」：`table-toolbar`，表格上方左对齐
- Apply 列：复用 `YnSwitch`，`setAppliedVersion` 互斥
- 附件列：`AttachmentPreviewTrigger`

### D5：列表 Actions

- **Edit | 版本快照**（无 View）
- `ConsentFormViewModal` 不再从列表挂载

### D6：数据层（修订原 D6）

| 函数 | 变更 |
|------|------|
| `createEmptyConsentForm()` | **移除** `effectiveAcademicSession` |
| `validateConsentFormForm` Create | **不再**校验 effectiveAcademicSession |
| `createConsentForm` | `versions: []` |
| `addConsentFormVersion` | 增加 `applyImmediately`；按 D3 设 isApplied |

### D7：Mock 种子

- 12 行 `remark` 各不相同（英文 mock 句子即可）

## 风险与应对

| 风险 | 缓解 |
|------|------|
| Create 后快照为空，用户不知下一步 | 保存后可提示进入版本快照；空表仍显示「新增版本」 |
| 全部版本未应用时 lookup 失败 | 预期；下载端已有「联系管理员」 |
| 立即应用默认关，首版需多一步 | 产品明确要求；开关可手动打开 |

## 迁移说明

1. `ConsentFormFormModal` — 去掉学年学期，改 5 字段布局
2. `consentForms.js` — create 不写 versions；addVersion 读 applyImmediately
3. `ConsentFormVersionFormModal` — 增加 YnSwitch「是否立即应用」
4. `ConsentFormView` — 确认无 View（若已实现则仅 spec 对齐）
5. 更新 i18n `applyImmediately`

## 待决问题

（已关闭）

- Create 是否自动首版 → **否**
- 新增版本默认应用 → **否，除非用户打开立即应用**
