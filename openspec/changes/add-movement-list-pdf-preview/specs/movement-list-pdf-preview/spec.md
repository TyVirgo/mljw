## 新增需求

### 需求：异动维护/查询列表 Preview PDF

异动维护与异动查询列表的操作列应在「详情」右侧提供 Preview PDF 按钮，用于在不打开详情抽屉的情况下预览与详情 Export PDF 同源的 PDF 内容。

#### 场景：维护列表显示 Preview PDF
- **当** 用户查看异动维护列表行的 Actions 列
- **则** 在「详情」右侧显示 Preview PDF 按钮

#### 场景：查询列表显示 Preview PDF
- **当** 用户查看异动查询列表行的 Actions 列
- **则** 在「详情」右侧显示 Preview PDF 按钮

#### 场景：弹窗 iframe 预览
- **当** 用户点击 Preview PDF
- **则** 系统打开弹窗，在 iframe 中预览客户端生成的 PDF

#### 场景：弹窗下载 PDF
- **当** 用户在 Preview PDF 弹窗中点击 Download PDF
- **则** 系统下载与预览内容相同的 PDF 文件

#### 场景：敏感字段脱敏
- **当** 从查询列表打开 Preview PDF
- **则** 预览内容中的护照/IC 等敏感字段沿用列表详情相同的脱敏规则
