## 排序规则

对 `initialSemesterRecords` 映射为 `YYYY/MM` 前：

1. `academicYear` 降序
2. 同年内 `semester`（02 / 04 / 09）降序（09 → 04 → 02）

示例顺序：`2026/09` → `2026/04` → `2026/02` → `2025/09` → …

表单 `<option value="">pleaseSelect</option>` 仍在数据选项之前，不受排序影响。
