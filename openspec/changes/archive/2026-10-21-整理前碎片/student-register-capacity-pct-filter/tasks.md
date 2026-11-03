## 1. i18n 与筛选项 UI

- [x] 1.1 在 zh/en 增加 `< 100%` / `≥ 100%` 文案（courses 或 register 命名空间）
- [x] 1.2 `StudentRegisterView`：R1 下拉用 lt100/gte100；R2/R3 仍用 open/full（各轮独立 search 态，无需清非法值）

## 2. 行级百分比过滤

- [x] 2.1 实现按志愿百分比过滤分组行（与 `sectionCapacityLabel` 同源：volunteerCount/capacity）
- [x] 2.2 `sectionRowsAll`：R1 走行级百分比过滤；R2/R3 继续 `filterCoursesBySectionAvailability`
- [x] 2.3 勾选 tasks 完成项并自测 R1 98%/117% 与 R2 有余量
