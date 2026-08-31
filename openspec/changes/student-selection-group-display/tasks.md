# 任务：student-selection-group-display

## 1. 数据层

- [x] 1.1 新建 `courseSelectionGroups.js`：解析批次组、按课号反查、行聚块排序、tone 索引
- [x] 1.2 在 `batch-2504-g1` 增加 demo `selectionGroups`（HUM201–HUM204，minPick: 3）

## 2. 学生主表 UI（A+C）

- [x] 2.1 `StudentRegisterView`：`sectionRows` 挂接组解析与排序；表头/单元格「课程组」列
- [x] 2.2 同组行 class（色条 + 浅底）；无组无样式
- [x] 2.3 i18n（zh/en）：列名、至少 M/共 N 门

## 3. 收尾

- [x] 3.1 `npm run build` 通过
- [x] 3.2 勾选本 tasks

## 4. Demo 补齐与展示 polish（增量）

- [x] 4.1 GE/ME × R1–R3 共 6 批各 3 组；命名「课程组名称01/02/03」
- [x] 4.2 列序：课程分组 → 课程组；tone 改为下标 % 2 固定两色交替
- [x] 4.3 build 通过；勾选本 tasks

## 5. 短色块 + 仅名称（增量）

- [x] 5.1 每批 3 组改为 2 选 1；成员课教学分组 ≤2（避开 COMP101/201/3192、ENGL201、MPU3183）
- [x] 5.2 去掉「至少 M / 共 N 门」；加深底色
- [x] 5.3 build 通过；勾选本 tasks

## 6. 配色与冲突 tip（增量）

- [x] 6.1 主表课程组：浅蓝 `#dbeafe` / 浅黄 `#fef9c3`；去掉左边色条
- [x] 6.2 本轮选课情况志愿冲突 `!` tip 改为向上展开
- [x] 6.3 build 通过；勾选本 tasks

## 7. GE 去掉课程组（增量）

- [x] 7.1 `StudentRegisterView`：`batchTypeTab === 'ME'` 才展示课程组列、底色与聚块
- [x] 7.2 删除 GE 三档批 `selectionGroups` demo 数据
- [x] 7.3 更新 proposal/design/spec；build 通过

## 8. 主表课级合并与按课程分页（增量）

- [x] 8.1 新建 `sectionTableRowSpans.js`：课级 rowspan、按课程分页、课级有余量/已满筛选
- [x] 8.2 `StudentRegisterView`：序号按课程计；同课列合并；列序学分→课程分组→课程组(ME)；页内纵向滚动
- [x] 8.3 ME 组内同课分组行相邻；无组块内按课号排序
- [x] 8.4 更新 proposal/design/spec；build 通过

## 9. 组名格式 / 备注列 / 组感知分页（增量）

- [x] 9.1 demo 组名 `Group{n}(Intake:2025/09~至今)`；4选3 / 3选2 / 2选1 各一组
- [x] 9.2 操作列前「备注」列（组级 rowspan + i18n 整句）
- [x] 9.3 组感知分页 `packPageUnits`；表格间距/nowrap 调整
- [x] 9.4 更新 proposal/design/spec；build 通过

## 10. 课程组两行 / 默认 50 门课 / ME 校选类型（增量）

- [x] 10.1 课程组列两行：`Group{n}` + `(Intake:…~至今/Present)`
- [x] 10.2 在线选课默认 `pageSize=50`（按课程数）
- [x] 10.3 ME 校选类型：`resolveSchoolElectiveCategory` 统一展示；补 SE201/WEB220 课库 + 志愿 seed
- [x] 10.4 更新 proposal/design/spec；build 通过

## 11. 课程组列宽 / 合成时段不重叠（增量）

- [x] 11.1 课程组列加宽、intake nowrap、Group 居中；任课教师列略收窄
- [x] 11.2 `synthesizeDemoMeetings` 同周几不重叠；AI101 显式 meetings
- [x] 11.3 更新 proposal/design/spec；build 通过

## 12. 待开放预览已选=0 / 表头不换行（增量）

- [x] 12.1 `StudentPendingRoundPreviewPanel`：容量 `0/容量`；筛选语义
- [x] 12.2 主表/预览表 th nowrap + 容量列 min-width
- [x] 12.3 更新 proposal/design/spec；build 通过
