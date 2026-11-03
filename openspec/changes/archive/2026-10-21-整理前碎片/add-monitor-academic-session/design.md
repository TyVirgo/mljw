## Context

`registrationMonitorQueue` 为扁平名单；本学期学分/学期 GE·ME 隐含「当前学期」。其它模块常按 `studentId` 查找单行。

## Goals / Non-Goals

**Goals:**

- 默认学期 `2026/09`；选项复用 `registrationAcademicSessionOptions` 中有数据的学期（或固定 demo 三学期）
- 行字段 `academicSession`；同学生可跨学期多行（不同 id）
- 学期选择立即生效（不必点查询）；统计/列表/导出同源

**Non-Goals:**

- 毕业完成度跨学期真实推演（demo：毕业字段可近似，本学期字段必须随学期变）

## Decisions

1. **扁平池 + 字段打标**，不用 Map 分池（少改导出与 remind by id）  
2. **按 studentId 查找**：优先匹配默认学期，否则首条（兼容旧调用）  
3. **Demo**：现有行 → `2026/09`；克隆变体 → `2026/04`、`2025/09`（学分/风险不同）

## Risks / Trade-offs

- [同 studentId 多学期] → 查找加默认学期优先  
- [无数据学期] → 下拉仅列有数据的学期，避免空壳

## 影响文件

- `src/data/courseRegistration/registrationMonitorQueue.js`
- `src/views/courseRegistration/RegistrationMonitorView.vue`
- `studentRegistrationStore.js` / `studentDemoSeed.js`（补 academicSession / 查找）
- i18n
