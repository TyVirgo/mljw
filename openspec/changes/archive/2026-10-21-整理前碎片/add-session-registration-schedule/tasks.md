# 任务：add-session-registration-schedule

## 1. 数据与解析

- [x] 1.1 新增 `sessionRegistrationSchedules.js`：学期全局 CRUD、单位覆盖 CRUD、demo 种子
- [x] 1.2 实现 `resolveEffectiveAudienceRounds` / `resolveEffectiveRound1Quota` / `resolveEffectiveAddDropWindow`
- [x] 1.3 更新 `addDropApplicationWindow.js` 与轮次消费方改走解析函数

## 2. 选课时间配置页

- [x] 2.1 菜单 `cr-schedule` + i18n；`App.vue` 挂载视图
- [x] 2.2 `RegistrationScheduleView`：筛选、列表、新增/删除
- [x] 2.3 全局编辑抽屉（时间链 + 公布 + r/ME + 加退课，必填）
- [x] 2.4 单位批次时间列表与编辑/新增/删除

## 3. 批次侧收敛

- [x] 3.1 去掉「管理轮次」入口与相关抽屉调用
- [x] 3.2 批次表单去掉加退课窗；列表时间列用生效解析
- [x] 3.3 demo：学期全局为主，批上残留仅作 fallback；可选一条覆盖样例

## 4. ME 灵活入学学期占比

- [x] 4.1 `batchRound1Quota`：`meQuotaRows`（intake 多学期 + special）；分配与校验 API；去掉按年逻辑
- [x] 4.2 `SessionScheduleEditDrawer` ME 表 UI：年/学期双下拉、多 chip、特殊学生行
- [x] 4.3 `layoutMeRound1Roster` 按新桶 + 特殊名单优先；demo/i18n

## 5. 列表列重组

- [x] 5.1 时间配置主表：R1/R2/R3 双受众 + 结果公布 + 加退课；去掉老生 R1、覆盖批次数
- [x] 5.2 批次主表去掉四轮时间列；`AudienceRoundDualCell`；导出字段同步
- [x] 5.3 更新 proposal/design/spec；勾选本 tasks

## 6. 单位批次时间设置

- [x] 6.1 `unitScheduleOverrides` 替代批次覆盖；单位 > 学期解析；demo OSA
- [x] 6.2 `UnitPickModal` + `UnitScheduleOverridePanel`；列表 R1/R2/R3 双受众
- [x] 6.3 `SessionScheduleEditDrawer` mode=unit；加退课与学年学期同排
- [x] 6.4 i18n；更新 proposal/design/spec/tasks

## 7. 主表增强

- [x] 7.1 同学期唯一：新增过滤已占用学年学期；保存校验
- [x] 7.2 demo 9 行（2026/2025/2024 各 02/04/09）；补 2026/09 选项
- [x] 7.3 `enabled` 开关列；关闭时学期与单位覆盖均不生效；默认开启
- [x] 7.4 主表紧凑展示 + 操作列冻结

## 8. ME 批次名额占比表单

- [x] 8.1 批次类型默认「请选择」；ME 第 3 节 `MeQuotaRowsEditor`（新建/编辑）
- [x] 8.2 special 行固定、改文案、去「+ 特殊学生行」；入学学期按钮「+ 新增」
- [x] 8.3 `totalCap` + 行 `count`；占比/名额数/总数联动；校验 100% 与合计
- [x] 8.4 学期全局仅 GE `decayR`；`resolveEffectiveRound1Quota` 拆分来源

## 9. R3 名额互释生效时间

- [x] 9.1 `crossReleaseAt` 写入学期全局 / 单位覆盖 CRUD + demo 种子；`resolveEffectiveCrossReleaseAt`
- [x] 9.2 学期/单位编辑抽屉：Tab 外共用字段；结果公布仍老生专属
- [x] 9.3 选课时间主表 + 单位覆盖表增加「R3 名额互释」列；i18n
- [x] 9.4 `isCrossAudienceReleaseActive`；学生端名额/筛选改走该判定；批次规则勾选旁提示继承日历
- [x] 9.5 更新 proposal/design/spec；勾选本 tasks

## 10. 单位覆盖区分 GE/ME

- [x] 10.1 `unitScheduleOverrides` 增加 `courseType`；唯一键含类型；demo 补 GE/ME 样例
- [x] 10.2 `get/upsert/remove` 与 `resolveEffectiveAudienceRounds` / `crossReleaseAt` 按批次类型匹配
- [x] 10.3 `UnitPickModal` 必选课程类型；列表加列；置灰按单位+类型
- [x] 10.4 i18n；更新 proposal/design/spec；勾选本 tasks

## 11. UnitPickModal 样式对齐

- [x] 11.1 弹窗壳改为 header/body/footer 分区；按钮与圆角对齐特殊学生新增弹窗
- [x] 11.2 更新 proposal；勾选本 tasks
