# 任务：add-student-result-summary-and-credit-model

## 1. 学分三层数据

- [x] 1.1 在 `studentRegistrationContext`（及必要 monitor demo）引入层1总负荷、层2 termElective/graduationElective、层3 `termGeCategories`；保证文商理 required 之和＝本学期 GE 局部
- [x] 1.2 提供读取助手（汇总灰条 / 在线选课顶栏共用）；明确可少不可超的校验或提示入口
- [x] 1.3 兼容旧 `graduationGeProgress`：映射为毕业累计次要数据或迁移字段

## 2. 学生结果页双 Tab

- [x] 2.1 `StudentMyResultView` 增加 Tab：本学期选课情况（默认）/ 历史记录
- [x] 2.2 本学期汇总：上下文灰条（批次·轮次·阶段/规则 tip）+ 三层学分数字
- [x] 2.3 已选/志愿表（志愿次序、状态）；无勾选课表；「继续选课」跳转在线选课
- [x] 2.4 历史 Tab 迁入现有确认课表与筛选/分页/课表抽屉逻辑
- [x] 2.5 轻量 B1/B2 状态文案条（等待公示 / 可进下一轮 demo，不做完整倒计时）

## 3. 在线选课顶栏对齐

- [x] 3.1 `StudentRegisterView` 文商理改为本学期 `termGeCategories`；GE/ME 用学期局部
- [x] 3.2 毕业累计降为 tip/次要（可选）；监控详情避免用毕业进度顶替本学期类别

## 4. i18n 与菜单

- [x] 4.1 zh/en：Tab 名、灰条字段、学分标签、汇总空态与跳转文案
- [x] 4.2 侧栏/流程指引：菜单名「我的选课」或保留历史名 + Tab 说明（按 design 优先改名）

## 5. 收尾

- [x] 5.1 自测：默认汇总 → 历史 Tab → 继续选课；学分三层数字与文商理之和约束
- [x] 5.2 勾选本 tasks
