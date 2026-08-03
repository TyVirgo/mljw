# 学籍管理-学生基本信息 — 任务清单（合并归档）

> 历史 tasks 已在各次 apply 中完成。本清单仅作追溯；**无需再次实现**。

- [x] 1. 合并本菜单下历史变更包为中文需求包
- [x] 2. 保留合并来源列表便于需求文档回溯
- [x] 3. 删除已被合并的旧变更目录

## 历史来源任务摘要

### add-status-log-graduation-withdrawal-remarks

```
# 任务
## 1. 构建函数

- [x] 1.1 graduationStatusLog.js
- [x] 1.2 withdrawalStatusLog.js

## 2. 集成

- [x] 2.1 applyStudentProfileFromMovement 退学分支
- [x] 2.2 studentStatusOptions + i18n Graduated

## 3. Mock 与验证

- [x] 3.1 更新 XMUM2309001 毕业与退学 demo
- [x] 3.2 npm run build
```

### add-student-pass-expiry-date

```
# 任务
## 1. 数据模型

- [x] 1.1 createEmptyBasicInfo、clearCategorySpecificFields、normalizeStudent 增加 `studentPassExpiryDate`
- [x] 1.2 实现 `matchesStudentPassExpiryDateRange` 辅助函数 + mock China/Intl 样例
- [x] 1.3 programmeTransfers 的 visaExpiryDate 改读 studentPassExpiryDate

## 2. 界面

- [x] 2.1 BasicInfoTab 只读字段（China/Intl）
- [x] 2.2 StudentProfileView 列表列 + 日期范围搜索
- [x] 2.3 exportStudentProfileExcel 列与行映射

## 3. i18n 与验证

- [x] 3.1 zh/en + zh-flat 标签
- [x] 3.2 npm run build
```

### add-student-profile-change-log-tab

```
## 1. 数据与文案

- [x] 1.1 在 `students.js` 增加 `profileChangeLogs` 结构、normalize，并为演示学生挂种子数据（含 basic + accommodation、老师/学生角色）
- [x] 1.2 补充 en/zh：Tab「信息变更记录」及表头文案

## 2. UI

- [x] 2.1 新增 `ProfileChangeLogTab.vue`（表格展示，时间新→旧）
- [x] 2.2 `studentDetailTabs` 在 statusLog 后注册；`StudentProfileDetailDrawer` 挂载组件

## 3. 冒烟

- [x] 3.1 详情可见新 Tab；有种子数据时列齐全；状态日志内容未混入字段变更
```

### add-student-profile-crud

```
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
- [x] 5.4 接线 Details
```

### add-student-profile-export-card-button

```
## 1. UI 与 i18n

- [x] 1.1 `StudentProfileDetailDrawer.vue` footer 增加导出学籍卡按钮
- [x] 1.2 i18n `studentProfile.exportStudentCard`

## 2. 验证

- [x] 2.1 `npm run build`
```

### add-student-profile-preview-login

```
# 任务
## 1. Mock 与导航
- [x] 1.1 扩展 `mockCurrentStudent.js`（enter preview、reactive studentId）
- [x] 1.2 App.vue 跳转至学生异动申请（学生端）

## 2. 列表界面与 i18n
- [x] 2.1 StudentProfileView Preview 按钮 + tooltip
- [x] 2.2 i18n 文案

## 3. 验证
- [x] 3.1 npm run build

## 4. 细化（无 Banner + tooltip 可见）
- [x] 4.1 更新 proposal / design / spec（移除 Preview Banner 场景）
- [x] 4.2 移除 App.vue Preview Banner 与退出预览逻辑
- [x] 4.3 Preview tooltip 改为 Teleport + fixed 定位，避免被表格裁剪
- [x] 4.4 npm run build
```

### add-student-profile-track-category-field

```
## 1. 数据层

- [x] 1.1 `students.js`：`getTrackCategoriesForProfileStatus`、默认 `trackCategory`、`normalizeStudent` 投影、表单校验
- [x] 1.2 mock 学生补 `enrollment.trackCategory`（normalize 默认 Normal + sync）

## 2. UI 与导出

- [x] 2.1 `studentProfileFieldLabels.js` 注册 `trackCategory`
- [x] 2.2 `EnrollmentTab.vue` 联动下拉
- [x] 2.3 `StudentProfileView.vue` 列表列
- [x] 2.4 `exportStudentProfileExcel.js` 导出列
- [x] 2.5 i18n `Track Category` 标签

## 3. 验证

- [x] 3.1 `npm run build`
```

### refine-student-pass-expiry-end-date-display

```
## 1. 工具函数

- [x] 1.1 `formatStudentPassExpiryEndDate` + `resolveStudentPassExpiryEndDisplay`

## 2. 展示接入

- [x] 2.1 Student Profile 列表 / BasicInfoTab / Excel 导出
- [x] 2.2 `movementVisaExpiry.js` snapshot 与详情展示

## 3. 验证

- [x] 3.1 `npm run build`
```

### refine-student-profile-enrollment-demo-fields

```
# 任务
## 1. 格式化与规范化
- [x] 1.1 `formatEnrollmentProgrammeStructure` 改为 intake YYYYMM；resolveEnrollment 同步
- [x] 1.2 `normalizeStudent` 回填 programmeStructure / registrationTime / expected batches

## 2. 种子数据
- [x] 2.1 后 5 条 mock 补 outstandingFee（N/Y 混合）；修正 CS → CSN

## 3. 验证
- [x] 3.1 npm run build
```

### refine-student-profile-enrollment-programme-first-cascade

```
# 任务
- [x] 1. `getEnrollmentAllProgrammeOptions()` 全量专业选项
- [x] 2. `EnrollmentTab.vue` 重排前四字段并改为专业优先联动
- [x] 3. 扩展 `applyProgrammeIntakeLinkage` / `clearProgrammeLinkageFields` 写入 level、faculty
- [x] 4. 编辑回填与 hydrate 兼容
- [x] 5. `npm run build` 验证
- [x] 6. intake / registrationTime / semester tooltip 定义与 i18n
- [x] 7. `EnrollmentTab.vue` 绑定 label-hint
```

### refine-student-profile-list-search

```
# 任务
## 1. 数据辅助
- [x] 1.1 `getLatestStatusLogEntry` / `getLatestStudentStatus` + `matchesStudentKeyword` + filter helpers
- [x] 1.2 `normalizeStudent` 扁平 nationality、outstandingFee、latestStatus 等

## 2. 列表页界面
- [x] 2.1 StudentProfileView 搜索区（keyword + 折叠下拉）
- [x] 2.2 表格列调整 + 左三列 sticky
- [x] 2.3 export 列表列同步

## 3. i18n 与验证
- [x] 3.1 搜索 keyword 标签 i18n
- [x] 3.2 npm run build

## 4. 搜索与列表列对齐
- [x] 4.1 主表补 IC No.、Mobile Phone、Registration Time、Programme Level、Programme Structure、Expected Completion/Graduation Batch
- [x] 4.2 列表导出列同步
- [x] 4.3 npm run build

## 5. 冻结复选框与专业层次展示
- [x] 5.1 复选框列加入左冻结（th/td + CSS）
- [x] 5.2 `formatProgrammeLevel` 工具 + 列表筛选归一化比较
- [x] 5.3 StudentProfileView 搜索下拉/表格列/导出 Programme Level 统一展示
- [x] 5.4 npm run build
```

### refine-student-profile-nationality-first

```
## 1. 数据层与共享逻辑

- [x] 1.1 在 `src/data/nationalityOptions.js` 新增全球国籍列表及 `getNationalityOptionsForSelect()`（Malaysia、China 置顶）
- [x] 1.2 在 `src/data/students.js` 新增 `resolveCategoryFromNationality()`、`clearCategorySpecificFields()`；`createEmptyStudent()` 默认 `studentCategory` 为空
- [x] 1.3 更新 `validateStudentForm()`：国籍必填；保存前确保 `studentCategory` 与 nationality 一致
- [x] 1.4 重构 `movementApprovalEngine.inferStudentCategory()` 复用 `resolveCategoryFromNationality()`

## 2. 通用组件

- [x] 2.1 新建 `src/components/common/SearchableSelect.vue`（可搜索下拉，支持 filter + 选项选择）
- [x] 2.2 补充 i18n：`nationalitySectionTitle`、`entrySectionTitle`、`selectNationalityFirst`、`nationalityChangeConfirm` 等（zh/en）

## 3. 表单抽屉布局

- [x] 3.1 重构 `StudentProfileFormDrawer.vue`：移除 category radio；新增「国籍信息」「信息填写」分区
- [x] 3.2 集成 SearchableSelect 绑定 `form.basicInfo.nationality`；只读展示 derived Student Category
- [x] 3.3 实现 nationality watch：首次选择直接设 category；编辑改国籍致 category 变化时 confirm + 清互斥字段
- [x] 3.4 向 Tab 组件传递 `nationalitySelected`；未选国籍时显示空态占位

## 4. Tab 与详情

- [x] 4.1 更新 `BasicInfoTab.vue`：移除 Nationality 字段；可选调整字段分组排版
- [x] 4.2 更新其余 Tab 组件（Enrollment/Contact/Education/Family/Accommodation/Others）：支持 `nationalitySelected` 空态 gate
- [x] 4.3 重构 `StudentProfileDetailDrawer.vue`：同步「国籍信息 + 信息填写」两段式只读布局

## 5. 验证

- [x] 5.1 手动验证新建：未选国籍时空 Tab → 选 Malaysia/China/UK 分别带出 Local/China/International 字段
- [x] 5.2 手动验证编辑：改国籍触发确认并清理互斥字段；Save 后列表 Student Type 正确
- [x] 5.3 手动验证详情 Drawer 布局与表单一致

## 6. 步骤式布局精修

- [x] 6.1 未选国籍时整块隐藏「信息填写」区块（标题、Tab、字段
```

### refine-student-profile-split-keyword-search

```
## 1. 数据层

- [x] 1.1 `students.js`：`matchFuzzyField` + `matchesStudentTextFilters`，更新 `matchesStudentListFilters`

## 2. 界面
- [x] 2.1 `StudentProfileView.vue`：5 个独立搜索框，移除 keyword
- [x] 2.2 移除 `.search-item-keyword` 专用样式

## 3. 验证

- [x] 3.1 `npm run build`
```

### remove-taiwan-from-demo-nationality

```
## 1. 数据

- [x] 1.1 nationalityOptions 移除 Taiwan
- [x] 1.2 students.js Elson Lai 改为 Singapore 及相关字段

## 2. 验证

- [x] 2.1 全库 grep 无 Taiwan/台湾
- [x] 2.2 npm run build
```

### unify-student-profile-field-labels

```
# 任务
## 1. 字段注册表与组件
- [x] 1.1 新增 studentProfileFieldLabels + useStudentProfileFieldLabels
- [x] 1.2 StudentProfileTableHeaderLabel（表头 tooltip）

## 2. 视图与 i18n
- [x] 2.1 StudentProfileView 表头/搜索改用注册表
- [x] 2.2 EnrollmentTab / BasicInfoTab label 对齐；Preview 中文「预览」；Programme Level zh-flat

## 3. 验证
- [x] 3.1 npm run build
```
