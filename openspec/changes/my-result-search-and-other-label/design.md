## Decisions

1. 主行：课名、课号、学期、学分、分组 + 查询/重置/收放；次行：教师、起止周、上课星期、提交时间。
2. 起止周：与行 `weekRange` 解析出的 [a,b] 有交集即命中；只填一端则按该端边界。
3. 提交时间：`type=date`，与 `selectedAt`（DD/MM/YYYY …）比日期部分。
4. 上课星期：Mon–Sun 单选，匹配 timeVenueText / 中英星期文案。
5. other 文案统一为「申请和添加课程」。
