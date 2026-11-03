# 基础数据-培养方案与年级专业 — 设计要点（合并）

## 文档用途

汇总历史 design 中与本菜单相关的决策与约束，供写需求文档时对照。冲突处以较新变更及当前代码为准。

## 来源：add-programme-intake-planned-enrollment

## Context

基础数据「专业批次」新增/编辑底部表单为两列：Intake | 起始学年学期。需在 Intake 下增加计划招生人数。

## Decisions

1. 字段名：`plannedEnrollment`（数字）。
2. 布局：左列堆叠 Intake + 计划招生人数；右列仍为起始学年学期。
3. 新增多选专业时：与 Intake 相同，共用同一计划招生人数写入每条记录。
4. 校验：必填；值为数字即可；不做上下限/整数位数等规则。
5. Demo：`initialProgrammeIntakes` 各条默认 `120`。
6. 范围：仅新增/编辑弹窗 + 数据层；列表/导出/复制后续按需。

## Open Questions (resolved)

- 存量 demo 补默认值 120 ✓
- 原型不关注数据来源、不定义复杂填写规则 ✓

## 来源：add-school-elective-category

## Context

基础数据院系信息、专业版本需增加校选类别，与选课侧文商理口径对齐但本阶段仅存主数据。

## Decisions

1. **枚举值**：存储 `Arts` | `Science` | `Business`；展示 文科 / 理科 / 商科（及英/马文案）。
2. **必填**：院系表单、专业版本步骤 1 均必填；主表展示。
3. **不联动**：专业选院系后不自动填充；两边独立手填。
4. **院系表单位置**：Email 与 Active 之间。
5. **专业表单位置**：Department 同行或下一行独立字段；校验加入 validateStep1。
6. **Demo**：既有院系/专业补默认值，便于列表可见。

## Open Questions (resolved)

- 完全手填、不联动 ✓

## 来源：refine-enrollment-cascade-programme-intake

## 背景

```
专业批次 (initialProgrammeIntakes, active=Yes)
        + 专业目录 level (programmeCatalogue)
                    │
                    ▼
         enrich → programmeLevel, school, programmeName …
                    │
    ┌───────────────┼───────────────┐
    ▼               ▼               ▼
 Level 下拉      School 下拉     Programme 下拉
 (distinct)    (filter level)  (filter level+school)
                                    │
                                    ▼
                          programmeIntakeKey
                                    │
                                    ▼
              派生：code, duration, semester, intake, academicSession
              （readonly + 灰色背景）
```

## 设计决策

### D1：第三级「专业」选项 = 活跃专业批次记录

同一学院+层次下若同一专业名存在多个活跃批次，下拉标签显示为 `专业名 (YYYY/MM)`，值为 `programmeIntake` 唯一键。

### D2：派生字段映射

| 表单字段 | 批次来源 |
|---------|---------|
| programmeCode | programmeCode |
| duration | years |
| intake | intake |
| academicSession | startingSemester |
| semester | startingSemester 的月份部分（如 2025/09 → 09） |

faculty 为用户在第二级所选学院名称，不再从专业反向覆盖。

### D3：编辑回显

保存 `enrollment.programmeIntakeKey`。打开编辑时按 key 或 programmeCode+intake+faculty 匹配批次；若无匹配仍展示已存派生值，级联下拉尽量预选。

### D4：置灰样式

`StudentFormField` 新增 `derived` prop：`readonly`/`disabled` 输入 + 灰色背景，与可编辑白底区分。

## 风险

| 风险 | 缓解 |
|------|------|
| 演示学籍与批次种子不一致 | 补充 SWE 等批次种子并对齐 mock |
| 历史学籍无 programmeIntakeKey | infer 函数 best-effort 匹配 |

## 来源：refine-programme-intake-published-version

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
