# 设计：学年学期选课时间配置

## Context

- 现状：`BatchRoundManageDrawer` 按批编辑 `roundsByAudience` + `round1Quota`；`RegistrationBatchFormDrawer` 编辑 `addDropWindow`。
- 目标：时间与加退课升到学期级；批次可选覆盖三轮包；批次列表去掉管理轮次。

## Decisions

1. **数据**  
   - `sessionRegistrationSchedules`：按 `academicSession` 唯一。字段：`roundsByAudience`、`round1Quota`、`addDropWindow`、可选 `status`。  
   - `unitScheduleOverrides`：按 `(academicSession, unitCode)` 唯一，仅含 `roundsByAudience`（无 addDrop / 公布 / round1Quota）。`unitCode` 用院系 `code`（如 OSA）。  
   - 解析：`resolveEffectiveAudienceRounds(batch)` / `resolveEffectiveRound1Quota(batch)` / `resolveEffectiveAddDropWindow(batch|session)`；轮次链为 **单位 > 学期全局**。

2. **菜单**  
   - `cr-schedule` 挂在 `cr-config-group`，位于 `cr-batch` 旁；`App.vue` 注册 `RegistrationScheduleView`。

3. **页面**  
   - 主列表：学年学期行；操作「修改」「单位批次时间设置」。  
   - 全局编辑抽屉：学年学期与加退课同排；轮次 + 公布 + GE 衰减 r；必填校验。  
   - 单位覆盖：`UnitScheduleOverridePanel` 抽屉；「新增单位」→ `UnitPickModal` 多选 → `SessionScheduleEditDrawer(mode=unit)` 仅三轮。

4. **批次侧**  
   - 移除「管理轮次」与 `BatchRoundManageDrawer` 入口。  
   - 表单移除加退课节；保存不再写 `addDropWindow`（兼容读旧字段仅作 fallback 到解析层末级）。  
   - 列表**不再**展示轮次/加退课时间列；时间在「选课时间配置」主表维护。

5. **Demo**  
   - 为 `2026/04` 等演示学期写全局配置；多数批无覆盖；可选 1 条覆盖样例。

6. **ME 名额占比（增量）**  
   - **学期全局**仅保留 GE `decayR`；**ME 占比**迁至 **ME 批次表单第 3 节**（新建/编辑，`type=ME` 时展示；GE 不展示）。  
   - `batch.round1Quota`：`{ totalCap, meQuotaRows[] }`；行 `{ id, kind, intakes, share, count }`。  
   - `special` 行**固定末行**，文案「特殊学生（包含特殊名单）」，不可删除；无「+ 特殊学生行」。  
   - 入学学期行「+ 新增」（`common.create`）；占比与名额数、名额总数三者可编辑并联动。  
   - 占比合计 100%；名额数合计 = `totalCap`。有特殊名单时 special 占比/名额数 > 0。  
   - 批次类型默认「请选择」；编辑 ME 批：③ 名额占比 → ④ 参与范围。

7. **列表列重组（增量）**  
   - `RegistrationScheduleView`：R1/R2/R3 双行 + 结果公布 + 加退课；去掉老生 R1 单列与覆盖批次数。  
   - `RegistrationBatchView`：去掉四轮时间列；`AudienceRoundDualCell` 复用双受众展示。

8. **单位批次时间（增量）**  
   - 替换原 `batchScheduleOverrides`；`UnitScheduleOverridePanel` + `UnitPickModal`。  
   - 单位编辑 `mode=unit`：仅 R1–R3 × 双受众；结果公布 / r / ME / 加退课读学期全局。  
   - Demo：`OSA` @ `2026/04` 单位覆盖样例；`faculty` → `unitCode` 映射解析生效轮次。

## Risks

- ME 名额占比在 **ME 批次**配置；`decayR` 仍读学期全局。旧批 `round1Quota` 无 `totalCap` 时 normalize 补默认 100。  
- 旧批上的 `roundsByAudience` / `addDropWindow`：解析时优先覆盖表 → 学期全局 → 最后才 fallback 批上残留，避免演示空白。

## File Impact

- `src/data/courseRegistration/sessionRegistrationSchedules.js`（新）
- `src/views/courseRegistration/RegistrationScheduleView.vue`（新）
- `src/components/courseRegistration/SessionScheduleEditDrawer.vue`（新，或改造 BatchRoundManageDrawer）
- `src/components/courseRegistration/UnitScheduleOverridePanel.vue`（新）
- `src/components/courseRegistration/UnitPickModal.vue`（新）
- `src/components/courseRegistration/SessionScheduleEditDrawer.vue`（mode=unit；加退课顶栏）
- `src/config/courseRegistrationMenu.js`、`App.vue`、i18n
- `RegistrationBatchView.vue`、`RegistrationBatchFormDrawer.vue`
- `addDropApplicationWindow.js`、`audienceRounds.js` 消费方
