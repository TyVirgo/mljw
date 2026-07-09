# 休学/复学 Section II 起止日期回显

## 背景
休学期间（学年学期）选定后，对应学期起止日期已在数据层计算，但表单 Section II 未展示，用户无法确认。

## 变更内容
- 休学 Section II：在「休学期间 + 主要原因」行下方增加只读「休学开始日期」「休学结束日期」
- 复学 Section II：在「休学期间 + 复学学期」行下方同样增加上述两字段（随休学期间联动）
- 选择/切换学年学期时自动带出 `semesterInfo` 起止日期，不可手改

## 影响
- `DefermentFormModal.vue` / `ResumptionFormModal.vue`
- `resumptions.js` — 新增字段与 sync
- 复学详情展示（可选对齐）
