## Why

「我的课程」将「全部课程」与选修/必修/其他平级 Tab，进页语义不清；课表随 Tab 过滤，与「课表应看全量」不一致。

## What Changes

- 进页即一级全量列表；二级筛选项为「全部 / 选修课 / 必修课 / 其他课程」（「全部」为轻量筛选项，非一级页名）。
- 「我的课表」始终展示全部课程（三色）；切换二级筛只改变表格行。
- 更新 hint / 课表副标题绑定。

## Non-goals

- 不新增路由级二级页。
- 不改 resultType 与三色着色规则。

## Capabilities

### New Capabilities

- `my-result-secondary-type-filter`: 我的课程一二级分类与课表全量共用

### Modified Capabilities

- （无）

## Impact

- `StudentMyResultView.vue`、可选 `studentMyResultCourses.js` Tab 导出、zh/en i18n
