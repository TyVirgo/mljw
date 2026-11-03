## Decisions

1. 选课时间：主行 `academicSession` + `enabled`（''/on/off）；无次行则不显示收放。
2. 选课批次：主行学期/状态/名称/类型；次行专业模糊；有收放。
3. 选课结果课程维：主行批次/课号/课名/类型；次行分组模糊、学分；有收放。学生维改 `search-row` 流式，去掉 grid 占位。
4. 过滤：`listRoundCourseSummaries` / `listVolunteerCourseSummaries` 支持 `courseType`、`sectionCode`、`credits`。
