# Local 转专业规则去掉申请时间列数据

## 背景
MR001/MR002 的申请时间（1~3、1~1）与规则值（3、1）重复；规则名称已用 `{value}` 表示「须在学期第 N 周内提交」，起始周隐含为 1。

## 变更内容
- MR001、MR002 的 `condition.applicationWeek` 设为 `null`，申请时间列显示 `-`
- 时限判断仅依赖可编辑的规则值（截止周）

## 影响
- `src/data/movementRules.js`
- OpenSpec 设计文档映射表
