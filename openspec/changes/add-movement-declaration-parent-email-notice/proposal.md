## Why

产品要求四类异动申请（转专业 / 休学 / 退学 / 复学）的 Section V 学生声明在通用正确性条款后，新增一条家长/监护人邮件通知告知；中英文均需同步。

## What Changes

- 在通用声明条款中新增一句（紧接「信息真实完整」之后）：
  - EN：`I acknowledge that my parent(s)/guardian(s) will be notified of the application result by email.`
  - ZH：`我知悉，家长/监护人将通过电子邮件获知本申请结果。`
- 四类异动表单与详情 Section V 均展示该新条款（编号顺延）
- 不新增额外勾选框；仍共用现有「同意声明」单选框

## Non-goals

- 不实现真实发信 / 家长邮箱校验
- 不改动声明勾选字段名或提交校验规则
- 不改动转专业专有条款、休学/复学最长修业年限条款的文案本身

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `movement-declaration`：四类 Section V 通用条款增加家长/监护人邮件通知告知

## Impact

- `src/data/movementDeclarationItems.js`：四类 items 数组插入通用新键
- `src/i18n/locales/en.js` / `zh.js`：`movementCommon.declaration.parentEmailNotice`
- 表单/详情已通过 `MovementDeclarationSection` + items 数组驱动，一般无需改组件
