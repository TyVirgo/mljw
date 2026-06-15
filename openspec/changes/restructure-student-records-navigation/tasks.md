## 1. i18n 菜单与 Tab 文案

- [x] 1.1 更新 `zh.js` / `en.js`：新增 3 分组 + 9 二级菜单 key；`menu.srStudentBasicInfo`（学生基本信息）；移除侧边栏对 `srFamilyInfo` 的引用
- [x] 1.2 新增 `movementApplication.tabs.*` 或复用现有四异动 menu key 作为 Tab 标签
- [x] 1.3 更新 `zh-flat.js`：如有新增 flat 映射则同步（无新增 flat 文案，跳过）

## 2. 菜单配置

- [x] 2.1 重写 `studentRecordsMenu.js`：3 个 `children` 分组结构；新增 `sr-movement-*`、`sr-personal-curriculum` pageId
- [x] 2.2 更新 `studentRecordsDevelopedPages`：`sr-student-profile`、`sr-movement-application`
- [x] 2.3 移除 `sr-family-info`、`sr-programme-transfer`、`sr-deferment`、`sr-resumption`、`sr-withdrawal` 独立 sidebar 项

## 3. Tab 壳层组件

- [x] 3.1 创建 `StudentMovementApplicationView.vue`：水平 Tab 条 + 四 Tab 切换
- [x] 3.2 嵌入 `ProgrammeTransferView`、`DefermentView`、`ResumptionView`、`WithdrawalView`（`v-show` 保持状态）
- [x] 3.3 默认 Tab = `deferment`；Tab 激活态样式（下划线，对齐图2）
- [x] 3.4 （可选）为四 View 增加 `embedded` prop，微调 Tab 内 padding/高度（通过壳层 `:deep()` 微调，未改四 View）

## 4. App 壳层集成

- [x] 4.1 更新 `App.vue`：注册 `StudentMovementApplicationView`；移除四异动独立 `v-if` 分支
- [x] 4.2 传入 Sidebar `defaultExpandedGroups`：`['sr-mgmt-group', 'sr-movement-group', 'sr-study-plan-group']`
- [x] 4.3 确认 `UnderConstructionView` 对未开发二级菜单正常工作；Back 仍回 `sr-student-profile`

## 5. 面包屑与 Sidebar 行为

- [x] 5.1 验证分组菜单 expand/collapse、子项 active 高亮与 Basic Data 一致
- [x] 5.2 验证面包屑：`学籍管理 > 学生基本信息`、`学籍异动 > 学籍异动申请`（`buildStudentRecordsBreadcrumbKeys` 定制）

## 6. 验证

- [x] 6.1 冒烟：门户进入 → 默认学生基本信息；侧边栏无 Family Info / 无四异动独立项
- [x] 6.2 冒烟：学籍异动申请 → 四 Tab 切换；各 Tab 内 Create/Edit/Approve/Cancel/流转日志仍可用
- [x] 6.3 冒烟：异动类别等未开发项 → 建设中页；中/英切换
- [x] 6.4 `npm run build` 通过

## 7. OpenSpec 文档同步（可选后续）

- [ ] 7.1 归档或 `/opsx-sync` 时更新各 `add-*-app` 中 `student-records-app` delta：导航改为 Tab 入口
