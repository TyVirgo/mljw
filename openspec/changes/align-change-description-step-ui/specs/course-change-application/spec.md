## 修改需求

### 需求：Change description 标注
系统应允许在步骤 1 将各变更组件标记为 Major Changes 或 Minor / No Changes，采用与 UI 原型对齐的三列表格布局。

#### 场景：三列表格布局
- **当** 用户在 create 或 edit 模式查看 Change Description 步骤
- **则** 各组件区块（MAIN COMPONENTS 和 OTHER COMPONENTS）以表格展示，列包括：Component Name、Major Changes 和 Minor / No Changes
- **且** 表头行标注 Major Changes 与 Minor / No Changes 列
- **且** 区块标题左侧显示蓝色竖向强调条

#### 场景：各组件 major 与 minor 判定标准
- **当** 用户查看组件行
- **则** Major Changes 列显示 pill 切换（N/Y）及 bullet-list 判定标准，说明该组件何种变更属于 major change
- **且** Minor / No Changes 列显示 pill 切换（N/Y）及 bullet-list 判定标准，说明何种变更属于 minor 或 no change
- **且** 判定标准文案与各组件原型定义一致

#### 场景：切换互斥选择
- **当** 用户点击某组件 Major Changes 列的切换
- **则** 该列切换显示 Y（蓝色/激活），Minor / No Changes 列切换显示 N（灰色/非激活）
- **且** 该组件存储值为 `major`

#### 场景：选择 minor changes
- **当** 用户点击某组件 Minor / No Changes 列的切换
- **则** 该列切换显示 Y（蓝色/激活），Major Changes 列切换显示 N（灰色/非激活）
- **且** 该组件存储值为 `minor`

#### 场景：Main components
- **当** 用户在 Change Description 步骤查看 MAIN COMPONENTS
- **则** 系统列出 Course Name、Credit Value、Course Classification 和 CLO
- **且** 每行通过双列切换模式选择 Major Changes 或 Minor / No Changes

#### 场景：Other components
- **当** 用户在 Change Description 步骤查看 OTHER COMPONENTS
- **则** 系统列出 Synopsis、Pre-requisite / co-requisite、Teaching Methods、Course Content、Assessment Methods 和 References
- **且** 每行通过双列切换模式选择 Major Changes 或 Minor / No Changes

#### 场景：默认标注
- **当** 用户首次加载新申请的 Change Description
- **则** 全部组件默认为 Minor / No Changes，除非用户修改

#### 场景：只读详情视图
- **当** 用户在 detail（readonly）模式查看 Change Description 步骤
- **则** 展示相同三列表格布局，切换以禁用状态反映已保存的 major/minor 选择

## 新增需求

### 需求：Change description 判定标准内容
系统应展示组件特定的判定标准 bullet 列表，引导教师选择正确的变更级别。

#### 场景：Course Name 判定标准
- **当** 用户查看 Course Name 行
- **则** Major Changes 判定标准包括「Change course name to reflect the change in course content.」
- **且** Minor / No Changes 判定标准包括「Improve the grammar of the course name.」和「No change.」

#### 场景：Credit Value 判定标准
- **当** 用户查看 Credit Value 行
- **则** Major Changes 判定标准包括「Add or reduce the credit value of the course.」
- **且** Minor / No Changes 判定标准包括「Change credit value to meet MQA/EAC standards.」和「No change.」

#### 场景：Course Classification 判定标准
- **当** 用户查看 Course Classification 行
- **则** Major Changes 判定标准包括「Change course classification, e.g. from major to elective.」
- **且** Minor / No Changes 判定标准包括「Change course classification to meet MQA/EAC standards.」和「No change.」

#### 场景：CLO 判定标准
- **当** 用户查看 CLO 行
- **则** Major Changes 判定标准包括「Add or remove CLOs.」
- **且** Minor / No Changes 判定标准包括「Improve the grammar of the CLOs.」、「Rearrange the sequence of the CLOs.」、「Combine the CLOs.」和「No change.」

#### 场景：Synopsis 判定标准
- **当** 用户查看 Synopsis 行
- **则** Major Changes 判定标准包括「Revise the synopsis to reflect the change in course content.」
- **且** Minor / No Changes 判定标准包括「Rephrase the synopsis.」、「Improve the grammar of the synopsis.」和「No change.」

#### 场景：Pre-requisite 判定标准
- **当** 用户查看 Pre-requisite / co-requisite 行
- **则** Major Changes 判定标准包括「Add, remove, or revise the pre-requisite / co-requisite of the course.」
- **且** Minor / No Changes 判定标准包括「No change.」

#### 场景：Teaching Methods 判定标准
- **当** 用户查看 Teaching Methods 行
- **则** Major Changes 判定标准包括「Add or reduce the number of lectures (L), tutorials (T), practical (P).」、「Revise the teaching strategy, e.g. from classroom delivery (CD) to podcast.」和「No change.」
- **且** Minor / No Changes 判定标准包括「No change.」

#### 场景：Course Content 判定标准
- **当** 用户查看 Course Content 行
- **则** Major Changes 判定标准包括「Add or reduce topic in the course content.」
- **且** Minor / No Changes 判定标准包括「Rearrange the topics.」、「Update the topics.」、「Add or reduce subtopics in the topics.」和「No change.」

#### 场景：Assessment Methods 判定标准
- **当** 用户查看 Assessment Methods 行
- **则** Major Changes 判定标准包括「Change the percentage of continuous assessment and final assessment.」
- **且** Minor / No Changes 判定标准包括「Revise the coursework components, e.g. test, assignment, etc.」、「Revise the exam hours.」和「No change.」

#### 场景：References 判定标准
- **当** 用户查看 References 行
- **则** Major Changes 判定标准包括「Add or reduce the main or additional references.」
- **且** Minor / No Changes 判定标准包括「Update the publication year or edition of the references.」、「Revise the referencing system, e.g. from MLA to APA.」和「No change.」
