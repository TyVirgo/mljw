# 学生基本信息拆分文本搜索框

## 背景
`refine-student-profile-list-search` 将学号、姓名、中文名、NRIC、电话合并为一个 OR 模糊搜索框。学籍管理人员希望按字段分别输入，便于精确组合筛选。

## 变更内容
- 移除合并 keyword 框，拆为 5 个独立文本框，顺序：Student ID → Student Name → Chinese Name → IC No. → Mobile Phone
- 各框仍为模糊匹配（contains）；有值的框之间 AND 组合，空框不参与过滤
- 标签复用 `studentProfileFieldLabels`（`fieldSearchLabel`），与列表列一致
- NRIC 仅匹配 `icNo`（与合并 keyword 行为一致，不含 passportNo）
- 第一行布局：5 个文本框后接 Programme、Intake、Status；Search / Reset / More 不变

## 影响
- `src/data/students.js` — 筛选 helpers
- `src/views/studentRecords/StudentProfileView.vue` — 搜索 UI
- `openspec/changes/refine-student-profile-list-search` spec 中统一 keyword 场景由本变更取代
