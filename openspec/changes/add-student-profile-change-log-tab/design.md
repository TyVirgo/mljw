## Context

详情 Tab 由 `studentDetailTabs` 驱动，末尾为 `statusLog`。产品确认：先做 **基本信息 + 住宿**；Tab 名 **信息变更记录**。

## Goals / Non-Goals

**Goals:**
- 详情只读新 Tab，字段级 from→to 流水
- mock 数据可演示老师/学生两类变更人

**Non-Goals:**
- 学工接口；本系统编辑写流水；家庭成员增删语义

## Decisions

1. **数据模型**（挂在学生记录上）：

```js
profileChangeLogs: [{
  id,
  changedAt,          // ISO 或可 format 的日期时间
  section: 'basic' | 'accommodation',
  fieldKey,           // 如 'basicInfo.phone' / 'accommodation.roomNo'
  fieldLabelKey,      // i18n 或英文标签键
  oldValue,
  newValue,
  changedBy,          // 展示名
  changedByRole: 'teacher' | 'student',
}]
```

2. **UI**：对齐 `StatusLogTab` 表格样式；时间新→旧排序。

3. **范围**：仅 `basicInfo.*` 与 `accommodation.*`；enrollment / statusLogs 不进此表。

4. **种子**：至少 1–2 名演示学生有若干条 basic + accommodation 变更。

## Risks / Trade-offs

- [Risk] 字段标签与表单不一致 → Mitigation：复用现有字段英文 label / `studentProfileFieldLabels` 若可用
- [Risk] 后续扩展其它 Tab → Mitigation：`section` 枚举可扩，本 change 只渲染 basic/accommodation

## Open Questions

（已关闭：范围=基本信息+住宿；名称=信息变更记录）
