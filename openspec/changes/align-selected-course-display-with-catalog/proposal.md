# 变更：align-selected-course-display-with-catalog

## Why

「本轮选课情况 / 已提交志愿」与选课列表读的不是同一数据源：列表用课库 `selectableCourses` 实时分组，已选侧用志愿种子手写 snapshot（课名、学分、教师、周次、上课时间可漂移）。例如 COMP201 列表为 Data Structures / Dr. Tan / Tue 12:00，已选却显示「数据结构」/ 陈博士 / Wed 14:00。课名语言也不一致。

对齐课库学分后，ME 志愿 demo 五门合计 18 学分，课程组「3选2」学期帽出现 **10/6**（已超上限），与「提交前会超学分则置灰」矛盾，也不该作为初始态。

## What Changes

- **A. 展示期回填**：有 `courseId`+`sectionId`（或可解析的课号+分组）时，课名/学分/教师/周次/上课时间从课库分组解析；snapshot 仅兜底。
- **B. 种子查库**：`seedVolunteerSheetDemo`（及结果页志愿快照 demo）按课库 section 生成行，不再手填与课库矛盾的展示字段。
- **课名跟语言切换**：选课列表与已选/志愿展示共用同一课名解析（教学简介双语优先，否则课库 `name`）；中文界面显示中文课名，英文界面显示英文课名，两边始终一致。
- **增量 · 学分初始态与胶囊色**：ME 待分配 demo 初始不得超学期类型/课程组学分帽；宜仍差约 **1～2 门**课可选。顶栏学分与本轮表同源增减。胶囊：未满橙色、刚好满绿色；**必须NOT** 以超额为初始展示态（列表提交前会超则置灰）。
- **增量 · 本轮选课情况空态**：GE/ME 尚无志愿/已选（或已全部退选）时，**必须**仍展示「本轮选课情况」标题、说明与表头；表格数据区仅提示未选择课程，**必须NOT** 整块隐藏该区域。
- **增量 · GE 对齐 ME**：GE 待分配改为课库 `buildSelectedRowFromCatalog(course-hum-demo-*)`（不再手写与课库矛盾的学分）；GE 演示课写入轮转校选类别；初始文/商/理/AI 均未满留余量；本轮表与顶栏胶囊同源。

## Non-goals

- 不改抽签/占座/写库业务语义；写入仍可保留 id + 快照，展示再解析
- 不新建菜单页
- 不接真实课库 API
- 不改学期帽数值本身（仍 4选3=8 / 3选2=6 / 2选1=4 / 普通=4，meMax=22）

## Capabilities

### New Capabilities

- `selected-course-display`：已选/志愿展示与课库及界面语言对齐；学分初始态不超帽

### Modified Capabilities

- （无主库已归档条目；以本 change 规格为准。）

## Impact

- `resolveSelectedCourseDisplay.js`、`courseTeachingBrief.js`
- `StudentRegistrationRoundStatusPanel.vue`、`StudentRegisterView.vue`（列表课名、胶囊色）
- `studentVolunteerSheet.js` 种子；CartDrawer 同源回填
- OpenSpec 本 change
