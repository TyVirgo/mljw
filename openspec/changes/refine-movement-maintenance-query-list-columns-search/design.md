# 设计
## 列顺序

固定：状态、审批阶段、是否实施、学号、姓名、国籍、异动类别、生效学期、生效日期  
尾部：护照/IC、国籍类别(studentType)、Intake、申请学年学期、异动原因

## 搜索

studentId、studentName、movementType、effectiveSession、effectiveDate、status、implemented、nationality、studentCategory

## 搜索区布局（对齐 StudentProfileView）

```
┌─ 主行 ─────────────────────────────────────────────┐
│ 学号 | 姓名 | 异动类别 | 生效学期     [查询][重置][更多] │
└────────────────────────────────────────────────────┘
┌─ 展开行（默认收起）───────────────────────────────┐
│ 生效日期 | 审批状态 | 是否实施 | 国籍 | 国籍类别      │
└────────────────────────────────────────────────────┘
```

- 使用 `list-page-search.css` 统一布局
- 查询/重置按钮带 SVG 图标；文本输入支持 Enter 触发查询
- `searchForm` / `appliedSearch` 分离，仅点击查询或 Enter 时应用筛选

## 导出

`movementMaintenanceExportColumnMeta` 与主表 key 顺序一致；查询 optional 列仍接在后。
