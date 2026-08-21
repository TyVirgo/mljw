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

9. **学生端轮次 demo 矩阵（§17）**  
   - GE：HUM (I)=R1 进行中；BUS (I)=R2 进行中；MPU (II)=R3 进行中；SCI (I)=R1 已结束（`draft`→`active`）  
   - ME：SWE (I)=R1；CST (I)=R2；CYS (I)=R3；COS=R1 已结束（`demoClosedRounds` 三轮全关）  
   - 一条批钉一轮（方案 A 轮次下拉仍只展示当前开放轮 / 关窗批展示默认轮文案）

## Risks / Trade-offs

- 列表内不切批；切批仅目录下拉  
- 监控详情仍用条形与学生端数字不一致 → 可接受（角色不同）  
- 展示日期可落在「今天」之前；验收关窗态靠独立已结束批，不靠把系统日期调过 `end`

## Open Questions

- 无
