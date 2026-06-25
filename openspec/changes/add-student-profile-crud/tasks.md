## 1. 数据层重构

- [x] 1.1 重构 `src/data/students.js`：嵌套模型（basicInfo / enrollment / contact / education / family / accommodation / others / photo）、`studentCategoryOptions`（Local / China / International）
- [x] 1.2 实现 `createEmptyStudent`、`normalizeStudent`、`getStudentFormData`、`validateStudentForm`、Student ID 唯一性校验
- [x] 1.3 更新 mock 数据：≥3 条原型样例（XMUM2309001 Tan Wei Ming 等），Intake 格式 YYYY/MM

## 2. i18n

- [x] 2.1 补充 `zh.js` / `en.js`：七 Tab 名称、表单字段标签、Drawer 标题、校验与 Import/Delete 文案
- [x] 2.2 补充 `zh-flat.js`：表单英文字段 tr 映射

## 3. Tab 子组件

- [x] 3.1 创建 `tabs/BasicInfoTab.vue`：Basic Info 字段 + Photo Upload（FileReader 预览，≤2MB）
- [x] 3.2 创建 `tabs/EnrollmentTab.vue`：Enrollment 全部字段
- [x] 3.3 创建 `tabs/ContactTab.vue`：Contact 字段（mobilePhone、email 必填）
- [x] 3.4 创建 `tabs/EducationTab.vue`：Education + Language Proficiency + Remarks
- [x] 3.5 创建 `tabs/FamilyTab.vue`：Family 字段
- [x] 3.6 创建 `tabs/AccommodationTab.vue`：Accommodation 字段
- [x] 3.7 创建 `tabs/OthersTab.vue`：Others 字段
- [x] 3.8 Tab 组件支持 `readOnly` prop，供 Form 与 Detail 复用

## 4. Form / Detail Drawer

- [x] 4.1 创建 `StudentProfileFormDrawer.vue`：Category 单选 + 7 Tab 切换 + Cancel/Save + 校验与错误 Tab 跳转
- [x] 4.2 创建 `StudentProfileDetailDrawer.vue`：同 Tab 结构只读展示
- [x] 4.3 删除 `StudentProfileDetailModal.vue`

## 5. 列表页 CRUD

- [x] 5.1 更新 `StudentProfileView.vue`：checkbox 列、全选/单选、`selectedIds`
- [x] 5.2 工具栏增加 Delete（批量，无选中 disabled）；Actions 增加 Delete（行内）
- [x] 5.3 接线 Create → FormDrawer（create 模式）；Edit → FormDrawer（edit 模式）；Save 增/改列表
- [x] 5.4 接线 Details → DetailDrawer；Delete → ConfirmDialog → 从列表移除
- [x] 5.5 更新 Student Type 搜索下拉为 Local / China / International

## 6. Import / Export

- [x] 6.1 创建 `importStudentProfileExcel.js`：模板生成、XLSX 解析、行校验、重复 ID 跳过
- [x] 6.2 创建 `StudentProfileImportModal.vue`：模板下载、选文件、导入结果展示
- [x] 6.3 扩展 `exportStudentProfileExcel.js`：列表字段 + 完整档案扁平字段常量
- [x] 6.4 更新 ExportModal 字段组；Import 按钮接线 ImportModal

## 7. 验证

- [x] 7.1 手动冒烟：Create 七 Tab 保存 → 列表出现 → Edit 修改 → Details 全字段 → Delete 单条/批量
- [x] 7.2 手动冒烟：Import 模板下载 + 上传新行 + 重复 ID 报告；Export 列表列与扩展列
- [x] 7.3 视觉对比：Drawer / 列表样式与 Basic Data（Lecturer Information）一致

## 8. Category 差异化字段（Phase 2 增量）

- [x] 8.1 扩展 `students.js`：`basicInfo` 新增 passport/China 字段、`qualificationOptions` / `recruitedByOptions` / `disabilityOptions`、可见性 helper
- [x] 8.2 更新 `validateStudentForm`：Local 必填 icNo；China/International 不要求 icNo
- [x] 8.3 更新 mock：XMUM2309002/9003 使用 passport/identityNoChina 而非 icNo
- [x] 8.4 更新 `BasicInfoTab.vue`：按 Category 条件渲染 Local / China / International 字段
- [x] 8.5 更新 `EducationTab.vue`：隐藏 Chinese Test；China/International 的 Qualification 下拉
- [x] 8.6 更新 `OthersTab.vue`：China/International 隐藏 Tax Registration No
- [x] 8.7 更新 `EnrollmentTab.vue`：Recruited By 下拉；Fujian Scholarship 仅 China
- [x] 8.8 补充 i18n（zh/en/zh-flat）：Passport、Candidate No.、Political Outlook 等新字段
- [x] 8.9 扩展 Import/Export：按 Category 校验与模板列、导出 passport/China 字段
- [x] 8.10 冒烟：三类 Create/Details 字段正确；Import Local 缺 IC 报错、China 无 IC 可导入；`npm run build`

## 9. Enrollment / Education 精调（Phase 3）

- [x] 9.1 Recruited By：Local / China / International 均为下拉
- [x] 9.2 奖学金方案 B：Fujian Scholarship Amt 仅 Local；China / International 不显示
- [x] 9.3 Qualification：三类均为下拉
- [x] 9.4 Chinese Test：Local + International 显示；仅 China 隐藏
- [x] 9.5 更新 design.md Resolved；`npm run build` 通过

## 10. Export 弹框对齐 Programme Version（Phase 4）

- [x] 10.1 更新 `exportStudentProfileExcel.js`：`studentProfileExportFields` 含 `no` 列；列表列 `selectedByDefault: true`，扩展列 `selectedByDefault: false`（对齐 `programmeVersionExportFields` 模式）
- [x] 10.2 更新 `StudentProfileView.vue`：`handleExportConfirm` 与 `ProgrammeVersionView` 一致，直接传 `selectedFields`（移除 `['no', ...selectedFields]` 硬编码）
- [x] 10.3 验证 ExportModal 接线：`:fields="translatedExportFields"`、`:has-selected-rows="hasSelection"`；打开弹框时列表列在右侧、扩展列在左侧
- [x] 10.4 冒烟：Export Current Page / All Results / Selected Rows 三档；穿梭字段后 Excel 列正确；未勾选行时 Selected Rows  toast；`npm run build` 通过

## 11. 学籍异动：流程日志外置（Phase 5 — 已实现）

- [x] 11.1 创建 `ApprovalLogModal.vue`：表格展示 approvalLog；副标题申请编号/学号/姓名；空态暂无数据
- [x] 11.2 四模块列表 Actions 增加「流转日志」（`common.workflowLog`），各状态均可见
- [x] 11.3 四模块 DetailModal 移除内嵌 approvalLog 区块
- [x] 11.4 补充 i18n：`common.workflowLog`（EN Workflow Log / ZH 流转日志）
- [x] 11.5 冒烟：四模块点击流转日志弹窗；详情无 log 区；`npm run build` 通过

## 12. 转专业流转状态 Mock（Phase 5 关联 — 待 `add-programme-transfer-app` §9）

- [x] 12.1 扩展 `programmeTransfers.js`：Draft / In Progress / Cancelled / Update Required / Rejected / Approved 各 ≥2 条 mock
- [x] 12.2 验证列表 Actions 与 6 态规则一致；`npm run build` 通过

## 13. 详情只读层级与 Mock 丰富度

- [x] 13.1 `student-profile/spec.md` §13：label/value 层级、空值弱化、showcase mock 丰富度
- [x] 13.2 `StudentFormField.vue`：readOnly label 12px 灰 / value 15px 强调 / `—` 弱化
- [x] 13.3 `StudentProfileDetailDrawer.vue`：学生类别 label/value 对齐
- [x] 13.4 `students.js`：丰富 XMUM2309001/9002/9003 各 Tab mock（每 Tab 留少量 intentional 空项）
- [x] 13.5 冒烟：Details 七 Tab 可读性；`npm run build` 通过

## 14. Enrollment Tab 学籍字段主数据下拉（§14）

- [x] 14.1 `student-profile/spec.md` §14：五字段主数据下拉、独立不关联、列表/详情/编辑一致
- [x] 14.2 新建 `studentEnrollmentOptions.js`：programmeCode / programmeName / faculty / intake / academicSession 五类 options
- [x] 14.3 `EnrollmentTab.vue`：Programme Code、Programme、Faculty、Intake、Academic Session 改 `<select>`
- [x] 14.4 `students.js`：XMUM2309001/9002/9003 enrollment 对齐 catalogue + intakeSets + semester canonical 值
- [x] 14.5 冒烟：列表 → Details → Edit 五字段与列表一致且下拉有选中；Create 各下拉可选；`npm run build` 通过
