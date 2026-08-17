## Context

`StudentRegisterView` 当前列序为：名称 → 类型 →（仅 ME）校选 → 学分 → 分组 → 容量 → … → 操作。ME 的 `resolveSchoolElectiveCategory` 按课 id 轮转文商理。

## Decisions

1. **目标列序（GE/ME 相同）**  
   序号 → 代码 → 名称 → 分组 → 类型 → 校选类别 → 学分 → 教师 → 起止周 → 上课时间 → 地点 → 先修 → 容量 → 操作。

2. **校选列**  
   两类型均展示；表头 tip 复用现有 i18n。

3. **Demo 数据**  
   - ME：缺省统一 `arts`（模拟过滤后）。  
   - GE：缺省按课 id 轮转文/商/理；批次种子也可显式赋值。

## Risks

- 历史文案曾写「ME 混杂」；本变更纠偏为统一类，需以本 proposal 为准。
