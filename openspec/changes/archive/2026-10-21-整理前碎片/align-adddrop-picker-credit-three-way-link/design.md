## Decisions

1. **统一净值公式**  
   `Baseline − Drops + Adds + Retakes`  
   弹框本侧：`selectedRows` 替换表单同侧列表；另一侧始终读表单。

2. **gate 载荷**  
   ```
   dropLines, addOnlyLines, retakeLines,
   addLines = addOnlyLines ∪ retakeLines  // 兼容旧读方
   ```

3. **学期帽 / GE 帽**  
   `addLines` 入参 = 另一侧表单行 ∪ 本框已勾（不含当前候选行）。

4. **重修仍计学期帽**  
   与加课同等计入（维持现状）。
