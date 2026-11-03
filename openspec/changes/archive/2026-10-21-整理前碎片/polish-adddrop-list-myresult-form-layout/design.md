## Decisions

1. 仅学生端去掉 `billStatus` 筛选项与过滤；审批 `AddDropApprovalView` 不动。
2. 累计学分：模板拆「前缀 + 分数」；CSS `font-weight:700`、字号 14px（原 13px）、分数色 `#dc2626`。
3. 删除 `retakeTypeFirstHint` 展示节点；i18n key 可保留弃用注释，不强制删。
4. 申请信息：四个 `form-field` 平铺在 `grid-template-columns: repeat(4, …)`；窄屏折行。
