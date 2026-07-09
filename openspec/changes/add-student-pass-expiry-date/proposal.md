# 学生签证有效期（Student Pass Expiry Date）

## 背景
China / International 学生需展示由 IO（International Office）维护的学生签证有效期，供学籍管理人员查询与导出；该字段非入学录入项，学籍侧只读展示。

## 变更内容
- `basicInfo.studentPassExpiryDate`：China / International 基本信息 Tab 只读展示（dd/mm/yyyy）
- 学生基本信息主表新增列
- 搜索区增加日期范围（From / To）筛选
- 导出（列表 + 全量字段）包含该列
- 转专业申请联动 `visaExpiryDate` 改读新字段（与 Passport Expiry 分离）

## 影响
- `src/data/students.js`、`src/data/programmeTransfers.js`
- `BasicInfoTab.vue`、`StudentProfileView.vue`
- `exportStudentProfileExcel.js`
- i18n
