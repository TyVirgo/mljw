# 设计：align-selected-course-display-with-catalog

## Context

选课列表：`selectableCourses` → `enrichSectionScheduleFields`。  
已选/志愿：`studentVolunteerSheet` / `myRegistrationList` 存 snapshot，面板直接读行内字段。

课库对齐后 COMP201 等学分变大，原五门 ME 志愿使「3选2」学期已选 10 > required 6。

## Approach

1. **`resolveSelectedCourseDisplay.js`**
   - `resolveCatalogCourseSection` / `hydrateSelectedCourseDisplay` / `buildSelectedRowFromCatalog`
   - 课名：`getCourseLocalizedName`（教学简介双语 → 课库 name）

2. **展示接线**
   - RoundStatusPanel / CartDrawer / 我的选课 / 主表课名同源
   - 胶囊 `creditCapsuleTone`：`current < max` → 橙（未满）；`current >= max` → 绿（刚好满）；初始态保证不出现超额

3. **种子（学分初始态）**
   - ME 待分配：保留 **COMP201（4选3）+ SE201 + AI110（3选2）**，去掉 NET110 / WEB220
   - 学期组期望：4选3 **4/8**（差约 1 门）、3选2 **6/6**（刚好满绿）、2选1 **0/4**；学期 ME **10/22**
   - 结果页 released 快照槽位与上述三门对齐
   - 列表 `checkTermCategoryCreditCapForCourse` 继续拦截再选会超组帽的课

4. **空态（增量）**
   - `StudentRegistrationRoundStatusPanel`：无行时仍渲染标题 + R1 说明 + 表头；tbody 一行提示「未选择课程」

5. **GE 课库种子（增量）**
   - GE 待分配改为 `buildSelectedRowFromCatalog(course-hum-demo-1…4)`（课库已有 HUM 演示课）
   - `buildActiveBatchDemoCourses` 为 GE 轮转写入 `schoolElectiveCategory`（商→AI→文→理）
   - 期望学期类帽：商 **2/5**、AI **3/4**、文 **4/5**、理 **2/4**（均未满）；总分 **11/18**
   - 根因：原先种子手写学分与课库不一致，表 hydrate 用课库、顶栏吃种子 → 对不上

## Decisions

| 点 | 决定 |
|----|------|
| 课名语言 | 跟 UI 语言切换，与列表同源 |
| 初始余量 | 约差 1～2 门课，不超任何学期组/类型帽 |
| 胶囊色 | 未满橙、刚好满绿；不以超额为 demo 常态 |

## Risks

- 裁志愿后门数减少，互撞 tip demo 可能变弱（当前三门时段不互撞）；若需互撞另补时段，本增量不强制。
