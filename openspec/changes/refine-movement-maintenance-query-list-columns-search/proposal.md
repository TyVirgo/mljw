# 异动维护/查询列表列与搜索

## 背景
两页主表需统一列顺序与搜索字段，生效日期文案统一，导出与主表一致。

## 变更内容
- 主表前缀列：序号…生效日期；其余原列接后
- 搜索 9 项；移除申请学年学期、专业代码
- 新增 nationality 列与搜索；studentType 作国籍类别
- 导出列顺序与主表一致
- 搜索区对齐学生基本信息：主行常用条件 + 查询/重置（带图标）+ 更多/收起；点击查询才应用筛选

## 影响
- `MovementMaintenanceView.vue`、`MovementQueryView.vue`
- `MovementListSearchBar.vue`、导出列配置与 i18n
