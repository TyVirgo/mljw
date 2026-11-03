## Decisions

1. **时长**：父项文案为「允许加退课/重修申请，申请时长为」+ number + **`小时`**（非 `h`）；独立 hours 块删除；仍写 `permissionHours.supplement`。
2. **未来必修**：
   - 数据：`allowFutureMandatory` + `futureMandatorySections: [{courseCode,sectionCode}]`；勾选必填至少一组。
   - UI：勾选留在右侧权限列；选组块下移，对齐「课程豁免先修课 *」（标签+星号+整行 tag+选择）。
3. **换组权限**：
   - **仅** `allowCoreSectionSwitchAdd` + sections[]（可加课下配置）。
   - `allowCoreSectionSwitchRetake`：UI 不再展示；新保存不写入；学生端 `kind==='retake'` 恒返回空清单（旧数据忽略）。
4. **选课器默认（CORE + 同课 dropLines）**：只许同组加回；白名单命中目标组可换组（仅加课侧）。
5. **退课破最低学分**：
   - key：`allowDropBelowCreditMin`；附加 **`minCredits`（X）**，交互对齐 `bypassCreditMax.extraCredits`。
   - 作用范围：**仅** `action === 'Drop'`。
   - 未勾选：净学分 ≥ `resolveTermCreditMin`（长学期 12）。
   - 勾选：净学分 ≥ X；X 取值 **0–11**，默认 **0**（接近原「勾选后完全放行」）。
   - 文案：「退课允许低于12学分，学分最低为 [X] 分」。
6. **选组弹框**：`WhitelistCoursePickModal` `selectionUnit: 'section'`，可筛 CORE；footer 按钮自带样式。
7. **选修额度文案**：删除 GE 大课程组说明；GE/ME 为「允许选择」+ 数字 +「学分」；ME 类别标题为「ME 课程组允许选择类别」。
8. **选组表合并（方案 A）**：按课分页；勾选一门课 = 该课全部教学班 ref；hint 按已选门数。未来必修与换组弹框共用。
9. **选组表对齐**：改真 `rowspan`（勾选/课号/名称/学分课级合并；分组/教师/时间每组一行），对齐加课选课器，避免堆叠伪分行错位。
10. **纯加课原组**：资格种子补 `originalSectionCode` + `originalAcademicSession`；选课器在无 dropLines 时用种子原组做同组锁（对齐重修）。
11. **原上课学期 demo**：加课必修池所有行必须有学期值；未来学期必修填计划开课学期。

## Risks

- [与旧 same-section spec 冲突] → 本 change 明确覆盖。
- [旧 bypassCreditMin 种子数据] → 保留数据兼容；新权限独立；表单不再用 bypassCreditMin 勾选位。
- [部分组已在清单] → 课程勾选态以「该课全部分组均已选」为准；勾选后补齐全部组。
- [旧 allowCoreSectionSwitchRetake] → 学生端忽略；教务再保存时不再写出该键。
- [旧 allowDropBelow 无 minCredits] → 读缺省为 0，行为等同原完全放行。

## Incremental decisions (student-first / empty = all picker rows)

12. **先选学生**：仅新增模式；`selectedStudents.length === 0` 时权限区（含子项数字、选课）全部 disabled；保存仍校验必选学生。
13. **换组弹框范围**：按已选学生 `programme` 过滤课库（`courseMatchesStudentProgramme`）；多生时取并集（任一学生专业可匹配即出现在弹框）。
14. **空清单语义**：勾选换组且 `sections=[]` → 运行时对该生 **allow-all**（不拦异组）；与无换组权限区分需独立 `allowAll` 判断（不可把「无权限的 []」当成全开）。
15. **全选**：弹框增加「全选当前结果」（`filteredBlocks` 全部课+组，非仅本页）；本页勾选保留。
16. **「全部」定义**：符合当前已选学生过滤后的弹框数据行，不是未过滤的全课库。
