# 四异动 Section II–IV 重组

## 背景
产品原型要求四异动申请表单 Section II（学生填写）、Section III（家长同意，复学/转专业无）、Section IV（支持性文件）字段顺序与标题统一；复学不需下载知情同意书。

## 变更内容
- **Section II : STUDENT APPLICATION** — 按类型重排 grid（休学/退学/复学/转专业）
- **Section III : PARENT/GUARDIAN** — 休学/退学监护人字段重排；选学生后从默认监护人带出、可编辑
- **Section IV : SUPPORTING DOCUMENTS** — 复学移除 Download Consent；其余类型保留
- **Section V Declaration** — 不变
- 转专业 Current Programme/Intake/School 移至 Section I 只读；Section II 仅 Start Semester、志愿与 transferReason textarea

## 影响
- 四 `*FormModal.vue`、四 `*DetailModal.vue`、`MovementDetailContent.vue`
- `withdrawals.js`（`getPrimaryFamilyContact`）、`movementAttachments.js`
- i18n section 标题
