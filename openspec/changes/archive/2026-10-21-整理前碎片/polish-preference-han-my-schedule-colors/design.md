## Context

`preferenceNth` 使用 `{n}` 数字导致「第3志愿」。`WeekScheduleGrid` 必修现为紫 `#7c3aed`，选修为 `#93c5fd`/`#1e3a8a`，与我的课表期望不符；同组件亦服务选课预览。

## Goals / Non-Goals

**Goals:**

- 中文：第一/二/三…志愿均为汉字序数
- 我的课表 + 在线选课预览：必修/已确认选修 solid 深蓝白字、浅蓝黑字 + 图例一致
- 本轮选择虚线绿保持不变

**Non-Goals:**

- 不改其他课程色、不改本轮选择虚线
- 不强制英文也改成 ordinal words（英文可仍 Preference {n}）

## Decisions

1. **汉字序数**：`formatCoursePreferenceLabel` 在中文环境下用一…十映射；≥11 可回退数字或「第{n}志愿」。通过 `t('courseRegistration.result.preferenceNth', { n: han })` 或专用 `preferenceNthHan`。检测中文：看 `preferenceFirst` 是否含「第」或传入 locale；更稳：用 `t` 返回的 `preferenceOrdinalMap` 或在 format 内对 1–10 用固定 key `preferenceFirst`…`preferenceTenth`，≥3 用 map。
2. **课表色（全局 solid）**：默认 `.is-required.is-solid` / `.is-confirmed.is-solid` 与对应 swatch 使用必修 `#1d4ed8`+白、选修 `#bfdbfe`+黑；`is-my-result` 覆盖可删或等同，避免双轨。
3. **本轮选择**：`.is-preview.is-dashed`（及 confirmed/required dashed）保持绿虚线，不改。
4. **英文**：`preferenceNth` 仍可用阿拉伯数字；不强制。

## Risks / Trade-offs

- [监控详情等共用 WeekScheduleGrid 的 solid 一并变色] → 接受，与学生端视觉统一
