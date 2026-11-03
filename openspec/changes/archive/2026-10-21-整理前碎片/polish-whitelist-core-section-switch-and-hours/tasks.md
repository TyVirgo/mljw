## 1. 白名单数据

- [x] 1.1 permissions：futureMandatorySections；allowCoreSectionSwitchAdd/Retake + sections[]
- [x] 1.2 helpers：读取换组清单 / 未来必修清单
- [x] 1.3 permissions：allowDropBelowCreditMin + helper

## 2. 表单 UI

- [x] 2.1 时长并进父项；删独立 hours 块
- [x] 2.2 可加课/可重修各跟换组勾选+选组
- [x] 2.3 选组弹框 section 模式（CORE）
- [x] 2.4 未来必修选组下移对齐先修布局
- [x] 2.5 选修下增加「退课允许低于12学分」勾选
- [x] 2.6 选修额度：删 GE hint；GE/ME「允许选择」文案；ME 类别标题
- [x] 2.7 选组弹框同课合并 + 一课一勾选（写入全部分组）
- [x] 2.8 选组弹框改 rowspan 对齐组级行

## 3. 选课器与校验

- [x] 3.1 反转同组规则：默认只许同组加回；白名单放行异组
- [x] 3.2 重修同源；i18n 置灰原因
- [x] 3.3 加课池按未来必修清单过滤；demo MATH101 多组退加
- [x] 3.4 仅退课低于学期最低学分闸 + 白名单放行
- [x] 3.5 资格种子 originalSectionCode + originalAcademicSession 补全
- [x] 3.6 纯加课原组锁（无 dropLines 时用种子原组）

## 4. 收尾

- [x] 4.1 勾选本 tasks

## 5. 重修换组下线 / 退课地板分 / 小时文案（增量）

- [x] 5.1 表单去掉可重修下「本学期必修课允许换组」；新保存不写 retake 换组
- [x] 5.2 学生端重修换组清单恒空（忽略历史 retake 键）
- [x] 5.3 `allowDropBelowCreditMin` 增加 minCredits（0–11）；表单/校验/i18n
- [x] 5.4 申请时长单位改为「小时」；帮助文案同步

## 6. 先选学生 / 换组空=弹框全部

- [x] 6.1 新增：未选学生则权限区 disabled
- [x] 6.2 换组弹框按学生专业过滤；全选当前结果
- [x] 6.3 空 sections = allow-all（独立标志）；去掉必选课组校验；占位文案
