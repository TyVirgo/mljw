## 节点类型

| type | 含义 |
|------|------|
| `step`（默认） | 串行节点（申请人 / AC / HOD / AAO…） |
| `branch-start` | 「分支开始，并行审批」 |
| `parallel-item` | 会签分支卡片 |
| `branch-join` | 「分支汇聚：等待所有分支完成」或汇聚完成 |

## 构建规则

1. 遍历 workflow stages；命中 `getParallelGroups` 首成员时整组折叠一次  
2. 组内每 stage：`resolveStageNode`（有 log 用动作；当前/组内未完成 → pending；否则 upcoming）  
3. `branch-join`：组内全部 Approved（无 Rejected/Update Required 未关闭）→ completed；否则 pending  

## Demo

`DEF016`：Local 休学，已过 AA HOD；Admissions 已通过、Library 待审、IT 需修改、Accommodation 待审；`approvalStage: 'Library'`。
