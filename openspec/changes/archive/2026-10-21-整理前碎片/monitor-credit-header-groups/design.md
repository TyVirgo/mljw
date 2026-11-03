## Decisions

1. 双行 thead：身份 5 列 + 操作列 `rowspan=2`；三组一级 `colspan`。
2. 列序：GE×4 → ME×4 → 必修×2。
3. `formatCreditCompletion(current, max)` → `Math.floor(current/max*100)%`，max≤0 为 `—`，不封顶。
4. 行字段 `graduationMandatoryProgress: { current, required }`，默认 required=72；`withTermGe` 补默认。
5. 表区 `overflow-x: auto`；窄屏允许横滑，操作列 `sticky right`（对齐批次页）。
6. 密度：本页 compact（表头 ~11px / 正文 12px，padding ~4×6）；二级表头缩短；导出保留完整文案。
7. 组间 `2px` 竖分割线，组内细竖线；`border-collapse: separate` 以稳定 sticky。
8. 完成度色阶：≥75 绿（含 >100%）、50–74 橙、25–49 黄、0–24 红；主表与详情同源。
9. 展示禁止「—」：缺字段用默认分母；详情总分走 `monitorCreditInsights`（毕业 GE 分母=四类和 16）。
10. Demo：多数 ≤100%，仅少数突破行；演示生补 `graduationMandatoryProgress`。
11. 筛选：入学批次下拉（含队列出现的批次）；学生改为姓名；状态/预警/严重程度改为 GE/ME/必修毕业完成度区间（空端不限，闭区间，min≤max）。
12. 「已选/要求」列用 `cr-credit-capsule`（is-short/is-met/is-over）；监控页 `is-over` 用绿色（与 is-met 同色），在线选课保持红。
13. 搜索：身份三字段常驻 + 查询/重置/收起；完成度区间进第二行可收放（对齐 FeeRoster）。
14. 详情抽屉：去掉学分环；顶部学生信息表（对齐在线入口）；GE01-04 一行四列；总分已选/要求用胶囊、完成度用圆徽章。
15. 详情底部仅「关闭」；不加白名单（主表行操作保留）。课表用 `buildMonitorDetailSchedule` + `legendMode=myResult`，仅必修/选修双色。

## 影响文件

见 proposal Impact。
