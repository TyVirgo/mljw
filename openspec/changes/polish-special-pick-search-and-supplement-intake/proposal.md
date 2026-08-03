# 提案：选择学生弹窗搜索单行 / 字体统一 / 补注册 Intake 年/月

## Why

批次「特殊学生」新增流程中，「选择学生」弹窗搜索区把「学院」放在展开后的第二行，占用空间且打断扫读；弹窗内表格/控件字体与选课列表页不一致。补注册名单列表的 Intake 仍展示紧凑码（如 `2409`），与系统其它学年学期/入学批次的 `YYYY/MM`（如 `2024/09`）不一致。

## What Changes

- **选择学生弹窗搜索区（图示1）**：学号、姓名、学院与查询/重置操作放在**同一行**；取消「学院」单独换行的二级展开区（可移除仅为此服务的展开/收起）。
- **字体样式统一（图示2）**：「请选择学生」触发框与弹窗内标签、输入、表头/表体字号字重颜色对齐选课列表页（`list-page-search` / `course-registration-list`）既有规范，避免弹窗内另起一套字号。
- **补注册名单 Intake（图示3）**：列表（及导出若展示 Intake）使用 `formatIntakeBatch`，展示为 `年/月`（`YYYY/MM`）；demo 数据可同步规范为该格式或展示层统一转换。
- **补注册表头文案（增量）**：列表表头不得写死英文 `Intake`，须使用与其它名单一致的「入学批次」i18n（如 `courseRegistration.monitor.intake`）。

## Non-goals

- 不改选择学生的筛选语义（仍可按学号/姓名/学院过滤）。
- 不改补注册业务规则、权限码（A/D/R）或开门逻辑。
- 不改造其它菜单的选人弹窗（若存在独立实现且未共用本组件，不在本期范围）。

## Capabilities

### Modified Capabilities

- `course-reg-batch`：特殊学生「选择学生」弹窗搜索布局与字体对齐
- `course-reg-supplement`：补注册名单 Intake 展示格式

## Impact

- `BatchSpecialStudentPickModal.vue`、`BatchSpecialStudentAddModal.vue`（触发框样式）
- `SupplementListView.vue`、`supplementListQueue.js`（及导出格式若含 intake）
- 可能微调 `list-page-search.css` / 弹窗 scoped 样式；i18n 仅在删除「展开/收起」文案引用时清理
