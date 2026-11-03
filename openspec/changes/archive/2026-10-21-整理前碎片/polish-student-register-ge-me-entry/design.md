# 设计：polish-student-register-ge-me-entry

## Context

- `StudentRegisterView`：目录 GE/ME → 列表；曾用批次/轮次下拉 + 课程库芯片 + 双层进度条
- 评审：入口后不应再「选」轮次；顶栏应与「返回目录」同行，腾出空间给筛选与课表

## Decisions

1. **同页两步入口（A2）**  
   - `entryStep: 'catalog' | 'list'`  
   - 目录两卡 → 当前开放批 → list；可返回目录  
   - **不**恢复页内 GE/ME Tab

2. **当前开放批（A2，修订）**  
   - 目录卡默认当前开放批；同类型多开放批用下拉切换后再进入  
   - 无开放批仍进列表只读 + callout；列表内不提供切批

3. **轮次与批次只读（A1，修订）**  
   - 进入列表后 `selectedRound` 锁定为当前开放轮  
   - UI：**不展示下拉**；同行文案 `批次名 · {轮次名} {起止}`  
   - 无开放轮：文案仍展示默认/关闭态，操作禁用

4. **按类型数字进度 + 胶囊（方案 B，§15 修订）**  
   - GE 批：GE 总分 + 文/商/理（要求之和对齐 geMax）  
   - ME 批：ME 总分 + 文/商/理（要求之和对齐 meMax；字段名可仍为 termGeCategories）  
   - 颜色胶囊：未满 / 达标 / 超额；去掉进度条与课程库芯片  
   - 目录「选课说明」随选中批当前开放轮切换小字文案；「进入选课」用主按钮

5. **列表顶栏单行布局**  
   ```
   [返回目录]  批次名 · 第二轮 …
               [GE 3/12] | [文] [商] [理]                  ← GE 批
               [ME 6/16] | [文] [商] [理]   [课程一览]      ← ME 批
   ```

6. **数据**  
   - 类别与帽均为原型 demo  
   - ME：`termGeCategories`；GE：`termGeElectiveCategories`（对齐 geMax）

7. **入口关态（§15，§17 修订）**  
   - `isOpen` / 徽章 / CTA / 列表可否提交：只认该批 `getStudentCurrentOpenRoundKey`（`demoActiveRound` 且未列入 `demoClosedRounds`）  
   - 无开放轮 = 已结束：徽章「已结束」；CTA disabled；提示仍按展示轮 key（`preselect`/`main` → 等待下一轮；`supplement` → 此批次已结束）  
   - 轮次 `start`/`end` 只做文案与（未过期时）倒计时装饰，**不得**把 demo 进行中批判为关窗  
   - 已结束不能选课（与入口置灰统一）；列表若切到关窗批 → 只读 +「不在选课时间段内」

8. **入口 CTA 文案与默认批（§16）**  
   - 截止提示作为置灰按钮标签（替换「进入选课」），不另起一行  
   - 同类型批次列表：进行中批排前；默认选中优先进行中；已结束批仍可下拉选择

9. **学生端轮次 demo 矩阵（§17，§18 修订）**  
   - **按学生 `programmeCode` 过滤**：目录/列表同类型下拉只含命中本专业的 `active` 批（`batch.programme` 或 `scopeRules[].programmes`）  
   - 同专业 GE/ME 各 **三条** demo 批（命名含专业码，如 SWE）：  
     - (I) `demoActiveRound=preselect`，`demoClosedRounds=[]` → 轴：进行中 / 待开放 / 待开放  
     - (II) `demoActiveRound=main`，`demoClosedRounds=[preselect]` → 已结束 / 进行中 / 待开放  
     - (III) `demoActiveRound=supplement`，`demoClosedRounds=[preselect,main]` → 已结束 / 已结束 / 进行中  
   - 三轮均配置展示用 `start`/`end`；**不**用 `Date.now()` 判定开闭或倒计时  
   - 其他专业批可保留供管理端/预览，学生端不可见

10. **入口卡时间轴与 CTA（§18）**  
    - 无卡片级「进行中/已结束」徽章  
    - 去掉「选课轮次截止时间」行与「选课轮次」下拉  
    - 纵向时间轴固定展示三轮；状态胶囊挂在轮次行：绿=进行中、灰=已结束、蓝/浅=待开放  
    - 「进入选课」仅出现在进行中那一行最右侧；点击进入该批列表并锁定该开放轮  
    - 毕业学分行在本学期学分之上：样式同构（总分 + 文/商/理）

11. **首次选课学分一致（§19）**  
    - 叙事：本学期即第一次计分，无入学前已修  
    - 毕业已选 ≡ 本学期已选（GE/ME 总分与文/商/理分类均同步）  
    - 总分已选 = 三类已选之和；总分要求 = 三类要求之和（学期要求对齐 geMax/meMax；毕业要求明显更大）  
    - 入口卡与列表工具条读取同一规范化进度

12. **时间轴可读性（§19）**  
    - 轮次名/时间/胶囊字号加大；时间轴圆点与该行文字垂直居中同行，避免错位

13. **Demo 教师名（§19）**  
    - 批次轻量种子课任课教师使用外籍姓名，不再使用 `Demo Lecturer A/B/C`

14. **列表去批轮条 + 面包屑返回 + 工具条（§20）**  
    - 删除列表顶栏 `cr-list-context-bar`（批/轮下拉）；禁止页内切批/切轮  
    - 「返回入口」经 `App` 面包屑 `#trailing` 展示（仅列表态）；`crs-register` 不挂 `ModuleBriefPanel`  
    - 工具条顺序：搜索区 → 工具条（一览/课表 + 毕业学分整组 + 本学期学分）→ 本轮选课情况 → 主课表  
    - 毕业学分：总分胶囊 + 文/商/理，紧挨本学期公共选修/专业选修左侧

15. **学分文案与课号教学目标（§21）**  
    - i18n：`毕业学分要求(GE/ME)`、`学期学分要求(GE/ME)`  
    - `CourseCodeSourcePopover`：批次名与 Library 行之间插入教学目标表；本轮选课情况课号同用蓝链

16. **课表块 / 抽屉条 / 入口时间轴（§22）**  
    - `WeekScheduleGrid`：绿色虚线不变；`.cell-block` flex 居中；移除叠显藏 meta  
    - `StudentRegistrationRoundStatusPanel`：抽屉条仅「展开更多」「收起更多」，居中  

17. **入口公布附属行（§23）**  
    - 回退独立 `resultRelease` 节点；R1 下 `releaseSubline`：`志愿结果公布：{at}`  
    - 三轮三点；rail 点与 `timeline-main` 对齐；竖线 `flex:1` 连贯

18. **课表行高均摊（§24）**  
    - `WeekScheduleGrid`：`ROW_H` 44→50（14 行吃掉原 16 行总高）；不增 hours  
    - `.hour-label` 加宽 + `nowrap`；课块 `.cell-code` 等同理不换行

19. **GE 第四类文案 + 无 GE 入口（§25）**  
    - GE 类别胶囊第四项文案统一「AI与开放选修」（i18n `geDemand.short.aiOpen` 等）  
    - `studentHasGeElectiveRequirement(programmeCode)`：`getProgrammeCreditTargets().geRequired > 0`  
    - 入口 `typeEntryCards` 按条件过滤 GE；仅 ME 时 `.cr-type-entry-grid.is-single` 半宽左对齐  
    - demo 默认 SWE 仍 `geRequired: 12`，双卡不变；其它专业可在 `PROGRAMME_CREDIT_TARGETS_BY_CODE` 配置 `geRequired: 0`

## Risks / Trade-offs

- 列表内不切批；切批仅目录下拉  
- 监控详情仍用条形与学生端数字不一致 → 可接受（角色不同）  
- 展示日期可落在「今天」之前；验收关窗态靠轮次 `demoClosedRounds`，不靠系统日期  
- 预览切换到非 SWE 学生时，若该专业无三档种子则下拉可能变少 → demo 以默认 SWE 为主

## Open Questions

- 无
