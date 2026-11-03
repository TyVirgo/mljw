## Context

现状：`MeSeniorQuotaReadonlyModal` 复用 `MeQuotaRowsEditor` readonly，展示配置占比与名额数。R1/R2/R3 ME 点击老生容量均打开该弹窗。

## Goals / Non-Goals

**Goals:**

- 弹窗列：层次（入学学期 chips / 特殊学生）| 配置名额 | 已分配 | 剩余可选
- 顶栏：课程 + 老生名额合计 / 已分配合计 / 剩余可选合计
- 数据：`resolveMeQuotaRowsForCourse` + 同步 count；`getRoundRoster(roundKey)` 中非 specialExtra、非新生按 intake 归层；特殊行收未匹配层次的老生
- 不再嵌入 `MeQuotaRowsEditor`

**Non-Goals:**

- 不改设置编辑器
- 不在弹窗内打开名单明细

## Decisions

1. **改造现有 Modal**（保留组件名，改文案与内容），避免再挂一套入口  
2. **新增** `buildMeSeniorQuotaUsageRows(course, batch, roundKey)` 于 `registrationResultByRound.js`  
3. **View 传入** `selectedRound` 作为 roundKey  
4. **Demo**：`pickDemoStudents` 轮转多种老生 intake（对齐默认 meQuota 层次）

## Risks / Trade-offs

- [特殊新加 vs 特殊学生行] → specialExtra 不计入占用名额；特殊行只收「未匹配 intake 的老生」  
- [无 meQuota 行] → 空态提示（与现文案类似）

## 影响文件

- `MeSeniorQuotaReadonlyModal.vue`
- `registrationResultByRound.js`
- `RegistrationResultView.vue`
- `zh.js` / `en.js`
