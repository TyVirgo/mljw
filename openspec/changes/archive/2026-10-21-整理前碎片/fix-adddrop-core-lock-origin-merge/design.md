## Decisions

1. 新增 `mergeCoreLockOriginLines(dropLines, seedLines)`：先收录全部拟退行，再追加课号未出现在拟退中的种子行。
2. `originLinesForCoreLock`（Add/AddDrop）改为：`merge(dropLines, originLinesFromEligibleCourses())`，禁止「有拟退则只返回 dropLines」。
3. 同课拟退优先：若拟退已含 CHEM101，以其 section 为原组（覆盖种子）。
4. 提交校验 Add/AddDrop 使用同一合并原组（`coreLockOriginLines`），与弹窗一致。
5. 重修路径不改：换组锁仍仅 Add/AddDrop。

## Risks

- 若某课种子原组与拟退不一致且拟退未含该课：以种子为准（符合曾退资格语义）。
