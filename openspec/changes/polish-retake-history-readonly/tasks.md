## 1. 成绩单与映射

- [x] 1.1 在 `studentTranscript.js` 增加字母→中文等级映射与缺考文案
- [x] 1.2 改造为按课返回全部历史行，并生成 `previousCourseGradesText`；保留最新条供默认重修类型
- [x] 1.3 补强 demo：常用重修课多学期记录（含缺考示例），保证可选重修课有历史
- [x] 1.4 成绩匹配同时支持 retakeCourseId 与课号，避免选课后曾修成绩为空

## 2. 表单字段与校验

- [x] 2.1 `addDropFormSections.js`：增加 `previousCourseGradesText`；调整清空/默认；校验去掉成绩/学期/时间地点/教师手填必填，保留课、section、重修类型
- [x] 2.2 payload 写入 `previousCourseGradesText`，兼容旧字段

## 3. 表单与详情 UI

- [x] 3.1 `AddDropApplicationFormSections.vue`：合并曾修字段为只读 textarea；去掉课程分组下拉；时间地点/教师改只读置灰；更新 hint
- [x] 3.2 `AddDropApplicationDetailBody.vue`：展示曾修课程成绩；去掉分组行
- [x] 3.3 `StudentAddDropView.vue`：选课回填使用新历史字段

## 4. i18n

- [x] 4.1 中英文：曾修课程成绩文案、hint；去掉/调整分组与手填相关提示

## 5. 退课仅选修

- [x] 5.1 退课/关联退课选课列表排除 CORE 与 required
- [x] 5.2 选修行与课表 confirmed 同源（含 meetings 展示）

## 6. 重修关联抵扣计费

- [x] 6.1 `addDropFeeRates.js`：按退费抵免冲抵重算 billable 与 amount
- [x] 6.2 `StudentAddDropView` feeEstimate 与超出学分使用同源结果
- [x] 6.3 选重修弹窗传入退课学分与是否抵免；仅 billable>0 时提示

## 7. 选课 demo 时段错开

- [x] 7.1 重修可选课（COMP201/STAT201/ENGL201）约一半分组改到与课表选修不冲突的时段
- [x] 7.2 加课资格课（SCI110/FIN110 等）同步留一半不冲突分组

## 8. 重修类型默认不及格（增量）

- [x] 8.1 `RETAKE_TYPE_OPTIONS`：`failed` 置顶
- [x] 8.2 空表单 / 切到重修默认 `retakeType=failed`；编辑保留原值；下拉去掉请选择
- [x] 8.3 hint 文案不改；勾选本 tasks
