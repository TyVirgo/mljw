# 选课管理-选课日志 — 任务清单（合并归档）

> 历史 tasks 已在各次 apply 中完成。本清单仅作追溯；**无需再次实现**。

- [x] 1. 合并本菜单下历史变更包为中文需求包
- [x] 2. 保留合并来源列表便于需求文档回溯
- [x] 3. 删除已被合并的旧变更目录

## 增量（2026-07 先批次后轮次）

- [x] 页顶批次+轮次双下拉；搜索去批次关键词；统计/列表按批次×轮次

## 增量（2026-07 右冻结列无缝）

- [x] 排队情况/操作结果固定列宽与 right 对齐，中间不露滚动内容

## 增量（2026-08）：搜索区与列表列

- [x] 1. 批次/轮次并入搜索区第 1、第 2 项，宽度保持；去掉页顶独立条；重置不清批次轮次
- [x] 2. 分组名称移到课程列后；去掉备注列与导出字段
- [x] 3. 主批默认轮次 demo 补至 25 条；分页默认 20 行/页

## 历史来源任务摘要

### add-registration-log

```
## 1. OpenSpec / 菜单与路由

- [x] 1.1 写入本变更 proposal / design / spec / tasks
- [x] 1.2 菜单 `cr-log` 加入结果与预警组；`developedPages` 注册；App.vue 挂载视图
- [x] 1.3 i18n 菜单名、页面文案、module brief（中英文）

## 2. 数据与导出

- [x] 2.1 新增 `registrationLog.js`：demo 种子 + `filterRegistrationLogs`
- [x] 2.2 导出字段与 `formatRegistrationLogExportRow`
- [x] 2.3 去掉 IP；分组名称字段；种子对齐 batch-2504-m1 / 结果学生 / selectableCourses；覆盖操作×结果矩阵

## 3. 页面

- [x] 3.1 实现 `RegistrationLogView.vue`：筛选、表格、分页、导出
- [x] 3.2 注册 `courseRegistrationModuleBriefs` 中 `cr-log` 条目
- [x] 3.3 页面去掉 IP 筛选/列；分组名称用 sectionNameDisplay 展示
- [x] 3.4 操作时间移至第二行「开始 至 结束」联动；查询时对调非法区间；demo 扩至约 25 条
```

### enrich-registration-log-round-monitor

```
## 1. 实现

- [x] 1.1 提案与规格
- [x] 1.2 `registrationLog`：round、排队结果、demo 统计
- [x] 1.3 `RegistrationLogView`：Tab + 统计卡 + 表列/横滑
- [x] 1.4 筛选/导出/i18n
- [x] 1.5 去掉统计分组标题；排队/结果列互换并右冻结；去掉操作名称列与导出字段
- [x] 1.6 排队中展示排名卡；搜索第二行更多/收起
- [x] 1.7 排队顺位改为纯文本 `#N`（去掉卡片与副文案）
- [x] 1.8 主表与导出增加学分、课程类型列
- [x] 1.9 统计末两卡改为有余量/已满课程数
- [x] 1.10 操作结果文案按轮次（待分配/选课成功/选课失败）；筛选与导出同步
```
