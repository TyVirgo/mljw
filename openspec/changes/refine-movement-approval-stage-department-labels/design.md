## 映射（摘录）

| stage key | 部门展示名（EN） | 中文直译 |
|-----------|------------------|----------|
| Pending Review | Degree Academic Coordinator | 学位教务协调员 |
| HOD/HOP | Degree Head of Department/Head of Programme | 学位系主任/项目主任 |
| Academic Affairs | UG Academic Coordinator | 本科教务协调员 |
| … | 见 `STAGE_ROLE_MAP` | zh-flat 直译 |

`Applicant` / `Submission` 时间轴首节点保持「申请人」语义（既有 tr）。

列表/导出：`formatApprovalStageLabel(stage, tr)` → `tr(STAGE_ROLE_MAP[stage] || stage)`。
时间轴：对 `node.stageLabel` 同样格式化（申请人节点仍用 Applicant）。
