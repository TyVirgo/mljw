# 任务清单

## 1. 选择学生弹窗搜索单行

- [x] 1.1 将「学院」移入 `BatchSpecialStudentPickModal` 首行 `search-fields`，与学号、姓名并列
- [x] 1.2 移除 `filtersExpanded`、二级搜索行及展开/收起按钮
- [x] 1.3 确认首行 `flex` 不换行（必要时压缩字段宽度），窄屏不把学院挤到第二行

## 2. 字体与触发框样式

- [x] 2.1 对齐弹窗内表格/按钮/输入与 `list-page-search` / 选课列表页字号颜色（收敛 scoped 冲突样式）
- [x] 2.2 调整 `BatchSpecialStudentAddModal`「请选择学生」触发框，与表单/搜索输入风格一致

## 3. 补注册 Intake 年/月

- [x] 3.1 `SupplementListView` Intake 列使用 `formatIntakeBatch`
- [x] 3.2 导出路径若含 intake，同步格式化
- [x] 3.3 （可选）将 `supplementListQueue` demo intake 规范为 `YYYY/MM`，抽查列表展示

## 4. 验收

- [x] 4.1 打开选择学生：三条件同行，学院筛选可用
- [x] 4.2 补注册名单 Intake 显示如 `2024/09` / `2025/04`，无 `2409` 裸码

## 5. 补注册表头入学批次（增量）

- [x] 5.1 `SupplementListView` 表头改用 `t('courseRegistration.monitor.intake')`，与缴费/监控等名单一致
