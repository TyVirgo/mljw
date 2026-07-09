# 学生基本信息字段标签三处统一

## 背景
主表格表头、搜索 label、详情字段标签来源分散，中文模式下出现中英混排；详情有 tooltip 的字段表头未同步。

## 变更内容
- 字段注册表统一 label / hint（表头、搜索、详情同源）
- 中文模式纯中文、英文模式纯英文；Programme Level 中文统一「专业层次」
- Preview 中文「预览」，英文 Preview
- 仅表头带 tooltip（与详情 hint 一致）；搜索 label 不带 tooltip

## 影响
- `studentProfileFieldLabels.js` + composable + 表头组件
- `StudentProfileView.vue`、EnrollmentTab、BasicInfoTab
- `i18n` zh-flat / zh.js
