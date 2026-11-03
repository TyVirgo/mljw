## Decisions

1. CSS grid：`ge-t me-t ele man total` / `ge-g me-g g-ele g-man total`，total `grid-row: 1 / span 2`。
2. 学期行 label/value 橙底 `#ffedd5` / 字色 `#9a3412`；毕业行与总学分保持现有蓝底。
3. `gradElective.current = gradGe + gradMe`；`gradMandatory` 仅展示 current（无「已选/要求」后缀，与学期选修/必修同构）。
4. 表单/弹窗/详情/审批共用组件，统一两行。
