## 为何

课程班学生名单「导出」直接打全字段 Excel，与选课监控等菜单的「选字段 + 范围」弹框不一致，不便裁剪列与控制导出行数。

## 变更说明

- 导出改为打开共用 `ExportModal`：可选字段、可选范围（当前页 / 全部结果）
- 无行勾选，不启用「选中行」范围
- 顶部提示改为说明可选字段导出

## 非目标

- 不新增名单行多选
- 不改导出字段定义集合（仍用 `sectionStudentRosterExportFields`）

## 能力

### 新增能力

- `section-roster-export-modal`：名单导出弹框（字段 + 范围）

## 影响

- `SectionStudentRosterView.vue`
- i18n `sectionRoster.hint`
