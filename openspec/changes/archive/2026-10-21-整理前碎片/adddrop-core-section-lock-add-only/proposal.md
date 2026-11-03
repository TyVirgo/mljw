## Why

选课弹窗对「重修」必修也施加了「不可换组」灰显与长提示，与业务不符：该限制仅适用于加课申请中的本学期必修；重修应可换组。加课侧提示过长，需缩短。

## What Changes

- **重修 / 重修（退课）**：去掉本学期必修换组锁（弹窗可选其他分组、提交不因此拦截）。
- **加课 / 加退课**：保留换组锁（白名单「允许换组」仍可放行）；灰组提示改为短句「本学期必修课默认不可换组重修。」
- 弃用重修专用长文案键（保留键避免旧引用，文案可改为同短句或注明弃用）。

## Non-goals

- 不改白名单配置 UI「本学期必修课允许换组」。
- 不改选修课换组规则。

## Capabilities

### New Capabilities

- `adddrop-core-section-lock-add-only`: 必修换组锁仅加课

### Modified Capabilities

- （无）

## Impact

- `AddDropCoursePickerModal.vue`
- `addDropFormSections.js` 提交校验
- i18n zh/en
