## 设计

### 语义
| 开关 | `applicablePersonnelCategories` | 老师端原因下拉 | 学生端原因下拉 |
|------|--------------------------------|----------------|----------------|
| 否（默认） | `['Teacher']` | 可见 | 不可见 |
| 是 | `['Student']` | 不可见 | 可见 |

### YnSwitch
- 新增 `onLabel` / `offLabel` props，中文传「是」「否」，英文 Yes/No

### 列表行内切换
- 点击开关 → `updateReason(categoryId, reasonId, { allowStudentApply })` 写回
