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
- [x] 6.5 更新 `MovementAttachmentReadonly.vue`：详情下载走 lookup（props 传入 movementType + studentCategory）

## 7. 验证

- [x] 7.1 冒烟：管理页 CRUD/View → 四 Tab 下载匹配不同模板 → 休学/退学家长下载 → PT 修读时长拦截
- [x] 7.2 `npm run build` 通过

## 8. 移除修读时长（增量）

- [x] 8.1 `consentForms.js`：删除 `studyDurationRule`/`studyDurationRules`/`checkProgrammeTransferStudyDurationEligibility`；seed 简化
- [x] 8.2 `ConsentFormView.vue`：删除修读时长列
- [x] 8.3 `ConsentFormFormModal.vue` / `ConsentFormViewModal.vue`：删除修读时长字段展示
- [x] 8.4 `ProgrammeTransferFormModal.vue`：删除 Submit/Resubmit 修读时长校验
- [x] 8.5 `npm run build` 通过

## 9. 列表表头去掉排序箭头

- [x] 9.1 `ConsentFormView.vue`：移除 `<th>` 的 `sortable` class 及 `.data-table th.sortable::after` CSS
- [x] 9.2 冒烟：知情同意书列表表头无 ⇅ 箭头；`npm run build` 通过
