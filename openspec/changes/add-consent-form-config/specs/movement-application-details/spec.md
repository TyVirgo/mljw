## 修改需求

### 需求：异动附件只读展示对齐原型
系统应在详情弹框中使用对齐原型的边框面板渲染已上传附件：带必填标记的标签行、右侧 Download Consent Letter 操作，以及下方带文档图标的文件链接。

#### 场景：附件面板布局
- 当用户在任意异动详情弹框的 Documents 区查看时，则系统在同一行展示 Upload Attachment 标签（含必填指示）、Download Consent Letter 按钮，下方以蓝色链接与文档图标展示已上传文件名。

#### 场景：无附件占位
- 当申请无附件文件名时，则附件面板显示占位而非文件链接。

#### 场景：从已配置模板下载同意书
- 当用户在详情附件面板点击 Download Consent Letter，且存在与该申请异动类型及学生类别匹配的同意书模板时，则系统下载已配置的学生同意书模板文件（mock）。

#### 场景：未配置时下载同意书
- 当用户在详情附件面板点击 Download Consent Letter，且不存在与异动类型、学生类别、programme level 及 academic session 匹配的已应用同意书版本时，则系统提示未找到匹配的同意书，请联系管理员。

## 新增需求

### 需求：异动申请表单下载匹配的同意书模板
系统应在用户点击异动申请新建/编辑表单中的 Download Consent Letter 时，从同意书配置库解析并下载模板。

#### 场景：在转专业表单下载学生模板
- 当用户在转专业申请表单 Documents 区点击 Download Consent Letter，且已选学生具有可解析的 programme level 与 application academic session，且存在 programme-transfer、该生类别、education level 与 academic session 的已应用同意书版本时，则系统下载该版本的学生同意书模板文件（mock）。

#### 场景：在休学、复学、退学表单下载学生模板
- 当用户在休学、复学或退学申请表单 Documents 区点击 Download Consent Letter，且已选学生具有可解析的 programme level 与 application academic session，且存在匹配的已应用版本时，则系统下载学生同意书模板文件（mock）。

#### 场景：申请表单中未配置下载
- 当用户在任意异动申请表单点击 Download Consent Letter，且当前 Tab、所选学生与 application academic session 无匹配的已应用同意书版本时，则系统提示未找到匹配的同意书，请联系管理员。

### 需求：休学与退学表单的家长同意书模板下载
当匹配模板含家长同意书文件时，系统应在休学与退学申请表单提供 Download Parent Consent Letter 操作。

#### 场景：已配置时显示家长下载
- 当用户在休学或退学新建/编辑表单 Section III（家长/监护人同意）中，且匹配模板含家长同意书文件时，则系统显示 Download Parent Consent Letter 操作。

#### 场景：未配置时隐藏家长下载
- 当匹配模板无家长同意书文件时，则系统在 Section III 不显示 Download Parent Consent Letter。

#### 场景：下载家长模板
- 当用户点击 Download Parent Consent Letter，且匹配模板含家长同意书文件时，则系统下载家长同意书模板文件（mock）。

## 修改需求

### 需求：异动申请表单下载匹配的同意书模板（§11 三维 lookup）
系统应仅使用异动类型、学生类别及 programme level 映射的 education level 解析同意书模板，返回匹配配置行上的全局已应用版本。本阶段 application academic session 不参与同意书匹配。

#### 场景：在转专业表单下载学生模板
- 当用户在转专业申请表单 Documents 区点击 Download Consent Letter，且已选学生具有可解析的 programme level，且存在 programme-transfer、该生类别与 education level 的全局已应用同意书版本时，则系统下载该版本的学生同意书模板文件（mock）。

#### 场景：在休学、复学、退学表单下载学生模板
- 当用户在休学、复学或退学申请表单 Documents 区点击 Download Consent Letter，且已选学生具有可解析的 programme level，且存在匹配的全局已应用版本时，则系统下载学生同意书模板文件（mock）。

#### 场景：申请表单中未配置下载
- 当用户在任意异动申请表单点击 Download Consent Letter，且当前 Tab 与所选学生无匹配的全局已应用同意书版本时，则系统提示未找到匹配的同意书，请联系管理员。

### 需求：未配置时下载同意书
当无全局已应用同意书版本匹配异动类型、学生类别与 programme level 时，系统应展示联系管理员消息。

#### 场景：未配置时下载同意书
- 当用户在详情附件面板点击 Download Consent Letter，且不存在与异动类型、学生类别及 programme level 匹配的全局已应用同意书版本时，则系统提示未找到匹配的同意书，请联系管理员。
