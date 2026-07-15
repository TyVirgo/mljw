## Context

`add-movement-category-config` §20–§22 已在 `MovementCategoryFormModal` 为四类异动提供三个「处理选课」checkbox。产品现要求去掉第三项 `excludeGradedFromPreset`（「已获得成绩课程不预置到新专业批次名单」）。

当前实现触点：

```
MovementCategoryFormModal.vue  ← 第三行 checkbox UI
movementCategories.js          ← normalize / seed / empty form
MovementCategoryView.vue       ← 保存映射
zh.js / en.js                  ← excludeGradedFromPreset 文案
```

## Goals / Non-Goals

**Goals:**
- 弹框「处理选课」仅保留两项；布局仍为标签与首项同行、第二项缩进
- 彻底移除字段读写，避免死代码与文案残留

**Non-Goals:**
- 不改选课业务引擎 / 真实 API
- 不调整另两项默认值（PT001 仍默认可勾选删除原名单与预置批次）

## Decisions

1. **删字段，而非隐藏**  
   原因：原型阶段无后端契约依赖该字段；保留会污染 save payload 与 i18n。  
   备选：仅 `v-if=false` → 拒绝，避免无用配置回流。

2. **localStorage 旧值静默忽略**  
   `normalize` 不再映射 `excludeGradedFromPreset`；再次保存后键自然消失。无需迁移脚本。

3. **新建 change，不回写已完成 change**  
   `add-movement-category-config` 已 complete；用本 change 的 delta spec 表达移除。

## Risks / Trade-offs

- [Risk] 评审人员对比旧截图仍期待第三项 → Mitigation：本 change 明确为产品删减；重新部署静态包后可见
- [Risk] 文档/反馈表仍提及第三项（如 `generate-feedback-adjustment-doc.mjs`） → Mitigation：非本次必改；需要时可另开清理任务

## Migration Plan

1. 改源码并本地冒烟四类 Edit
2. `npm run deploy:gitcode` 更新云端静态包（如需）
3. push GitHub Pages（如需公网同步）

## Open Questions

（无）
