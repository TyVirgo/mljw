# 学籍管理-知情同意书配置 — 任务清单（合并归档）

> 历史 tasks 已在各次 apply 中完成。本清单仅作追溯；**无需再次实现**。

- [x] 1. 合并本菜单下历史变更包为中文需求包
- [x] 2. 保留合并来源列表便于需求文档回溯
- [x] 3. 删除已被合并的旧变更目录

## 历史来源任务摘要

### add-consent-form-applicable-student-scope

```
## 1. 数据层

- [x] 1.1 `consentForms.js`：`applicableStudentScope` 字段与选项常量
- [x] 1.2 mock 部分记录补示例值

## 2. UI 与 i18n

- [x] 2.1 `ConsentFormFormModal.vue` 新建/编辑表单项
- [x] 2.2 `ConsentFormView.vue` 列表列
- [x] 2.3 `ConsentFormViewModal.vue` 详情
- [x] 2.4 i18n

## 3. 验证

- [x] 3.1 `npm run build`
```

### add-consent-form-config

```
## 1. 数据层

- [x] 1.1 创建 `src/data/consentForms.js`：`consentForms` ref、movementType 枚举、studyDurationRules
- [x] 1.2 实现 `normalizeStudentTypeForConsent`、`resolveConsentTemplate(movementType, studentCategory)`
- [x] 1.3 实现 CRUD：`createConsentForm`、`updateConsentForm`、`deleteConsentForms`
- [x] 1.4 实现 `validateConsentFormForm`：必填、movementType+studentType 唯一、PT 修读时长必填
- [x] 1.5 实现 `checkProgrammeTransferStudyDurationEligibility(student, template)` mock 校验
- [x] 1.6 写入 8+ 条 mock 种子（PT×3、DEF×2+、WDR、RES 等，含家长书样例）

## 2. 下载工具

- [x] 2.1 创建 `src/utils/consentFormDownload.js`：`downloadMockConsentFile(fileMeta, label)`

## 3. i18n

- [x] 3.1 在 `en.js`、`zh.js` 新增 `consentForm.*`（搜索、列、表单、修读时长规则、View）
- [x] 3.2 `studentType.Chinese` → 「中国」；`downloadNotConfigured`、eligibility 提示
- [x] 3.3 在 `zh-flat.js` 同步校验 flat 映射

## 4. 管理端组件

- [x] 4.1 创建 `ConsentFormFormModal.vue`（图示3：名称、类别、Student Type、修读时长条件、Remark、双 Upload、Cancel+Save）
- [x] 4.2 创建 `ConsentFormViewModal.vue`（只读 + mock 下载）
- [x] 4.3 创建 `ConsentFormView.vue`（搜索 list-page-search.css、Create/Delete、表格、Edit|View、分页）

## 5. 路由与菜单

- [x] 5.1 `studentRecordsDevelopedPages` 加入 `sr-consent-form`
- [x] 5.2 `App.vue` import + `isConsentForm` + 渲染 `ConsentFormView`

## 6. 异动申请端接线

- [x] 6.1 更新 `ProgrammeTransferFormModal`：`downloadConsentLetter` 走 lookup；Submit 前修读时长校验
- [x] 6.2 更新 `DefermentFormModal`：Documents 下载 + Section III 家长下载（有配置时）
- [x] 6.3 更新 `WithdrawalFormModal`：同上
- [x] 6.4 更新 `ResumptionFormModal`：Documents 下载走 lookup
- [x] 6.5 更新 `M
```

### refine-consent-form-version-snapshot

```
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
```
