## 背景

四类异动申请表单原先将「学生声明」放在「支持性文件」之前，与真实填报顺序（先填表、上传附件、再勾选声明）不符。退学缺少图示 Instructional Note；休学/复学缺少顶部申请人说明。

## 目标 Section 顺序

| 类型 | 顺序 |
|------|------|
| 转专业 | I 学生 → II 转专业 → **III 附件** → **IV 声明** → VII 教务办 |
| 休学/退学 | I 学生 → II 申请 → III 家长同意 → **IV 附件** → **V 声明** |
| 复学 | I 学生 → II 复学详情 → **III 附件** → **IV 声明** |

表单末尾提示：
- 复学：`noteAlert` 保留在声明之后
- 休学：`infoAlert` 保留在声明之后
- 退学：ISAO 提示保留在声明之后（国际生）

## 组件设计

```
MovementApplicantNotes.vue
  props: titleKey, itemKeys[], variant ('default' | 'instructional')
  - default: 蓝色说明框（转专业/休学/复学）
  - instructional: 黄色说明框（退学 6 条 Instructional Note）

movementApplicantNotes.js
  - 四类 note item key 列表，与 i18n 分离
```

详情视图（`MovementDetailContent`、各 `*DetailModal`）与表单保持相同 Section 顺序；顶部只读展示 `MovementApplicantNotes`。

## i18n

- `*.sections.*` 按上表重编号（III/IV/V）
- 新增 `deferment.notes`、`resumption.notes`、`withdrawal.notes`（中英各一套）
- 转专业沿用既有 `programmeTransfer.notes` 结构作为 demo 模板

## 非目标

- 不改声明条款正文、校验规则
- 不改 Section VII 教务办区块（转专业）
