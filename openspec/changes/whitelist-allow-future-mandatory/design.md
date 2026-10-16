## Decisions

1. **权限 key**：`allowFutureMandatory`；中文「允许添加未来学期必修课申请」。
2. **形态**：布尔权限，非邀请门；无课号清单、无 validUntil（对齐 `bypassCreditMin`）。
3. **生效**：`hasWhitelistAllowFutureMandatory(studentId)` → `entryHasActivePermission(..., 'allowFutureMandatory')`。
4. **加课池**：`getEligibleAddCoursesForStudent(studentId)` 在权限开启时纳入 seed 中 `futureSession && isMandatoryAddDropCourse` 的课；无权限仍 `continue`。
5. **Demo**：`course-phys101`（CORE）标 `futureSession: true`（替换原 ME `course-it102` 演示）。
6. **提示**：选课器加课 tip 在有权限时追加/切换为例外说明文案。
7. **校验**：保存时若仅勾该权限也可（更新 `permissionAnyRequired`）；勾选时若父项可加课未开，不强绑，但无 canAdd 时学生可能仍进不了加课申请——实现时勾选新权限不自动改父项（与先修豁免一致）。

## 影响文件

- `supplementListQueue.js`、`SupplementEntryDrawer.vue`
- `addDropEligibleCourses.js`
- `AddDropCoursePickerModal.vue` 或 tip 传参处
- `zh.js` / `en.js`
