# 设计
## 字段

| 属性 | 值 |
|------|-----|
| 存储键 | `basicInfo.studentPassExpiryDate` |
| 格式 | `dd/mm/yyyy`（与 `DatePickerEn` 一致） |
| 可见范围 | China、International |
| 编辑 | 学籍 UI 始终只读；IO 外部维护（mock 预填） |

## 列表与搜索

- `normalizeStudent` 扁平化 `studentPassExpiryDate` 供表格/导出
- 搜索：`studentPassExpiryFrom` / `studentPassExpiryTo`；Inclusive 范围；无日期学生不参与匹配（筛选激活时排除）
- Local 学生列显示 `—`

## 转专业

`buildStudentSnapshotFromProfile` 中 `visaExpiryDate` ← `basic.studentPassExpiryDate`

## 导出

`studentProfileListExportColumns` 与 `formatStudentRow` 增加该字段；默认选中导出。
