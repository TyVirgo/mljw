## Context

在线 ME：`selectionGroups` 内行有课程组列 + tone 底色；未入组课扁平无组底色。重修弹框已对 GE 虚拟组跳过底色，ME 虚拟大组尚未对齐。

## Goals / Non-Goals

**Goals:** ME选课无组列/无底色；n选m 对齐在线；原课 demo 四类各一行。

**Non-Goals:** 在线主表改造。

## Decisions

1. `showSelectionGroupColumn`：重修 ME 且候选中存在非虚拟（非 GE/ME ordinary）组时才为 true。
2. `selectionGroupRowClass`：`me-virtual-ordinary` 与 GE 一样返回 undefined。
3. Demo：保留 ALGO101（ME选课）、SE201（3选2）、COMP201（4选3）、STAT301（2选1）；OS/DB/WEB210 挂科行注释停用并说明原因。

## Risks / Trade-offs

- [其它用例依赖 OS/DB/WEB210 挂科] → 注释保留数据块，需要时可恢复。
