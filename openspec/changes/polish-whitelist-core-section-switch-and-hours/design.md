## Decisions

1. **时长**：父项文案为「允许加退课/重修申请，申请时长为」+ number + `h`；独立 hours 块删除；仍写 `permissionHours.supplement`。
2. **未来必修**：
   - 数据：`allowFutureMandatory` + `futureMandatorySections: [{courseCode,sectionCode}]`；勾选必填至少一组。
   - UI：勾选留在右侧权限列；选组块下移，对齐「课程豁免先修课 *」（标签+星号+整行 tag+选择）。
3. **换组权限**：
   - `allowCoreSectionSwitchAdd` / `allowCoreSectionSwitchRetake` + sections[]
   - 清单来自白名单选课弹框：精确到课号+课程分组。
4. **选课器默认（CORE + 同课 dropLines）**：只许同组加回；白名单命中目标组可换组。
5. **退课破最低学分**：
   - 新 key：`allowDropBelowCreditMin`（不复用历史 `bypassCreditMin` UI 语义）。
   - 作用范围：**仅** `action === 'Drop'`。
   - 阈值：`resolveTermCreditMin(academicSession)`（长学期 12 / 短学期 4）；文案对外写「低于12学分」指长学期常规口径。
   - 无权限且退课后净学分 &lt; min → 提交失败；有权限 → 放行。
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
