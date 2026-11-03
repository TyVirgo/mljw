## Decisions

1. **数据主路径 A**：`adminStudentRegistrationResults` 每行补 `round`、`operatorId`/`operatorName`、`operatedAt`、`opResult`（`pendingAssign` | `registerSuccess` | `registerFailure` | `cancelQueue`）。不含 `queuing`。
2. **展示**：操作结果用既有 log i18n（待分配/选课成功/选课失败/取消排队）；操作人用 `formatOperatorDisplay` 同类拼法。
3. **搜索**：学生维字段对齐日志图示——批次、轮次、学号/姓名（合并）、课程代码/名称、操作人、操作结果、操作时间起止；去掉独立专业筛。
4. **菜单**：`cr-result-group` 去掉 `cr-log`；`courseRegistrationDevelopedPages` 移除；`App.vue` 可保留组件但无入口，倾向一并去掉挂载；flowGuide 节点去掉 `cr-log`。
5. **工具栏**：代选/删除/导出保留；失败与取消排队行仍可勾选删除（demo）。
6. **导出**：学生维导出追加操作人、操作时间、操作结果。
7. **学生维表**：`student-dim-table` 表头/单元格 `nowrap`，序号/学分居中，`min-width` + `table-wrap` 横向滚动。
8. **学生维右侧冻结**：操作人 / 操作时间 / 操作结果 sticky；操作人两行（学号、姓名无括号）。
9. 菜单文案：`课程班学生名单`（去掉「查询」）。

## 影响文件

见 proposal Impact。
