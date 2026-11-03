## 1. 数据层

- [x] 1.1 新增 `listRoundSectionSummaries`：课级摘要展平为分组行，挂 `course`/`section`/`selectionGroup`
- [x] 1.2 无 sections 的课合成默认分组；保留 `listRoundCourseSummaries` 供 R1 聚合

## 2. 只读老生配额弹窗

- [x] 2.1 `MeQuotaRowsEditor` 增加 `readonly`：隐藏新增/删除/操作列，禁用编辑
- [x] 2.2 新增 `MeSeniorQuotaReadonlyModal`：标题+课信息+Editor+空配置提示
- [x] 2.3 i18n：弹窗标题、空配置提示（zh/en）

## 3. 结果页 R2/R3 / R1

- [x] 3.1 R2/R3 改用分组行 + `paginateSectionRowsByCourse`；列：课程分组；ME 另加课程组
- [x] 3.2 ME 老生容量已选/R1 老生容量可点打开只读弹窗；GE 保持纯文本
- [x] 3.3 勾选/全选按课 id 去重；空表 colspan 随列数调整
- [x] 3.4 勾选 tasks.md 完成项（不自动 git commit）
