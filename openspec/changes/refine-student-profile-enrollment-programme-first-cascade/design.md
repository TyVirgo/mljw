# 设计：专业优先级联

## 字段布局（前 4 项）

```
┌─────────────┬─────────────┬─────────────┐
│ 1. 专业 *   │ 2. 专业代码 │ 3. 专业层次 │
│   (select)  │  (derived)  │  (derived)  │
├─────────────┼─────────────┼─────────────┤
│ 4. 学院     │ 5. 专业结构 │ 6. 学制     │
│  (derived)  │  (derived)  │  (derived)  │
└─────────────┴─────────────┴─────────────┘
```

## 数据流

```
用户选择 programmeIntakeKey
        │
        ▼
resolveEnrollmentByProgrammeIntakeKey
        │
        ├── programmeCode
        ├── programme (name)
        ├── programmeLevel
        ├── faculty (school)
        ├── programmeStructure
        └── duration
```

## 选项来源

新增 `getEnrollmentAllProgrammeOptions()`：基于 `getEnrichedIntakes(true)` 返回全部活跃 programme intake，同名专业带 intake 后缀区分。

移除对 `programmeLevel` / `faculty` 的手动 watch 级联；清空专业时同步清空 code、level、faculty、structure、duration。

## 编辑回填

`hydrateCascadeFromStoredEnrollment` 保留：从已有 enrollment 推断 `programmeIntakeKey`，并调用 `applyProgrammeIntakeLinkage` 同步只读字段。

## 字段 Tooltip

| 字段 | Hint Key | 中文说明 |
|------|----------|----------|
| 入学批次 (Intake) | `Enrollment Intake Hint` | 学生如果转专业，Intake会变新专业的intake，但是注册时间不变 |
| 注册时间 | `Enrollment Registration Time Hint` | Registration Time是入学的intake |
| 学期 (Semester) | `Enrollment Semester Hint` | 当前学年学期相对入学intake第几个学期 |

hint 定义在 `studentProfileFieldLabels.js`，经 `StudentFormField` 的 `label-hint` + `tr()` 展示。
