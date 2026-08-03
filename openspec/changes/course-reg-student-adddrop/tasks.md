# 选课管理-学生加退课 — 任务清单（合并归档）

> 历史 tasks 已在各次 apply 中完成。本清单仅作追溯；**无需再次实现**。

- [x] 1. 合并本菜单下历史变更包为中文需求包
- [x] 2. 保留合并来源列表便于需求文档回溯
- [x] 3. 删除已被合并的旧变更目录

## 增量（2026-07）

- [x] 去掉退课通道列；申请课程拆为添加/退课/重修三列（编码+名称）
- [x] 学生端详情抽屉展全申请内容
- [x] 菜单与选课历史互换；审批前可取消；详情分区/附件对齐学籍

## 历史来源任务摘要

### add-adddrop-course-picker

```
## 1. 课程选择器

- [x] 1.1 新增 `AddDropCoursePickerModal`（搜索/表格/分页/单选/确认）
- [x] 1.2 `StudentAddDropView`：下拉改为触发器 + picker；数据仍用 `courseOptions`
- [x] 1.3 i18n：选择器标题、确认、名额状态等
```

### enrich-student-adddrop-form

```
## 1. 表单与数据

- [x] 1.1 弹窗字段、校验与提交写入学年学期/说明/退费抵免
- [x] 1.2 demo 与列表列补充；i18n 文案
```

### polish-adddrop-form-layout

```
## 1. UI

- [x] 1.1 弹窗两列、退费抵免单选、红色必填星号
- [x] 1.2 callout rule 变体改为浅蓝 + 感叹号
```

### polish-adddrop-label-intake-desc

```
## 1. 实现

- [x] 1.1 i18n 文案统一
- [x] 1.2 学年学期与入学批次选项倒序
```

### polish-demo-teaching-week-callout

```
## 1. 一体条带

- [x] 1.1 演示教学周与通道说明共用一整行 tip 底色与字体
```

### polish-student-adddrop-list

```
## 1. 布局与列表

- [x] 1.1 搜索区 + toolbar 发起申请 + callout/演示周同行
- [x] 1.2 分页、筛选、退课通道「非退课申请」、demo 数据加厚
```
