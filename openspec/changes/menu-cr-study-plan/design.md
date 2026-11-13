## 背景

加退课申请已有「因修未修」矩阵与蓝底 tip（基线固定）。学术情况页用同一基线做类别汇总，并提供学年学期课程明细下钻。

## 目标 / 非目标

**目标：** 菜单「学术情况」→ 类别汇总 → 详情明细；必修/GE/ME 与申请基线一致。

**非目标：** 真接口、加退窗内嵌、老师端。

## 决策

1. 菜单 id：`crs-study-plan`；中文「学术情况」，英文 `Study Plan`
2. 页内两态：`summary`（图示1）/ `detail`（图示2）；面包屑可返回汇总
3. 打开汇总时用 `buildFixedSituationCatchUpFromBaseline` + `getProgrammeCreditProgress` 生成必修/GE/ME 已完成与未修；Pending 以负差额展示（如 `-4`）贴近图示1
4. 图示1 其余列（Common Core、Major Core、Industrial Training、Attempted、Min Required、Completion Rate、GE 文商子列等）demo 填表
5. 图示2 优先 `getStudentTranscript`；不足部分补 demo 行，课名优先课库/成绩单已有文案
6. 样式：汇总表绿标题条+深蓝表头+Pending 红字；明细表学期汇总浅黄、Fail 粉底
7. 明细页顶栏：标题「学术情况明细（Study Plan）」与「返回学术情况」同一行（左标题、右按钮）
8. 明细页学生信息条：6 字段横向等分、强制单行（过长 ellipsis + title），不换行
9. 图示1 纯 demo 列学分压到与申请侧同量级（通识核心约 6/-3、专业核心约 4/-6、工业训练约 0/-3）；`培养方案最低学分` 用培养方案必修+GE+ME 之和（约 114），不再用 150；已修读/已获总学分仍按各列求和
10. 图示1 Pending 行名中文为「因修未修学分」（英文 Catch-up credits），与申请 tip 口径一致
11. 图示2 学生信息条按内容分配列宽、去掉省略号缩写；短字段收紧、专业等长字段完整展示；仍单行，条外可横滑
