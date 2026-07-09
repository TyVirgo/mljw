# 移除 Demo 国籍「台湾」

## 背景
演示数据与国籍下拉选项中不应出现「台湾 / Taiwan」，避免合规与展示风险。

## 变更内容
- 从 `nationalityOptions.js` 全球国籍列表移除 `Taiwan`
- 将唯一使用该国籍的 mock 学生（Elson Lai / AIT2402110）改为其他 demo 国籍（Singapore），并同步更新关联地址/学校/联系方式等台湾相关文案

## 非目标

- 不改后端 API 或真实数据校验规则
- 不调整 Malaysia / China 置顶逻辑
