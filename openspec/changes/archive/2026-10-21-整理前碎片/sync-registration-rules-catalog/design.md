## Context

- 批次表单 `RegistrationBatchFormDrawer` 的「②选课规则」已是图示四条：`linkPrerequisites` / `allowRetakeOnFail` / `allowDropSelfSelected`+次数 / `allowExceedCreditMax`（`batchLocalRules.js`）。
- 选课规则设置页由 `registrationRuleSettings.js` 驱动，当前为 CR101–CR107 共 7 条，与批次不一致。
- UI 保持三列：启用 / 名称 / 规则值（`RegistrationRuleSettingsView.vue`）。

## Goals / Non-Goals

**Goals:**

- 设置页总规则目录与批次图示对齐（+ 保留延迟缴费天数）。
- 合并「是否可退选」与「退选次数」为一条 count 规则。
- 存储键升级，旧数据不污染新目录。

**Non-Goals:**

- 批次表单改造成「从总规则勾选子集」。
- 学生端运行时校验接入。

## Decisions

1. **新目录 ID（v3）**
   - `CR201` 关联先修课程 — `flag`（规则值 0/1）
   - `CR202` 不及格可重修选课 — `flag`
   - `CR203` 可退自选课程每轮上限 — `count`（规则值=次数；启用=允许退自选）
   - `CR204` 允许超过最高学分 — `flag`
   - `CR107` 延迟缴费天数 — `count`（保留 ID，便于 `getPaymentGraceDays`）
   - 移除 CR101–CR106（含原退选拆分与冲突/缴费门槛等）。

2. **持久化**：`registration-rules-v2` → `registration-rules-v3`；加载仅认新 defaults + 新存储。旧 v2 不迁移（演示原型可接受）。

3. **UI**：继续数据驱动三列表格；名称走 i18n `registrationRules.items.<id>.name`；CR203 名称写全称「可退自选课程，每轮不高于…次」类文案，次数在「规则值」列编辑。

4. **批次表单**：本轮不改；字段模型已与 CR201–CR204 语义对应，后续勾选子集再接。

5. **弃用**：若有仅服务旧 CR 的导出常量，标记弃用说明而非直接删除导出符号（按项目约定）。

## Risks / Trade-offs

- [Risk] 用户浏览器仍有 v2 数据 → [Mitigation] 换 v3 key，首次回默认 5 条。
- [Risk] 缴费相关文案仍写「见选课规则」→ [Mitigation] CR107 保留，`getPaymentGraceDays` 不变。
- [Trade-off] flag 规则「启用」与「规则值 0/1」语义部分重叠 → 保持现有表格模型，不在本轮重构。

## Migration Plan

1. 改 defaults / IDs / STORAGE_KEY。
2. 更新 i18n。
3. 冒烟：打开选课规则设置，确认仅 5 行；改 CR107 后 `getPaymentGraceDays` 仍可读。

## Open Questions

- 无（延迟缴费保留、三列表格已确认）。

## 影响文件

- `src/data/courseRegistration/registrationRuleSettings.js`
- `src/i18n/locales/zh.js`、`en.js`
- （视情况）`openspec/changes/course-reg-rules/proposal.md` 增量
