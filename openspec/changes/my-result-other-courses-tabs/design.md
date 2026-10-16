## Context

现有五 Tab + 课表四色（required / elective / application / admin）。产品要求合并申请与管理员为「其他课程」，并统一课表色与说明。

## Goals / Non-Goals

- Goals：四 Tab；列表 `other` = application ∪ admin；课表 layer `other` 同色；文案对齐。
- Non-Goals：加退课预览四色文案；监控二进制着色逻辑。

## Decisions

1. Tab keys：`all | elective | required | other`。
2. `listMyResultCoursesByType('other')` 过滤 `resultType ∈ {application, admin}`。
3. `resolveMyResultScheduleLayer`：application/admin → `other`；格样式复用原 application 色或新 `is-other`（倾向复用橙系并删 admin 独立色于 myResult 图例）。
4. 图例三项：必修课、选修课、其他课程。

## Risks

- 若 UI 某处仍写死 `application`/`admin` Tab key，需一并改掉。
