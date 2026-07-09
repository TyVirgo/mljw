## 修改需求

### 需求：Demo 国籍选项移除 Taiwan

学生档案国籍下拉及 Demo 数据应移除 Taiwan 选项；原使用 Taiwan 的 mock 学生应改为其他有效国籍（如 Singapore）。

#### 场景：国籍下拉无 Taiwan
- **当** 用户打开学生档案国籍下拉
- **则** 选项列表中不包含 Taiwan

#### 场景：Demo 学生国籍更新
- **当** 系统加载初始 mock 学生数据
- **则** 不存在 nationality 为 Taiwan 的记录
