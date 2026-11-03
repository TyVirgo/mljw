# 设计：add-student-result-summary-and-credit-model

## Context

- `StudentMyResultView`：单表确认课历史 + Study Plan / 课表抽屉  
- `StudentRegisterView`：在线选课；顶栏已有 GE/ME 与文商理数字，但文商理语义偏「毕业累计」  
- 产品拍板：汇总页挂「选课历史」扩 Tab（方案 A）；学分按三层调整

## Goals / Non-Goals

**Goals**

- 学生在结果页默认看到「本学期选课情况」汇总（非操作选课）  
- 历史归档不丢，迁到第二 Tab  
- 学分模型与闸门展示与培养方案口径一致  

**Non-Goals**

- 新菜单；在线选课改双表操作台；管理端学分配置后台

## Decisions

1. **双 Tab 信息架构**  
   - 默认 Tab：`termSummary`（本学期选课情况）  
   - 第二 Tab：`history`（历史记录＝现有表格逻辑）  
   - 路由/菜单仍 `crs-result`；可选将侧栏文案改为「我的选课」

2. **本学期汇总布局（对齐图示意图，非勾选台）**  
   ```
   ┌─ 灰条 / 上下文条 ─────────────────────────────────┐
   │ 批次 · 轮次 · 阶段/权限 · 规则 tip                   │
   │ 总负荷 current / min–max                            │
   │ GE 局部 · 文商理（本学期）｜ ME 局部                  │
   └───────────────────────────────────────────────────┘
   ┌─ 已选 / 志愿表 ───────────────────────────────────┐
   │ 课名 · 学分 · 周次 · 教师 · 时间地点 · 志愿次序 · 状态 │
   └───────────────────────────────────────────────────┘
   （可选）等待公示 / 未中→下一轮 文案条（B1/B2 轻量 demo）
   ```  
   - **不下挂**可勾选课程大表；「继续选课」链回 `crs-register`  
   - 数据：当前学期已提交志愿/已选 + 确认课（demo 从 cart/confirmed/store 拼）

3. **学分三层数据模型（原型）**  
   ```
   programmeTermLoad: { min, max, current }     // 层1：专业×学期
   termElective: {
     ge: { current, required },                 // 层2：本学期局部
     me: { current, required },
   }
   graduationElective: {
     geTotal: { current, required },            // 层2：毕业累计（次要展示）
     meTotal: { current, required },
   }
   termGeCategories: {                          // 层3：本学期文商理
     humanities: { current, required },
     business: { current, required },
     science: { current, required },
   }
   // 约束（展示/拦截提示）：
   // sum(termGeCategories.*.required) === termElective.ge.required
   // 0 ≤ current ≤ required（类型与类别）；总负荷受 min/max 约束
   ```  
   - `creditMin/creditMax` 作为层1 来源时，语义改为**专业学期总负荷**，不再等同单批次选修帽  
   - 批次上原有 `creditMin/Max` 若与层1冲突：学生端以 context 层1 为准；批次字段本包可不删，避免大范围回归

4. **在线选课顶栏对齐**  
   - 文商理数字改为读 `termGeCategories`  
   - GE/ME 读 `termElective`  
   - 毕业累计：目录卡 tip 或折叠，不占主闸位置  
   - 监控详情：并列层1（可选）+ 学期 GE/ME + 本学期文商理；毕业累计可保留次段

5. **与「本轮选课情况」抽屉关系**  
   - 在线选课内抽屉可保留快捷查看；汇总 Tab 为正式「情况页」  
   - 不强制本包删除抽屉

6. **B1/B2 范围**  
   - 汇总条展示状态文案即可（如「等待公示」「可进入第二轮」），完整倒计时另包可深化

## Risks / Trade-offs

- 菜单仍叫「选课历史」时，默认进汇总可能短暂困惑 → 建议改名或 Tab 足够醒目  
- demo 拼「本学期」范围依赖 `academicSession`；需与当前开放批学期一致  
- 层1 与旧批次 min/max 并存一阶段可能文案不一致 → design 约定学生端以 context 为准

## Migration Plan

- 无持久化 schema 迁移；localStorage demo 字段增量  
- 旧 `graduationGeProgress`：可映射为毕业累计次要数据，或拆出 `termGeCategories` 新字段

## Open Questions

- 无（菜单最终文案实现时定：优先「我的选课」）
