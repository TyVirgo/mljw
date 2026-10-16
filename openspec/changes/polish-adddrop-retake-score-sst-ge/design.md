## Decisions

1. **分数**：优先 `row.score`；无则字母映射到约定分；`M` 无分显示「缺考」。及格线 `score < 60`。
2. **预估费用短字段**：绑 `payableTotal`（= total + sst）；`total` 仍表示不含税课程费。
3. **课程类型**：仅重修 lines-table（及详情重修表对齐）；费用明细行暂不加。
4. **GE 挂科**：成绩单新增 ≥2 门 GE F + 本学期开课 id。
