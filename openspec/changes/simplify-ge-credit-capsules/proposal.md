## Why

入口卡「公共选修 (GE)」的学分胶囊把 GE01-04 的分类学分上限直接暴露给学生，且毕业/学期要求分母（48/18）是演示数值、偏大不真实。产品上 GE 只需要两条整体约束：本学期 GE 学分帽（6 分）与毕业 GE 学分要求（18 分），分类粒度不需要限制。

## What Changes

- 本学期学分行 GE01-04 胶囊去掉分母，只显示已选学分（如 `GE01 3`）；整行仍保留 `GE学期学分(已选/要求) x/6` 的整体帽
- 学期 GE 学分帽 `DEMO_TERM_CREDIT_CAPS.geMax` 18 → 6，选课提交拦截（`assertTermCreditCap` / `wouldExceedTermElectiveCap`）按新帽生效
- 停用 GE01-04 分类学期帽拦截（`wouldExceedTermGeCategory` 一律放行），只保留整体帽
- 毕业学分行总分改为 18：入口卡毕业总分不再按四类求和，改用 `DEMO_PROGRAMME_CREDIT_TARGETS.geRequired`（12 → 18）
- 毕业行 GE01-04 胶囊保留分母，`DEFAULT_GRADUATION_GE_PROGRESS.required` 改为 `{ 5, 5, 4, 2 }`（和 16 < 18，留出富余学分空间）
- 演示已选 GE 课程调整为每门 1-3 学分、合计 6 分（GE01 3 + GE02 2 + GE04 1），毕业已选随学期同源变为 6
- 同口径同步到在线选课其余界面：GE 批次列表顶栏、加退课学分分组（含选课弹窗）、学生监控详情抽屉——本学期 GE 分类一律去分母/不再展示分类进度，总分统一取 `geMax`；毕业 GE 总分统一取培养方案 18（分类胶囊分母保留）

**第三轮细化（颜色语义反转后的展示与轮次口径，用户 2026-09-30 确认）：**

- GE 毕业分类胶囊文案统一带口径说明：`GE01 2/5` → `GE01(已选/要求) 2/5`（四处同步；ME 与学期灰色统计胶囊不变）
- 入口卡与列表顶栏的学分统计固定展示 **R1（第一轮）口径**：默认仅 1 门 GE 课（2 学分）→ 学期 `2/6`（橙，不满员）、毕业 `2/18`（橙）
- R1-R3 三轮选课展示同步**累计学分统计**：R1 = 1 门（2 分）；R2 = R1 + 1 门 = 2 门（4 分）；R3 = R2 + 1 门 = 3 门（6 分）；各轮「本轮选课情况」按该轮累计展示课程与学分

**第四轮：GE 选课限制双入口规则（用户 2026-10-08 确认）：**

- **在线选课硬拦**：学期总分将超 6 → 禁提交+提示；毕业总分将超 18 → 禁提交+提示；GE01-04 分类最低可超出，**不**作为上限拦截
- **加退课不硬拦毕业 18**：超 18 走缴费/申请提醒（`billableCredits`），允许继续提交申请；学期超限仍按既有白名单/bypass 提示
- 清掉 GE 分类当上限的旧拦截残留（学期分类 `required` 不再参与闸门；`creditBarIsOver` 跳过灰色统计条）

**第五轮：ME 学分与门数规则（用户 2026-10-08 确认）：**

- ME 四类为**最低学分**（非上限）：分母 = 课程组内课学分升序取前 `minPick` 门之和；学期分类**保留分母与橙/绿达标色**（不改灰色）
- 文案：`课程组4选3` → `4选3（已选/要求）`；`ME选课` → `ME选课（已选/要求）`（非课程组类只加口径说明）
- 在线选课硬拦：只卡**学期总分 meMax**（及既有毕业总分规则）；分类学分可超出最低；提交时**组内门数不得超过 minPick**（如 3选2 最多 2 门）
- 学期总分 meMax 一般大于四类最低分母之和（分母动态计算时 ordinary 取剩余并留缓冲）

**第六轮：ME R1 提交学分三卡（用户 2026-10-08 确认）：**

- ME 在线选课列表顶栏（按钮与学分胶囊之间）仅 **R1** 展示三卡：① ME学期学分要求（= meMax）② 允许提交最大学分（写死 **2×meMax**）③ 已选学分（本轮待分配志愿 ME 学分和，须 ≤ 允许最大）
- R1 提交硬拦按 **2×meMax**；R2/R3 仍按原 meMax 拦截，无「允许最大」概念

**第七轮：R1 四列表（GE/ME 同版式 + GE 双倍硬拦，用户 2026-10-08 确认）：**

- 仅 **R1**：三卡右对齐，学分胶囊（毕业行+学期行）并入**第四列**（两行合并）；表头浅蓝；GE/ME 同排版
- GE R1 同样三卡：学期要求=geMax、允许最大=**2×geMax**、已选=本轮 GE 学分和；R1 硬拦 **2×geMax**
- R2/R3：保持各自原来顶栏（独立胶囊、无三卡）与原学期帽硬拦（geMax/meMax），不变

**第八轮：列表搜索与 R1 第四列底色（用户 2026-10-08 确认）：**

- 「课程类型」改为真正的**校选课类型**（文/理/商/AI）；GE/ME 由批次入口决定，不再作为搜索项
- 校选课类型默认「全部」；可选具体文/理/商/AI；入口硬过滤校选类别改为由搜索驱动
- 「课程代码」与「课程名称」拆成两个独立条件；新增「课程上课时间」周一至周五（单选，课级任一分组/时段命中）
- 搜索条件换行：常显一行 + 可收起第二行（对齐费用名册收放按钮）
- R1 四列表**第四列不加浅蓝底**（白底）；GE/ME 同步

**第九轮：R1 学分五列重组（GE/ME 同构，用户 2026-10-08 确认）：**

- 仅 R1：①「X学期学分 已选/要求」数值 `已选/要求`（合并原学期要求+已选）② 允许提交最大学分 ③ 学期分类四胶囊行合并、**2×2** ④「X毕业学分 已选/要求」⑤ 毕业分类四胶囊行合并、**2×2**
- GE ③ 为灰统计「GE0x已选：n学分」；⑤ 为「GE0x(已选/要求) n/m」；ME ③/⑤ 沿用现有 4选3 等文案与达标色
- R2/R3 仍独立胶囊顶栏，不变

**第十轮：待开放预览搜索对齐 + 课程一览序号（用户 2026-10-08 确认）：**

- 待开放预览搜索与 R1 对齐：代码/名称拆分、校选课类型（默认全部）、上课时间、收放；**不含**课程已选百分比
- 课程一览抽屉第一列统一加「序号」（GE/ME、预览与 R1–R3 共用抽屉）

**第十一轮：GE R2/R3 本轮选课与学分统计对齐（用户 2026-10-08 确认）：**

- 修复累计口径漏洞：GE R2/R3「本轮选课」与学分统计只收 **GE** 课；**一律排除**管理端代选（含同批）
- Demo 对齐规格：R2 = HUM201+BUS301 → 2 门 / 4 分；R3 = +MPU402 → 3 门 / 7 分；与顶栏/课程一览一致

**第十二轮：本轮表仅本轮所选 + 课表虚实分层（用户 2026-10-08 确认）：**

- 「本轮选课情况」**只展示本轮选择**（R2 不展示 R1 待分配 HUM201）；R1 公布后中签课进确认半池，课表为**已确认选修实线**
- 课表虚线绿 ≡ 本轮表；实线 = 必修 + 更早轮已确认选修；去掉未确认杂 demo；GE/ME 按类型隔离
- 顶栏学分仍按「≤当前轮已确认 + 本轮选择」累计（R2=4、R3=6），可与本轮表门数不同

**第十三轮：R3≤学期帽 + R2/R3 顶栏四列（用户 2026-10-08 确认）：**

- Demo：R3 增量由 MPU402(3) 改为 **MPU401(2)**，GE 累计 **R1=2 / R2=4 / R3=6**，MUST NOT 超过学期 `geMax=6`
- R2/R3 顶栏学分区改与 R1 **同列式卡片**：学期已选/要求 → 学期分类 2×2 → 毕业已选/要求 → 毕业分类 2×2；**无**「允许提交最大学分」列；胶囊内容/色调不变；GE/ME 同构

**第十四轮：ME R2/R3 课表与 R1/GE 虚实分层对齐（用户 2026-10-08 确认）：**

- 课表实线 = 必修 + **严格更早轮**已确认（同轮跨批确认 MUST NOT 画成实线）；虚线 ≡ 本轮表
- Demo：ME R2 确认课改挂 `batch-me-cst-i`（CST201）；R3 改挂 `batch-me-cys-i`（CYS201）；去掉 m1 上 roundKey=main 的 COMP101，避免 R2 课表相对 R1「凭空多课」

## Non-goals

- 不改 `COS2504015` 演示生的特殊学分帽配置
- 不改胶囊对齐样式（属 `align-ge-me-credit-capsules` 变更范围）
- 不加退课对 ME 门数/毕业总分的新硬拦（加退课超毕业上限仍走缴费提醒）

## Capabilities

### New Capabilities

- （无）

### Modified Capabilities

- `course-reg-student-register`：GE 学分胶囊改为「学期只显示已选、毕业保留分类分母但总分独立为 18」，学期 GE 帽收紧为 6 分并停用分类帽拦截

## Impact

- `src/data/courseRegistration/studentRegistrationContext.js`（`DEFAULT_GRADUATION_GE_PROGRESS`、`DEFAULT_TERM_GE_ELECTIVE_CATEGORIES`、`wouldExceedTermGeCategory`、分类帽校验）
- `src/data/courseRegistration/studentAudience.js`（`DEMO_TERM_CREDIT_CAPS.geMax`）
- `src/data/courseRegistration/studentRegistrationStore.js`（毕业总分口径、演示已选课程）
- `src/data/courseRegistration/registrationMonitorQueue.js`（监控行种子默认值）
- `src/views/courseRegistration/student/StudentRegisterView.vue`（入口卡 + 列表顶栏：毕业总分来源、学期胶囊渲染）
- `src/views/courseRegistration/student/StudentAddDropView.vue`（加退课学分分组口径）
- `src/components/courseRegistration/AddDropCoursePickerModal.vue`（弹窗胶囊 hideMax 渲染）
- `src/components/courseRegistration/RegistrationMonitorDetailDrawer.vue`（抽屉本学期 GE 分类条、毕业总分）
- `src/data/courseRegistration/addDropMultiItems.js`（分类超额提示跳过 hideMax 条目）
- `src/i18n/locales/zh.js` / `en.js`（如需调整提示文案）
