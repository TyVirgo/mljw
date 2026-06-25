## 1. Mock 当前学生

- [x] 1.1 创建 `src/data/mockCurrentStudent.js`：`getCurrentStudent()`、`MOCK_CURRENT_STUDENT_ID`（选用 seed 中有申请记录的学生）
- [x] 1.2 确认 mock 学生在 `initialStudents` 中存在且四 Tab store 有对应申请便于冒烟

## 2. StudentSelectModal

- [x] 2.1 创建 `StudentSelectModal.vue`（参考 `CourseSelectModal.vue`）
- [x] 2.2 搜索：学号 / 姓名 / 中文名 keyword 过滤
- [x] 2.3 表格列：学号、姓名；单选 + Confirm/Cancel
- [x] 2.4 集成分页 `TablePagination`，默认 pageSize 10
- [x] 2.5 i18n：`studentSelect.*`（zh / en）

## 3. 菜单、路由、i18n

- [x] 3.1 `studentRecordsMenu.js`：`sr-movement-application-teacher`、`sr-movement-application-student` 替换原 `sr-movement-application`
- [x] 3.2 `studentRecordsDevelopedPages` 注册两个新 pageId
- [x] 3.3 `App.vue`：双 `v-else-if` 渲染 `StudentMovementApplicationView`，分别传 `applicant-mode="teacher"` / `"student"`
- [x] 3.4 i18n：`menu.srMovementApplicationTeacher`、`menu.srMovementApplicationStudent`（zh / en）
- [x] 3.5 面包屑：`buildStudentRecordsBreadcrumbKeys` 对新 pageId 正常

## 4. 壳层与列表 View

- [x] 4.1 `StudentMovementApplicationView.vue`：接收 `applicantMode` prop，透传四 embedded View
- [x] 4.2 `ProgrammeTransferView.vue`：prop `applicantMode`；student 模式列表按 `getCurrentStudent().studentId` 过滤
- [x] 4.3 `DefermentView.vue`：同上
- [x] 4.4 `ResumptionView.vue`：同上
- [x] 4.5 `WithdrawalView.vue`：同上
- [x] 4.6 四 View 向 FormModal 透传 `applicantMode`

## 5. FormModal Section I（四异动）

- [x] 5.1 `ProgrammeTransferFormModal.vue`：teacher create 用 StudentSelectModal；student create 自动填充只读；draft 身份锁定
- [x] 5.2 `DefermentFormModal.vue`：同上
- [x] 5.3 `ResumptionFormModal.vue`：同上
- [x] 5.4 `WithdrawalFormModal.vue`：同上
- [x] 5.5 移除四 modal 的 `studentFilter` + 原生 `<select>` 双控件

## 6. 验证（首版双入口）

- [x] 6.1 冒烟：老师菜单 → 四 Tab 全量列表；新增打开选择器，搜索分页选学生，Section I 联动
- [x] 6.2 冒烟：学生菜单 → 四 Tab 仅本人列表；新增 Section I 自动填充不可改
- [x] 6.3 冒烟：老师/学生 Draft 编辑 — Section I 只读，业务字段与新增可编辑范围一致
- [x] 6.4 冒烟：Submit / Cancel / Workflow Log / Details 等 6 态流程未破坏
- [x] 6.5 中/英菜单与选择器文案
- [x] 6.6 `npm run build` 通过

## 7. 列表增强搜索（movementApplicationSearch）

- [x] 7.1 创建 `src/data/movementApplicationSearch.js`：`createEmptyApplicationSearch`、`filterMovementApplications`、implemented 选项
- [x] 7.2 复用 `extractApplicationSession`、`extractCurrentProgrammeCode`、`normalizeQueueItem` 推导 implemented
- [x] 7.3 各类型 status 选项含 Draft（非 query 排除 Draft 口径）

## 8. 搜索 UI（四 View × 老师/学生）

- [x] 8.1 引入 `list-page-search.css`（四 View 按需）
- [x] 8.2 双行搜索 + 收起（默认展开次行）；首行：老师含学号或姓名，学生隐藏
- [x] 8.3 次行：是否实施下拉
- [x] 8.4 （可选）抽 `MovementApplicationSearchBar.vue` 减少重复

## 9. 四 View 列表过滤与列

- [x] 9.1 `ProgrammeTransferView`：接入新 search；**移除**进行中/已归档 Tab；单列表含终态
- [x] 9.2 `DefermentView`：接入新 search
- [x] 9.3 `ResumptionView`：接入新 search
- [x] 9.4 `WithdrawalView`：接入新 search
- [x] 9.5 四 View：学生端隐藏学号/姓名列；动态 empty colspan

## 10. i18n 与验证

- [x] 10.1 搜索 label（专业代码等）zh / en，优先复用 query/maintenance key
- [x] 10.2 冒烟：老师四 Tab — 新过滤 + 学号姓名列 + 转专业无 Tab 全量
- [x] 10.3 冒烟：学生四 Tab — 无学号姓名搜索与列；过滤仍仅本人
- [x] 10.4 `npm run build` 通过

## 11. 表单 Section I 分框与只读置灰

- [x] 11.1 四 `*FormModal.vue`：删除 `selectedStudentDisplay`；学号框仅 `form.studentId`
- [x] 11.2 四 modal：学号 + 姓名 **同一行两列**；学号列内保留 teacher「选择」按钮；去掉学号 `span-2`
- [x] 11.3 统一只读置灰样式（Section I + Current Programme 等快照字段）；可选抽 `movement-form.css`
- [x] 11.4 冒烟：老师选学生 → 学号/姓名分两框；学生新增 → 两框自动填充且置灰
- [x] 11.5 冒烟：四异动 Section II 可编辑字段仍为白底，与只读对比清晰

## 12. 移除模拟过期

- [x] 12.1 `ProgrammeTransferView.vue`：删「模拟过期」按钮、`requestExpire`、`canSimulateExpire`、相关 confirm 逻辑
- [x] 12.2 `programmeTransfers.js`：删除 `expireApplication` 函数
- [x] 12.3 i18n：删除 `simulateExpire`、`expireOne`（若无其他引用）
- [x] 12.4 `npm run build` 通过

## 13. 选择按钮移至学号+姓名行末

- [x] 13.1 更新 `movement-form.css`：`.student-picker-row` 支持 `1fr 1fr auto` 三列；student 模式两列
- [x] 13.2 四 `*FormModal.vue`：首行改为 `span-2` + 学号/姓名/选择三格布局（teacher create 显示选择）
- [x] 13.3 冒烟：老师新增 — 选择按钮在学号与姓名**右侧**；学生新增 — 无选择按钮

## 14. Section I 申请学年学期

- [x] 14.1 新增 `getCurrentApplicationSession()`（基于 `semesterInfo` 当前学期 + `formatAcademicSession`）
- [x] 14.2 四异动 data：`createEmpty*` 写入 `applicationSession`；`prepareDraftPayload` / submit 确保持久化
- [x] 14.3 四 `*FormModal.vue`：Section I 末增加只读「申请学年学期」字段
- [x] 14.4 四 `*DetailModal.vue`：Section I 末增加同 label、同 `YYYY/MM` 格式展示
- [x] 14.5 i18n：`movementCommon.fields.applicationAcademicSession`（zh: 申请学年学期 / en）；可选对齐列表列 label
- [x] 14.6 （可选）补全 seed 记录 `applicationSession`，减少列表 extract 回退

## 15. 验证

- [x] 15.1 冒烟：四异动 create — Section I 末显示当前学期（如 `2025/09`）且置灰
- [x] 15.2 冒烟：Draft 编辑 — 申请学年学期不变；Detail / 审批 View 与表单格式一致
- [x] 15.3 冒烟：维护/查询列表 `applicationSession` 列与新记录格式一致
- [x] 15.4 `npm run build` 通过

## 16. 申请学年学期 — 选学生后 intake

- [x] 16.1 `movementApplicationSession.js`：新增 `resolveApplicationSessionFromStudent(student)`
- [x] 16.2 四 Tab `createEmpty*`：`applicationSession: ''`（移除 create 时 `getCurrentApplicationSession()`）
- [x] 16.3 四 Tab `buildStudentSnapshotFromProfile`：选学生后写入 `applicationSession = intake`
- [x] 16.4 四 `*FormModal.vue`：未绑学生时 Section I 末字段显示 `—`
- [x] 16.5 冒烟：老师 create — 未选学生为空 → 选学生后显示 intake；学生 create 自动带出 + `npm run build`

## 17. §17 学生选择器 — 专业、学院列

- [x] 17.1 `StudentSelectModal.vue`：normalize 增加 programme/faculty；表格增两列；colspan 与弹窗宽度
- [x] 17.2 i18n：`studentSelect.columns.programme`、`faculty`（zh / en）
- [x] 17.3 冒烟：四异动老师新增 — 选择器可见专业/学院；选学生后 Section I 联动不变
- [x] 17.4 `npm run build` 通过

## 23. §23 搜索按钮样式 + 管理端菜单改名

- [x] 23.1 `movement-application-list-filters/spec.md` §23：查询/重置与异动类别同款按钮
- [x] 23.2 `movement-application-shell/spec.md` + `student-records-app/spec.md`：管理端菜单文案
- [x] 23.3 `list-page-search.css`：`.search-bar .btn` / `.btn-primary` / `.btn-default`
- [x] 23.4 `zh.js` / `en.js`：`menu.srMovementApplicationTeacher` → 管理端 / Management
- [x] 23.5 冒烟：管理端+学生端四 Tab 搜索钮样式；侧边栏与面包屑文案；`npm run build` 通过
