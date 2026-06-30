## 1. 数据层（consentForms.js）

- [x] 1.1 ~~`createEmptyConsentForm` 增加 `effectiveAcademicSession`~~ → **Phase 2.2：移除 `effectiveAcademicSession`**
- [x] 1.2 `validateConsentFormForm` 区分 create/edit 模式
- [x] 1.2b Create 校验 **不再** 要求 `effectiveAcademicSession`
- [x] 1.3 ~~创建首条 version~~ → **Phase 2.2：`createConsentForm` 写入 `versions: []`**
- [x] 1.4 新增 `addConsentFormVersion(configId, payload)`
- [x] 1.4b `addConsentFormVersion` 支持 `applyImmediately`（默认 false）；**移除**「无已应用版本则自动应用」逻辑
- [x] 1.5 停用 `appendVersionLog`
- [x] 1.6 mock 种子：versions 含 isApplied 附件；**12 行 remark 各不相同**

## 2. i18n

- [x] 2.1 `consentForm.versionSnapshot.*`
- [x] 2.2 `zh-flat.js` 版本快照 flat key
- [x] 2.3 新增 `consentForm.versionSnapshot.applyImmediately`（是否立即应用）
- [x] 2.4 Create 表单 **移除** `effectiveAcademicSession` 字段引用（学期仅保留在新增版本弹窗）

## 3. 新增/编辑弹窗（ConsentFormFormModal.vue）

- [x] 3.1 **Phase 2.2**：Create 改为 **5 字段 2×2 + 批注**，**去掉** 生效学年学期下拉
- [x] 3.2 Create 移除学生/家长上传
- [x] 3.3 Edit 仅 formName + remark
- [x] 3.4 弹窗宽度适配双列布局

## 4. 版本快照弹窗

- [x] 4.1 i18n 改用 versionSnapshot；列表入口文案
- [x] 4.2 表格列：学期、变更人、附件+预览、更新时间、应用
- [x] 4.3 **Phase 2.2**：「新增版本」位于 **表格上方左侧**（非 header 右上）
- [x] 4.4 `ConsentFormVersionFormModal.vue`：学期 + 上传
- [x] 4.4b 新增版本弹窗增加 **是否立即应用** `YnSwitch`，默认关闭
- [x] 4.5 Save 调用 `addConsentFormVersion` 并 refresh
- [x] 4.6 **Phase 2.2**：应用列改用 **`YnSwitch`** 互斥（非 checkbox）

## 5. 列表页

- [x] 5.1 ~~ConsentFormViewModal~~ → **Phase 2.2：列表移除 View，不再挂载 ViewModal**
- [x] 5.2 Actions：**编辑 | 版本快照**；Save 区分 create/edit

## 6. 验证

- [x] 6.1 Create（无学期）→ 快照为空 → 新增版本（立即应用关/开）→ 表格 YnSwitch 互斥
- [x] 6.2 Edit 不产生新版本；同学期 Add Version 拦截
- [x] 6.3 `resolveConsentTemplate` 读 globally applied version 无回归
