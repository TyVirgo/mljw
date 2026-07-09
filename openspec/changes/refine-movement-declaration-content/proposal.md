# Section V 声明内容按类型调整

## 背景
四异动 Section V 声明条款应按产品原型区分：通用句、休学/复学修业年限、转专业规章与签证条款；退学仅通用句。条款需连续编号展示。

## 变更内容
- `movementCommon.declaration` 通用句 + 修业年限句
- 按类型声明数组：退学 1 条、休学/复学 2 条、转专业 3 条
- `MovementDeclarationSection` 改为有序列表 1. 2. 3.
- 表单/详情/PDF（DOM 快照）同步

## 影响
- `movementDeclarationItems.js`、i18n、四 Form/Detail、`MovementDetailContent.vue`
