## Context

待开放预览：`StudentPendingRoundPreviewPanel`（搜索 + 只读课表）。  
正式列表：「课程一览」=`StudentCourseCatalogDrawer` + `cr-catalog-trigger` 样式。

## Goals / Non-Goals

**Goals:** 预览页搜索与表格之间增加同款「课程一览」按钮，打开同款抽屉，课源=当前 `batchId`+`roundKey` 可选课（含课号详情）。

**Non-Goals:** 不改时间轴、不改选课闸门、不加「我的课表」到预览页。

## Decisions

1. **按钮放在面板内**，不经过 `StudentRegisterView` 抬升状态；抽屉挂在 preview 面板内。  
2. **课程列表**：`roundFilteredCourses` 过滤 `eligibility?.eligible !== false`（对齐正式页 `catalogCourses`）。  
3. **样式**：复用 `cr-catalog-trigger`（抽到 student css 或面板 scoped 复制同等规则，优先全局 student css 若尚未导出）。

## Risks / Trade-offs

- [Risk] scoped 样式与正式页不一致 → Mitigation：共用 class + student.css 中补充 `.cr-catalog-trigger` 全局定义（若仅在 RegisterView scoped，则迁一份到 student.css）。
