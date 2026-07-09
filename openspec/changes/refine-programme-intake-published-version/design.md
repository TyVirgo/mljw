## 背景说明

```
┌─────────────────────┐     isCurrent      ┌──────────────────────────┐
│  Programme Version  │ ─────────────────▶ │  Published version (1)   │
│  (nested table)     │                    │  per programme           │
└─────────┬───────────┘                    └────────────┬─────────────┘
          │ YnSwitch toggle                           │
          │ setProgrammeVersionPublished              │ findProgrammeByCode
          ▼                                           ▼
┌─────────────────────┐                    ┌──────────────────────────┐
│  programmeVersions  │                    │  Programme Intake        │
│  .js helpers        │                    │  Create / Edit modal     │
└─────────────────────┘                    │  Version col → Detail    │
                                           └──────────────────────────┘
```

专业批次 catalogue 来自 `programmeIntakes.programmeCatalogue`（映射 `initialProgrammes`）。版本发布状态存于各 programme 的 `versions[].isCurrent`。

## 目标 / 非目标

**目标：**

- 培养方案版本列表可切换发布版本（互斥）
- 专业批次新增/编辑时可见各专业当前发布版本并可打开详情 Modal
- 嵌套 Modal 不遮挡父弹框关闭逻辑

**非目标：**

- 批次持久化 `versionId`
- 无发布版本时阻止创建批次（仅展示 `—`）

## 设计决策

### D1：发布版本语义 = `isCurrent`

与既有 `getProgrammeCurrentVersion` 区分：发布版本 **仅** 取 `isCurrent === true` 的项；无则返回 `null`（不 fallback 到最近编辑版本）。

### D2：版本列交互

- 列头：`tr('Version')` / 版本
- 有发布版本：**版本详情** 链接（`tr('VersionDetail')`）
- 无发布版本：灰色 `—`

### D3：嵌套 Modal 层级

`ProgrammeVersionDetailModal` 新增 `layered: Boolean`；为 true 时 overlay `z-index: 1100`（高于 Programme Intake 弹框 `1000`）。

### D4：新增弹框按行解析

Create 表格多行专业，每行独立 `findProgrammeByCode(item.programmeCode)` + `getProgrammePublishedVersion`；点击时传入该行 programmeName 作为 Modal 标题 fallback。

## 风险与应对

| 风险 | 缓解 |
|------|------|
| catalogue 中 extra 专业无 versions | 显示 `—`；不阻断勾选 |
| 用户未发布任何版本 | 同上；后续可加强校验 |
| 双 Modal 焦点陷阱 | 首版沿用现有 Teleport + 点击 overlay 关闭 |

## 迁移说明

无数据迁移。现有 mock `isCurrent` 种子保持不变；`setProgrammeVersionPublished` 仅 UI 切换时使用。
