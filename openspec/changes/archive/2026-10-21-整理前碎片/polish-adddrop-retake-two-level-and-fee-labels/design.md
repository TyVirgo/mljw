## Decisions

1. **一层原课表**：SECTION IV 在选课按钮旁/上展示 `listTranscriptLatestByRetakeType(retakeType)`；行末「选择重修课程」。
2. **二层弹框**：`retakeFocusOriginal` 过滤 `listRetakePickerCourses` 中 `replacesOriginals` 命中或同课号的候选；确认后写入 `retakeLines`。
3. **费用字段**：加课/重修区不再展示 SST；短字段只显示各自不含税预估。
4. **费用预估块**：声明前唯一一块；三项汇总 + SST tip；有加或重修应付时显示。
