## Context

选课监控主表当前用 `formatGraduationCreditsSummary` 输出 GE+ME 合计；统计卡含选修缺口与高/中严重快捷筛选；主表有严重程度列。详情侧已分 GE/ME 进度，主表需对齐。

## Goals / Non-Goals

**Goals:**
- 主表毕业学分分 GE/ME 两列展示 `已选/要求`
- 顶部仅保留应参与 / 已参与 / 平均毕业学分
- 去掉主表严重程度列
- Demo 25 行、默认 20/页

**Non-Goals:**
- 不改详情学分区块
- 不改预警推导逻辑（`deriveMonitorIssues`）
- 筛区「严重程度」保留

## Decisions

1. **分列格式函数**：新增 `formatGraduationGeSummary` / `formatGraduationMeSummary`，基于已有 `getMonitorGraduationInsight` 的 `ge`/`me`；旧合计函数可保留给导出兼容或改为内部不用。
2. **列顺序**：入学批次 → GE毕业 → ME毕业 → 本学期GE → 本学期ME → 操作。
3. **统计卡**：删除选修缺口卡与高/中严重可点卡；`applyStatFilter` 的 high/medium/problem 入口随之无 UI 绑定可保留函数或删死代码。
4. **Demo 扩容**：在 `registrationMonitorQueue` 现有种子上追加至 25 条，覆盖多专业/批次/状态，进度字段走 `withTermGe`。
5. **导出**：`graduationCredits` 拆为 `graduationGe` / `graduationMe`，i18n 同步。

## Risks / Trade-offs

- [筛区仍有严重程度但列已去] → 接受：筛仍可用，列表靠预警类型/状态识别
- [平均毕业学分仍为合计] → 与 Non-goals 一致，避免卡片再膨胀

## 影响文件

- `src/views/courseRegistration/RegistrationMonitorView.vue`
- `src/data/courseRegistration/monitorCreditInsights.js`
- `src/data/courseRegistration/registrationMonitorQueue.js`
- `src/data/courseRegistration/courseRegistrationExportFields.js`
- `src/utils/exportCourseRegistrationExcel.js`
- `src/i18n/locales/zh.js` / `en.js`
