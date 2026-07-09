## 背景与动机

学籍注册 Enrollment Tab 当前以「专业」为首个下拉，学院与专业层次为只读派生；入学批次、学年、学期可独立编辑。业务要求改为与培养方案及专业批次主数据对齐：先按 **专业层次 → 学院 → 专业** 逐级筛选，选定专业批次后自动带出编码、学制、学期、入学批次与学年，并以置灰只读与可编辑字段区分。

## 变更内容

- Enrollment Tab 重构级联顺序：专业层次（必填下拉）→ 学院（必填下拉）→ 专业（必填下拉，选项为活跃专业批次）
- 每级选择过滤下一级选项；变更上级时清空下级及派生字段
- 选定专业批次后自动填充：专业代码、学制、学期、入学批次、学年；控件置灰只读
- 其余字段（状态、学习模式、招生等）保持非必填，下拉默认首项
- Local / China / International 三类学生共用同一 Enrollment 级联逻辑
- 替换既有 §16「专业名称驱动、Intake/Session 独立可选」规格

## 能力范围

### 修改的能力

- `student-profile`：Enrollment Tab 级联选择、批次派生字段、校验与编辑回显

## 影响范围

- `src/data/studentEnrollmentOptions.js` — 级联选项与批次解析
- `src/components/studentRecords/tabs/EnrollmentTab.vue` — UI 与联动
- `src/components/studentRecords/StudentFormField.vue` — 派生字段置灰样式
- `src/data/students.js` — 校验、`programmeIntakeKey` 字段、演示数据
- `src/data/programmeIntakes.js` — 补充与演示学籍对齐的批次种子

## 非目标

- Excel 导入列结构改造（仍导入扁平字段）
- 后端 API 对接
