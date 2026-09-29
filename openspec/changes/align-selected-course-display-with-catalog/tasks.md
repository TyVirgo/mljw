# 任务：align-selected-course-display-with-catalog

## 1. 工具与课名

- [x] 1.1 `getCourseLocalizedName` / `getCourseDisplayName`：双语课名跟语言
- [x] 1.2 `hydrateSelectedCourseDisplay` + `buildSelectedRowFromCatalog`

## 2. 展示接线

- [x] 2.1 `StudentRegistrationRoundStatusPanel` 行经 hydrate 渲染
- [x] 2.2 `StudentRegisterView` 主表课名同源
- [x] 2.3 CartDrawer / PendingRoundPreview 同源 hydrate / 课名

## 3. 种子

- [x] 3.1 `seedVolunteerSheetDemo` ME 行从课库生成
- [x] 3.2 `seedVolunteerResultSheetsDemo` released 行从课库生成

## 4. 学分初始态与胶囊（增量）

- [x] 4.1 ME 待分配裁至 COMP201 + SE201 + AI110（不超组帽，约差 1～2 门）
- [x] 4.2 结果页 released / releasedDemo 槽位与三门对齐
- [x] 4.3 确认胶囊：未满橙、刚好满绿；更新 proposal/design/spec
- [x] 4.4 勾选本节；自测顶栏与本轮表、无 10/6 超额

## 5. 本轮选课情况空态（增量）

- [x] 5.1 无行时仍展示标题/说明/表头；tbody 提示未选择课程
- [x] 5.2 i18n zh/en；更新 proposal/design/spec；勾选

## 6. GE 课库种子对齐 ME（增量）

- [x] 6.1 GE 演示课写入轮转 `schoolElectiveCategory`
- [x] 6.2 `seedVolunteerSheetDemo` GE 改 buildSelectedRowFromCatalog
- [x] 6.3 初始类帽未满留余量；更新提案；自测表=顶栏

## 7. 收尾

- [x] 7.1 勾选本 tasks；自测中/英切换下列表与本轮选课情况课名及时间一致
