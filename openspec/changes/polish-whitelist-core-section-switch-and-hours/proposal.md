## Why

白名单时长配置占独立区块；未来学期必修仍为布尔全开；加退同课规则与「防换组」产品口径相反；加课/重修缺少「本学期必修允许换组」且精确到教学班的白名单。未来必修选组挤在勾选旁可读性差；仅退课缺少「低于学期最低学分」白名单闸门。

## What Changes

- 「权限有效时长」并入「允许加退课/重修申请」同行：`…申请，申请时长为[小时]h`；删除原独立时长区块
- 「允许添加未来学期必修课申请」勾选后必选课号+教学班（多选），加课池按清单放行；**选组 UI 下移**，对齐「课程豁免先修课 *」整行布局
- **反转**加课/加退：本学期必修退课后默认**只许同组加回**；其他组展示置灰；名额满不可加回
- 新增权限（可加课 / 可重修各一条）「本学期必修课允许换组」：勾选后在白名单选课弹框中选择允许换到的**具体课号+课程分组**；有权限且命中清单的分组才可选
- 重修同默认：不可换组；开换组白名单（重修条）后按清单可选
- 新增权限「退课允许低于12学分」（`allowDropBelowCreditMin`）：默认**仅退课**不得使学期学分低于学期最低（长学期 12）；勾选后允许 Drop 低于保底
- 未来学期选修额度：去掉 GE 说明句；文案改为「GE允许选择 N 学分 / ME允许选择 N 学分」；「ME 课程组允许选择类别」
- 选组弹框（未来必修 / 换组）：同课多组用 **rowspan** 合并展示，**一门课一个多选框**；勾选写入该课全部教学班 ref
- 纯加课必修：默认只许加回资格种子中的原分组；全组展示、异组置灰（对齐重修）；白名单换组放行
- Demo：补全加课「原上课学期」与 `originalSectionCode`；多分组曾退必修可验收同组锁


## Non-goals

- 不改为仅存课号（仍写 section refs）
- 不改选修退加换组规则（本变更针对必修）
- 不复活旧 UI「bypassCreditMin=突破学分要求」文案语义（超上限仍为 bypassCreditMax）
- AddDrop / RetakeDrop 净学分低于保底不在本权限范围（仅纯 Drop）

## Capabilities

### New Capabilities

- `whitelist-core-section-switch-hours`: 时长并进、未来必修选组布局、必修换组白名单、退课破最低学分与选课器规则

### Modified Capabilities

- （无主库条目；覆盖既有同课同组禁加回口径）

## Impact

- `SupplementEntryDrawer.vue`、`WhitelistCoursePickModal.vue`
- `supplementListQueue.js`、`addDropEligibleCourses.js`、`addDropFormSections.js`
- `AddDropCoursePickerModal.vue`、StudentAddDropView
- i18n；相关旧 same-section / 学分闸口径以本 change 为准
