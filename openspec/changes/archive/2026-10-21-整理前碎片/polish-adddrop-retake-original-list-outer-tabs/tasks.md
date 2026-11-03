## 1. i18n 与成绩文案

- [x] 1.1 增加不及格/允许重修课程标题键、学年学期/成绩列键；两侧标题均带星号展示
- [x] 1.2 多行成绩格式改为 `学年学期：成绩`（可复用或扩展 formatPreviousCourseGradesText）

## 2. 原课程表与退课学分

- [x] 2.1 退课四学分改为 fields-row-4
- [x] 2.2 原课程表：课程类型列、合并学年学期/成绩多行、加宽操作列；标题随 retakeType
- [x] 2.3 外层必修/公选/专选 Tab 过滤原课列表（叠加 retakeType 池）

## 3. 重修弹框去 Tab

- [x] 3.1 重修模式隐藏类别 Tab；按 retakeFocusOriginal 锁定类型；加课 Tab 不变
