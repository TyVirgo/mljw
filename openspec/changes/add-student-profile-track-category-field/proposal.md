# 学生基本信息增加学籍类型字段

## 背景
学生档案 `enrollment.trackCategory` 已由异动实施回写，但列表、详情与编辑表单未展示。产品要求在不扩充现有学籍状态枚举的前提下，为每种已有状态提供对应的学籍类型（Track Category）下拉选项。

## 变更内容
- 列表在「学籍状态」列右侧增加「学籍类型」列（**不**增加搜索筛选）
- Enrollment Tab：学籍状态下拉后增加学籍类型下拉；选项随所选状态联动（映射表对齐异动类别配置参考表，仅覆盖现有 5 种状态）
- 详情只读同步展示；导出列同步
- 保持 `studentStatusOptions` 仍为 Active / Inactive / Deferred / Withdrawn / Graduated

### 现有状态 → 参考表映射
| 档案状态 | 参考学籍状态 | 允许学籍类型 |
|----------|--------------|--------------|
| Active | Active | Normal、Programme Transfer、Inbound/Outbound Mobility、IEP、Completion without Graduation* |
| Inactive | — | Normal |
| Deferred | Deferment | Normal、Programme Transfer、Inbound Mobility、IEP、Completion without Graduation* |
| Withdrawn | Withdrawal | Normal、Programme Transfer、Inbound Mobility、IEP |
| Graduated | Graduated | Normal、Programme Transfer、Completion without Graduation* |

## 影响
- `students.js`、`EnrollmentTab.vue`、`StudentProfileView.vue`
- `studentProfileFieldLabels.js`、`exportStudentProfileExcel.js`
- mock `initialStudents` 补全 `trackCategory`
