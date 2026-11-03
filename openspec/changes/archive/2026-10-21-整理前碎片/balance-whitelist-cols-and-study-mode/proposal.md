## Why

白名单权限区左瘦右胖，视觉失衡；重修汇总表「是否同课程曾修」与课程班学生名单「修读方式」语义相关但文案/取值不一致，需统一为三值修读方式。

## What Changes

- 白名单：未来学期必修/选修勾选迁至左列；右列保留换组、豁免先修、突破学分、退课低于 12
- 「选择的重修课程」列改为「修读方式」，值仅「同课号重修」「同课程组重修」
- 课程班学生名单「修读方式」同源三值：正常 / 同课号重修 / 同课程组重修（筛选与展示对齐）

## Non-goals

- 不改白名单业务门禁与未来学期配置块位置（全宽区可仍在下方）
- 不改重修业务判定，仅展示映射

## Capabilities

### New Capabilities

- `whitelist-balance-and-study-mode`: 权限列平衡与修读方式三值统一

### Modified Capabilities

- （无）

## Impact

- `SupplementEntryDrawer.vue`
- `AddDropApplicationFormSections.vue`
- `SectionStudentRosterView.vue`、`sectionStudentRoster.js`
- `zh.js` / `en.js`
