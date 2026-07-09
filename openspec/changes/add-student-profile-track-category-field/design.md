## 设计

### 数据
- 存储：`enrollment.trackCategory`（字符串枚举）
- 默认：`Normal`
- 联动：`getTrackCategoriesForProfileStatus(status)` 复用 `movementCategories.studentStatusCategoryMap`，经档案状态别名映射

### UI
```
列表：… | Status | Track Category | Intake | …
表单：Status 下拉 → Track Category 下拉（选项 filtered）
变更状态且当前类型非法 → 重置为允许列表首项
```

### 校验
- 保存时 `trackCategory` 必填且须属于当前 `enrollment.status` 允许集合

### i18n
- 字段标签：`Track Category` → 学籍类型（zh-flat）
- 枚举值：复用 `movementCategory.trackCategory.*`
