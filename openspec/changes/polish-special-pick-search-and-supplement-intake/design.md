# 设计：选择学生弹窗搜索单行 / 字体统一 / 补注册 Intake

## Context

- 选择学生：`BatchSpecialStudentPickModal.vue`；由 `BatchSpecialStudentAddModal` 的只读「请选择学生」框打开。
- 当前搜索：首行学号+姓名+操作；展开后第二行学院（`filtersExpanded` + `search-row-secondary`）。
- 补注册：`SupplementListView.vue` 直接渲染 `row.intake`（demo 为 `2504` / `2309` 等）；项目已有 `formatIntakeBatch`（支持 `YYYY/MM`、`YYYYMM`、`YYMM` → `YYYY/MM`）。

## Goals / Non-Goals

**Goals**

1. 三筛选项同一行，不换行到二级区。
2. 弹窗与触发框字体/控件高度与列表页一致。
3. 补注册名单 Intake 展示为 `YYYY/MM`。

**Non-Goals**

- 不引入新筛选字段；不改后端接口（原型无后端）。

## Decisions

### 1. 搜索布局

- 将「学院」`<select>` 移入首行 `search-fields`，与学号、姓名并列。
- 删除 `filtersExpanded` 状态、二级 `search-row`、「展开/收起」按钮。
- 弹窗较窄时优先缩小输入宽度或允许整行横向滚动，**避免**把学院挤到第二行；默认面板宽度已约 `min(1100px)`，三字段+按钮可同排。

### 2. 字体与控件

- 去掉或收敛弹窗内与全局冲突的 `.data-table` / `.btn` 字号覆盖；优先复用 `list-page-search.css` 与 `.cr-list-page .data-table` 规则（弹窗可加修饰 class 挂到同一套变量：13px 正文、表头 600/#374151、输入高 32px）。
- 「请选择学生」触发框使用与 `search-input` / 表单控件一致的 border、字号、颜色（占位符灰字）。

### 3. Intake 展示

- 列表列：`{{ formatIntakeBatch(row.intake) }}`。
- 导出：若导出字段含 intake，同样走 `formatIntakeBatch`（或在 `formatSupplementExportRow` 内转换）。
- Demo：可把 `supplementListQueue` 种子改为 `2025/04` 等，或保留紧凑码仅靠展示层转换（推荐展示层统一转换，种子可逐步规范）。

## Risks / Trade-offs

- 三字段同行在极窄视口可能拥挤 → 用 `flex-wrap: nowrap` + 适度压缩字段宽度；原型以桌面为主。
- 删除展开/收起后，若日后筛选项增多，再引入折叠；本期仅三字段，折叠无收益。

## Migration

无数据迁移；仅展示与样式。

## Open Questions

无（范围已由三张图示界定）。
