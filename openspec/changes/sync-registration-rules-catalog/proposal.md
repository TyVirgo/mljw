## Why

批次「②选课规则」与「选课规则设置」页规则目录不一致：设置页仍为旧版 7 条（退选/冲突/缴费门槛等），批次已是图示 4 条（先修/重修/可退次数/超学分）。需先以批次图示为准对齐总规则目录，并为后续「批次从总规则勾选子集」铺路。

## What Changes

- 选课规则设置页总规则改为 **5 条**（三列：启用 / 名称 / 规则值不变）：
  1. 关联先修课程
  2. 不及格可重修选课
  3. 可退自选课程，每轮不高于 N 次（合并原「是否可退选」+「退选次数」）
  4. 允许超过最高学分
  5. **延迟缴费天数**（保留）
- **移除**：是否允许课表冲突、学生未缴费不得选课、学生未注册不得选课、修读对象是否可选。
- 持久化键升级，避免旧 7 条 localStorage 污染新目录。
- 同步中/英 i18n；必要时在 `course-reg-rules` 合并包补增量说明。

## Non-goals

- 本轮不改批次表单 UI，不实现「从总规则勾选子集」。
- 本轮不把规则接到学生端校验逻辑。
- 不调整缴费名单业务流（仅保留延迟缴费天数规则项与读取函数）。

## Capabilities

### New Capabilities

- `registration-rules-catalog`：校级选课规则设置目录（与批次图示对齐的条目集合）

### Modified Capabilities

- （无；`openspec/specs/` 下无对口主规格，本变更新增能力）

## Impact

- `src/data/courseRegistration/registrationRuleSettings.js`
- `src/views/courseRegistration/RegistrationRuleSettingsView.vue`（若需适配复合文案；尽量数据驱动）
- `src/i18n/locales/zh.js` / `en.js`
- `openspec/changes/course-reg-rules/` 增量文档（可选同步）
- `getPaymentGraceDays()` 继续读取延迟缴费天数规则
