## 1. 数据

- [x] 1.1 扩展 `registrationLog.js` 的 `STUDENTS` / `log()`：写入 `programme`、`intake`、`isRetake`；若干 demo 行 `isRetake: true`

## 2. 界面

- [x] 2.1 `RegistrationLogView.vue`：表头与单元格增加专业、入学批次（`formatIntakeBatch`）、是否重修；更新 empty colspan

## 3. 导出

- [x] 3.1 `registrationLogExportFields` 增加三字段（列序与表一致）
- [x] 3.2 `formatRegistrationLogExportRow` 输出专业、格式化入学批次、是/否重修

## 4. 验收

- [x] 4.1 `npm run build` 通过
