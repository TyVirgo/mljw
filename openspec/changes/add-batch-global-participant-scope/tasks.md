## 1. 数据与匹配

- [x] 1.1 新增培养方案推导全局规则 `deriveGlobalScopeRuleFromProgrammePlan` 与 `resolveEffectiveScopeRulesForRound`（轮次有规则则覆盖，否则全局）
- [x] 1.2 更新 `matchBatchScope`、`listStudentsForBatchRound` / 计数：无轮次规则时回退全局
- [x] 1.3 Demo 批次默认 `scopeRules` 为空；保留个别轮次特例种子（可选）

## 2. 编辑表单 UI

- [x] 2.1 编辑批次增加第 4 节只读：培养方案来源说明、人数、查看清单；新建不渲染
- [x] 2.2 新增只读全局参与清单抽屉（学号/姓名等）
- [x] 2.3 中英文 i18n；轮次空态文案改为「不设则使用批次全局参与范围」

## 3. 全局清单样式对齐学生清单

- [x] 3.1 抽屉宽/scroll 零边距、搜索条、toolbar meta、满宽 sticky 表、专业/批次分列，对齐 `BatchScopeRuleRosterDrawer`

## 4. 学生清单 Tab 与文案

- [x] 4.1 外层 Tab：可选学生名单在前；默认打开可选 + 全局选课名单
- [x] 4.2 可选名单内层在第一轮前增加「全局选课名单」（`listGlobalBatchParticipants` 同源）
- [x] 4.3 特殊学生名单去掉「来源」列
- [x] 4.4 管理轮次「老生/新生选课时间」改为「老生/新生选课配置」（中英 i18n）

## 5. 人数展示与主表可选课人数

- [x] 5.1 清单工具条「共 N 名学生」左对齐
- [x] 5.2 `countEligibleStudentsAcrossRounds` 改为全局∪三轮∪特殊按学号去重；更新 tooltip
