# 学生基本信息入学字段 Demo 补全

## 背景
列表中 Programme Structure、Registration Time、Expected Completion/Graduation Batch、Outstanding Fee 等列大量显示「—」，且 Programme Structure 筛选无选项，无法演示搜索与核对。

## 变更内容
- Programme Structure 固定格式：`Programme Structure of {专业简称} ({入学批次 YYYYMM} Version)`，括号内取学生 **intake**（如 `2022/04` → `202204`）
- `normalizeStudent` 自动回填 programmeStructure、registrationTime、expected batches（缺省时）
- mock 学生补全 Outstanding Fee（N/Y 混合，不统一默认值）
- 修正无效 programmeCode（如 CS → CSN），保证 formatter 可解析

## 影响
- `studentEnrollmentOptions.js` — formatter 改为 intake 批次
- `students.js` — normalize 回填 + seed 补 outstandingFee
- `refine-student-profile-list-search` 列表/筛选行为对齐
