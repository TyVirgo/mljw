## 1. 移除 scoped 搜索样式覆盖

- [x] 1.1 删除 `MovementApprovalView.vue` scoped 中 `.search-fields` grid 定义
- [x] 1.2 删除 `.search-item { flex-direction: column }` 及 label 纵向样式
- [x] 1.3 删除重复的 `.search-input` / `.search-select` / `.search-row` / `.search-actions` 规则（改由 `list-page-search.css` 生效）

## 2. 对齐全局搜索布局

- [x] 2.1 确认模板使用 `search-bar` > `search-row` > `search-fields` + `search-actions` 结构（已满足则不改）
- [x] 2.2 目视对比 `CourseApprovalView`：标签与输入框同一行、Search/Reset 右上

## 3. 验证

- [x] 3.1 冒烟：5 字段均为「标签 + 控件」同行，标签不换行到输入框上方
- [x] 3.2 冒烟：窄屏时字段组可换行，组内仍同行
- [x] 3.3 `npm run build` 通过
