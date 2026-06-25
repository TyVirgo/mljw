/** 将字段定义转为 9 列 PRD 表格行（含序号） */
export function toFieldRows(entries) {
  return entries.map((e, i) => [
    String(i + 1),
    e.zh,
    e.en,
    e.type || '文本',
    e.required || '否',
    e.validation || '—',
    e.remark || '—',
    e.codeSet || '否',
    e.sample || '',
  ])
}

/** 学生档案 — 新增/编辑表单全部字段（七 Tab） */
export const profileFormFieldEntries = [
  // 顶栏
  { zh: '学生类别', en: 'Student Category', type: '单选', required: '是', validation: '必选 Local/China/International', remark: '决定字段显隐与校验分支', codeSet: '是', sample: 'Local' },
  // Basic Info
  { zh: '英文姓名', en: 'Full Name (English)', type: '文本', required: '是', validation: '最大 100 字符', remark: 'Basic Info Tab', codeSet: '否' },
  { zh: '中文名', en: 'Chinese Name', type: '文本', required: '否', validation: '最大 50 字符', remark: 'Basic Info Tab', codeSet: '否' },
  { zh: '性别', en: 'Gender', type: '枚举', required: '否', remark: 'Basic Info；代码集 Gender', codeSet: '是' },
  { zh: '学号', en: 'Student ID', type: '文本', required: '是', validation: '全局唯一；最大 20 字符', remark: 'Basic Info；Edit 模式只读', codeSet: '否', sample: 'XMUM2309001' },
  { zh: '申请编号', en: 'Application No.', type: '文本', required: '否', remark: 'Basic Info', codeSet: '否' },
  { zh: '身份证号码', en: 'IC No.', type: '文本', required: '条件必填', validation: 'Local 必填', remark: 'Basic Info；Local 显示，China/Intl 隐藏', codeSet: '否' },
  { zh: '出生州/省', en: 'State of Birth', type: '文本', required: '否', remark: 'Basic Info；仅 Local', codeSet: '否' },
  { zh: '护照号码', en: 'Passport No.', type: '文本', required: '否', remark: 'Basic Info；China/International 显示', codeSet: '否' },
  { zh: '护照有效期', en: 'Passport Expiry', type: '日期', required: '否', remark: 'Basic Info；China/International', codeSet: '否', sample: '2028-12-31' },
  { zh: '出生地', en: 'Place of Birth', type: '文本', required: '否', remark: 'Basic Info；China/International', codeSet: '否' },
  { zh: '考生编号', en: 'Candidate No.', type: '文本', required: '否', remark: 'Basic Info；仅 China', codeSet: '否' },
  { zh: '政治面貌', en: 'Political Outlook', type: '文本', required: '否', remark: 'Basic Info；仅 China', codeSet: '否' },
  { zh: '身份证号码（中国）', en: 'Identity No. (China ID)', type: '文本', required: '否', remark: 'Basic Info；仅 China', codeSet: '否' },
  { zh: '出生日期', en: 'Date of Birth', type: '日期', required: '否', remark: 'Basic Info', codeSet: '否' },
  { zh: '年龄', en: 'Age', type: '数字', required: '否', remark: 'Basic Info；可派生', codeSet: '否' },
  { zh: '国籍', en: 'Nationality', type: '文本', required: '否', remark: 'Basic Info', codeSet: '是' },
  { zh: '种族', en: 'Race', type: '文本', required: '否', remark: 'Basic Info', codeSet: '否' },
  { zh: '宗教', en: 'Religion', type: '文本', required: '否', remark: 'Basic Info', codeSet: '否' },
  { zh: '婚姻状况', en: 'Marital Status', type: '枚举', required: '否', remark: 'Basic Info', codeSet: '是' },
  { zh: '残疾', en: 'Disability', type: '枚举', required: '否', remark: 'Basic Info；Yes/No', codeSet: '是' },
  { zh: '学生照片', en: 'Student Photo', type: '图片', required: '否', validation: 'jpg/png ≤2MB', remark: 'Basic Info；base64 本地预览', codeSet: '否' },
  // Enrollment
  { zh: '专业代码', en: 'Programme Code', type: '文本', required: '是', validation: '最大 20 字符', remark: 'Enrollment Tab', codeSet: '否', sample: 'SE' },
  { zh: '专业', en: 'Programme', type: '文本', required: '是', validation: '最大 100 字符', remark: 'Enrollment Tab', codeSet: '否' },
  { zh: '学院', en: 'Faculty', type: '文本', required: '否', remark: 'Enrollment Tab', codeSet: '否' },
  { zh: '学籍状态', en: 'Status', type: '枚举', required: '否', remark: 'Enrollment Tab', codeSet: '是', sample: 'Active' },
  { zh: '专业层次', en: 'Programme Level', type: '文本', required: '否', remark: 'Enrollment Tab', codeSet: '否' },
  { zh: '学制', en: 'Duration', type: '文本', required: '否', remark: 'Enrollment Tab', codeSet: '否' },
  { zh: '学期', en: 'Semester', type: '文本', required: '否', remark: 'Enrollment Tab', codeSet: '否' },
  { zh: '入学批次', en: 'Intake (YYYY/MM)', type: '文本', required: '否', validation: '格式 YYYY/MM', remark: 'Enrollment Tab', codeSet: '否', sample: '2023/09' },
  { zh: '学年学期', en: 'Academic Session', type: '文本', required: '否', remark: 'Enrollment Tab', codeSet: '否' },
  { zh: '学习模式', en: 'Study Mode', type: '枚举', required: '否', remark: 'Enrollment Tab', codeSet: '是', sample: 'Full-time' },
  { zh: '招生人员', en: 'Recruited By', type: '下拉', required: '否', remark: 'Enrollment Tab；China/Intl 为下拉', codeSet: '是' },
  { zh: '招生来源', en: 'Source of Recruit', type: '文本', required: '否', remark: 'Enrollment Tab', codeSet: '否' },
  { zh: '资助类型', en: 'Type of Financial Aid', type: '文本', required: '否', remark: 'Enrollment Tab', codeSet: '否' },
  { zh: '资助金额', en: 'Financial Aid Amount', type: '数字', required: '否', remark: 'Enrollment Tab', codeSet: '否' },
  { zh: '奖学金编号', en: 'Scholarship Offer No.', type: '文本', required: '否', remark: 'Enrollment Tab', codeSet: '否' },
  { zh: '学费（年）', en: 'Tuition Fee (Annual)', type: '数字', required: '否', remark: 'Enrollment Tab', codeSet: '否' },
  { zh: '福建奖学金金额', en: 'Fujian Scholarship Amt', type: '数字', required: '否', remark: 'Enrollment Tab；仅 Local 显示', codeSet: '否' },
  // Contact
  { zh: '手机号', en: 'Mobile Phone', type: '文本', required: '是', validation: '最大 20 字符', remark: 'Contact Tab', codeSet: '否' },
  { zh: '家庭电话', en: 'House Phone', type: '文本', required: '否', remark: 'Contact Tab', codeSet: '否' },
  { zh: '邮箱', en: 'Email', type: '文本', required: '是', validation: '邮箱格式', remark: 'Contact Tab', codeSet: '否' },
  { zh: '永久地址', en: 'Permanent Address', type: '长文本', required: '否', remark: 'Contact Tab', codeSet: '否' },
  { zh: '邮寄地址', en: 'Mailing Address', type: '长文本', required: '否', remark: 'Contact Tab', codeSet: '否' },
  // Education
  { zh: '学历', en: 'Qualification', type: '下拉', required: '否', remark: 'Education Tab', codeSet: '是' },
  { zh: '院校名称', en: 'Institution Name', type: '文本', required: '否', remark: 'Education Tab', codeSet: '否' },
  { zh: '院校所在地', en: 'Institution Location', type: '文本', required: '否', remark: 'Education Tab', codeSet: '否' },
  { zh: '院校类型', en: 'Institution Type', type: '文本', required: '否', remark: 'Education Tab', codeSet: '否' },
  { zh: '毕业年份', en: 'Year Graduated', type: '文本', required: '否', remark: 'Education Tab', codeSet: '否' },
  { zh: '成绩', en: 'Grade/Result', type: '文本', required: '否', remark: 'Education Tab', codeSet: '否' },
  { zh: '科目', en: 'Subject', type: '文本', required: '否', remark: 'Education Tab', codeSet: '否' },
  { zh: '英语考试类型', en: 'English Test Type', type: '文本', required: '否', remark: 'Education Tab / 语言能力', codeSet: '否' },
  { zh: '英语成绩', en: 'English Result', type: '文本', required: '否', remark: 'Education Tab / 语言能力', codeSet: '否' },
  { zh: '英语考试日期', en: 'English Date', type: '日期', required: '否', remark: 'Education Tab / 语言能力', codeSet: '否' },
  { zh: '英语成绩有效期', en: 'English Expiry', type: '日期', required: '否', remark: 'Education Tab / 语言能力', codeSet: '否' },
  { zh: '中文考试成绩', en: 'Chinese Test Result', type: '文本', required: '否', remark: 'Education Tab；Local/International 显示', codeSet: '否' },
  { zh: '中文考试日期', en: 'Chinese Test Date', type: '日期', required: '否', remark: 'Education Tab；Local/International 显示', codeSet: '否' },
  { zh: '中文成绩有效期', en: 'Chinese Test Expiry', type: '日期', required: '否', remark: 'Education Tab；Local/International 显示', codeSet: '否' },
  { zh: '学分转换', en: 'Credit Transfer?', type: '枚举', required: '否', remark: 'Education Tab', codeSet: '是' },
  { zh: '备注', en: 'Remarks', type: '长文本', required: '否', remark: 'Education Tab', codeSet: '否' },
  // Family
  { zh: '家长/监护人姓名', en: 'Family Contact Name', type: '文本', required: '否', remark: 'Family Tab', codeSet: '否' },
  { zh: '身份证/护照', en: 'IC / Passport', type: '文本', required: '否', remark: 'Family Tab', codeSet: '否' },
  { zh: '关系', en: 'Relationship', type: '文本', required: '否', remark: 'Family Tab', codeSet: '否' },
  { zh: '职业', en: 'Occupation', type: '文本', required: '否', remark: 'Family Tab', codeSet: '否' },
  { zh: '种族', en: 'Race', type: '文本', required: '否', remark: 'Family Tab', codeSet: '否' },
  { zh: '手机号', en: 'Mobile Phone', type: '文本', required: '否', remark: 'Family Tab', codeSet: '否' },
  { zh: '办公电话', en: 'Office Phone', type: '文本', required: '否', remark: 'Family Tab', codeSet: '否' },
  { zh: '传真', en: 'Fax', type: '文本', required: '否', remark: 'Family Tab', codeSet: '否' },
  { zh: '邮箱', en: 'Email', type: '文本', required: '否', remark: 'Family Tab', codeSet: '否' },
  { zh: '收入', en: 'Income', type: '数字', required: '否', remark: 'Family Tab', codeSet: '否' },
  { zh: '总负债', en: 'Total Liabilities', type: '数字', required: '否', remark: 'Family Tab', codeSet: '否' },
  { zh: '邮寄地址', en: 'Mailing Address', type: '长文本', required: '否', remark: 'Family Tab', codeSet: '否' },
  // Accommodation
  { zh: '宿舍状态', en: 'Hostel Status', type: '枚举', required: '否', remark: 'Accommodation Tab', codeSet: '是' },
  { zh: '房间类型', en: 'Room Type', type: '文本', required: '否', remark: 'Accommodation Tab', codeSet: '否' },
  { zh: '校区', en: 'Campus', type: '文本', required: '否', remark: 'Accommodation Tab', codeSet: '否' },
  { zh: '楼栋号', en: 'Block No.', type: '文本', required: '否', remark: 'Accommodation Tab', codeSet: '否' },
  { zh: '楼层', en: 'Floor No.', type: '文本', required: '否', remark: 'Accommodation Tab', codeSet: '否' },
  { zh: '单元号', en: 'Unit No.', type: '文本', required: '否', remark: 'Accommodation Tab', codeSet: '否' },
  { zh: '房间号', en: 'Room No.', type: '文本', required: '否', remark: 'Accommodation Tab', codeSet: '否' },
  { zh: '床位号', en: 'Bed No.', type: '文本', required: '否', remark: 'Accommodation Tab', codeSet: '否' },
  { zh: '入住日期', en: 'Check In Date', type: '日期', required: '否', remark: 'Accommodation Tab', codeSet: '否' },
  { zh: '预计退宿日期', en: 'Expected Check Out', type: '日期', required: '否', remark: 'Accommodation Tab', codeSet: '否' },
  { zh: '应收金额', en: 'Amount Receivable', type: '数字', required: '否', remark: 'Accommodation Tab', codeSet: '否' },
  { zh: '已收金额', en: 'Money Received', type: '数字', required: '否', remark: 'Accommodation Tab', codeSet: '否' },
  { zh: '未收金额', en: 'Outstanding Amount', type: '数字', required: '否', remark: 'Accommodation Tab', codeSet: '否' },
  // Others
  { zh: '注册日期', en: 'Registration Date', type: '日期', required: '否', remark: 'Others Tab', codeSet: '否' },
  { zh: '税务登记号', en: 'Tax Registration No.', type: '文本', required: '否', remark: 'Others Tab；仅 Local 显示', codeSet: '否' },
  { zh: '赞助方', en: 'Sponsor', type: '文本', required: '否', remark: 'Others Tab', codeSet: '否' },
  { zh: '备注', en: 'Remarks', type: '长文本', required: '否', remark: 'Others Tab', codeSet: '否' },
  { zh: '状态变更记录', en: 'Status Change Log', type: '长文本', required: '否', remark: 'Others Tab；只读展示', codeSet: '否' },
]

export const transferFormFieldEntries = [
  { zh: '学号', en: 'Student ID', type: '选择', required: '是', validation: '须存在于学生档案', remark: 'Section I 学生详情', codeSet: '否' },
  { zh: '英文姓名', en: 'Full Name', type: '文本', required: '—', remark: 'Section I；只读联动', codeSet: '否' },
  { zh: '身份证/护照号', en: 'NRIC/Passport No.', type: '文本', required: '—', remark: 'Section I；只读', codeSet: '否' },
  { zh: '国籍', en: 'Nationality', type: '文本', required: '—', remark: 'Section I；只读', codeSet: '否' },
  { zh: '邮箱', en: 'Email', type: '文本', required: '—', remark: 'Section I；只读', codeSet: '否' },
  { zh: '联系电话', en: 'Contact No.', type: '文本', required: '—', remark: 'Section I；只读', codeSet: '否' },
  { zh: '学生签证到期日', en: 'Student Visa Expiry Date', type: '日期', required: '—', remark: 'Section I；只读；YYYY-MM-DD', codeSet: '否', sample: '2028-12-31' },
  { zh: '申请学年学期', en: 'Application Academic Session', type: '文本', required: '—', validation: '格式 YYYY/MM', remark: 'Section I 末字段；只读；选学生后写入 enrollment.intake；create 打开时为空', codeSet: '否', sample: '2023/09' },
  { zh: '当前专业', en: 'Current Programme', type: '文本', required: '—', remark: 'Section II；只读', codeSet: '否' },
  { zh: '当前入学批次', en: 'Current Intake', type: '文本', required: '—', remark: 'Section II；只读', codeSet: '否' },
  { zh: '当前学院', en: 'Current School', type: '文本', required: '—', remark: 'Section II；只读', codeSet: '否' },
  { zh: '新专业（第一志愿）', en: 'New Programme (1st Choice)', type: '下拉', required: '是', validation: 'Submit 必填', remark: 'Section II', codeSet: '否' },
  { zh: '新专业（第二志愿）', en: 'New Programme (2nd Choice)', type: '下拉', required: '否', remark: 'Section II', codeSet: '否' },
  { zh: '新专业开始学期', en: 'Start Semester of New Programme', type: '下拉', required: '是', validation: 'Submit 必填', remark: 'Section II', codeSet: '否', sample: '2025/09' },
  { zh: '转专业原因', en: 'Reasons to Transfer Programme', type: '下拉', required: '是', validation: 'Submit 必填', remark: 'Section II；选项来自 PT001 类别配置 reasons；存 reasonId', codeSet: '是' },
  { zh: '同意声明', en: 'Declaration Agree', type: '复选框', required: '是', validation: 'Submit 须勾选', remark: 'Section III', codeSet: '否' },
  { zh: '上传附件', en: 'Upload Attachment', type: '文件', required: '是', validation: '≤5MB', remark: 'Section IV 支持性文件', codeSet: '否' },
  { zh: '新专业（教务核定）', en: 'New Programme (Admin)', type: '文本', required: '—', remark: 'Section VII；申请侧 disabled 置灰只读；新建清空、编辑保留原值；审批 Modal 填写', codeSet: '否' },
  { zh: '新入学批次（教务核定）', en: 'New Intake (Admin)', type: '下拉', required: '—', remark: 'Section VII；申请侧 disabled 置灰；审批 Modal 填写', codeSet: '否' },
  { zh: '日期（教务）', en: 'Date (Admin)', type: '日期', required: '—', remark: 'Section VII；申请侧 disabled 只读 input；审批 Modal 填写；YYYY-MM-DD', codeSet: '否', sample: '2025-09-20' },
]

export const defermentFormFieldEntries = [
  { zh: '学号', en: 'Student ID', type: '选择', required: '是', remark: 'Section I 学生信息', codeSet: '否' },
  { zh: '申请日期', en: 'Date of Application', type: '日期', required: '—', remark: 'Section I；只读；YYYY-MM-DD', codeSet: '否', sample: '2025-09-20' },
  { zh: '姓名', en: 'Name', type: '文本', required: '—', remark: 'Section I；只读', codeSet: '否' },
  { zh: '入学批次', en: 'Intake', type: '文本', required: '—', remark: 'Section I；只读', codeSet: '否' },
  { zh: '身份证/护照号', en: 'NRIC/Passport No.', type: '文本', required: '—', remark: 'Section I；只读', codeSet: '否' },
  { zh: '国籍', en: 'Nationality', type: '文本', required: '—', remark: 'Section I；只读', codeSet: '否' },
  { zh: '专业', en: 'Programme', type: '文本', required: '—', remark: 'Section I；只读', codeSet: '否' },
  { zh: '专业层次', en: 'Programme Level', type: '文本', required: '—', remark: 'Section I；只读', codeSet: '否' },
  { zh: '申请学年学期', en: 'Application Academic Session', type: '文本', required: '—', validation: '格式 YYYY/MM', remark: 'Section I 末字段；只读；选学生后写入 enrollment.intake；create 打开时为空', codeSet: '否', sample: '2023/09' },
  { zh: '个人邮箱', en: 'Personal Email', type: '文本', required: '否', remark: 'Section II 学生申请', codeSet: '否' },
  { zh: '联系电话', en: 'Phone Number', type: '文本', required: '否', remark: 'Section II', codeSet: '否' },
  { zh: '宿舍房间号', en: 'Accommodation Room No.', type: '文本', required: '否', remark: 'Section II', codeSet: '否' },
  { zh: '休学期间', en: 'Deferment Period (YYYY/MM)', type: '下拉', required: '是', validation: 'Submit 必填', remark: 'Section II', codeSet: '否', sample: '2025/09' },
  { zh: '休学主要原因', en: 'Main Reason for Deferment', type: '下拉', required: '是', remark: 'Section II；mainReasonOptions', codeSet: '是' },
  { zh: '详细原因', en: 'Detailed Reason', type: '长文本', required: '否', validation: '最大 2000 字符', remark: 'Section II', codeSet: '否' },
  { zh: '家长/监护人姓名', en: 'Parent/Guardian Name', type: '文本', required: '是', remark: 'Section III 家长同意', codeSet: '否' },
  { zh: '联系电话', en: 'Contact No.', type: '文本', required: '是', remark: 'Section III', codeSet: '否' },
  { zh: '身份证/护照号', en: 'NRIC/Passport No.', type: '文本', required: '否', remark: 'Section III', codeSet: '否' },
  { zh: '关系', en: 'Relationship', type: '文本', required: '否', remark: 'Section III', codeSet: '否' },
  { zh: '邮箱', en: 'Email', type: '文本', required: '否', remark: 'Section III', codeSet: '否' },
  { zh: '上传附件', en: 'Upload Attachment', type: '文件', required: '是', validation: '≤5MB', remark: 'Documents 支持性文件', codeSet: '否' },
]

export const resumptionFormFieldEntries = [
  { zh: '学号', en: 'Student ID', type: '选择', required: '是', remark: 'Section I 学生信息', codeSet: '否' },
  { zh: '申请日期', en: 'Date of Application', type: '日期', required: '—', remark: 'Section I；只读；YYYY-MM-DD', codeSet: '否', sample: '2025-09-20' },
  { zh: '姓名', en: 'Name', type: '文本', required: '—', remark: 'Section I；只读', codeSet: '否' },
  { zh: '原入学批次', en: 'Original Intake', type: '文本', required: '—', remark: 'Section I；只读', codeSet: '否' },
  { zh: '专业', en: 'Programme', type: '文本', required: '—', remark: 'Section I；只读', codeSet: '否' },
  { zh: '专业层次', en: 'Programme Level', type: '文本', required: '—', remark: 'Section I；只读', codeSet: '否' },
  { zh: '身份证/护照号', en: 'NRIC/Passport No.', type: '文本', required: '—', remark: 'Section I；只读', codeSet: '否' },
  { zh: '国籍', en: 'Nationality', type: '文本', required: '—', remark: 'Section I；只读', codeSet: '否' },
  { zh: '申请学年学期', en: 'Application Academic Session', type: '文本', required: '—', validation: '格式 YYYY/MM', remark: 'Section I 末字段；只读；选学生后写入 enrollment.intake；create 打开时为空', codeSet: '否', sample: '2023/09' },
  { zh: '个人邮箱', en: 'Personal Email', type: '文本', required: '否', remark: 'Section II 复学详情', codeSet: '否' },
  { zh: '联系电话', en: 'Phone Number', type: '文本', required: '否', remark: 'Section II', codeSet: '否' },
  { zh: '休学学期', en: 'Deferment Semester', type: '下拉', required: '是', remark: 'Section II', codeSet: '否' },
  { zh: '复学学期', en: 'Resumption Semester', type: '下拉', required: '是', remark: 'Section II', codeSet: '否' },
  { zh: '信息真实完整声明', en: 'Declaration: Information Correct', type: '复选框', required: '是', remark: 'Section III 声明', codeSet: '否' },
  { zh: '最长修读年限知悉声明', en: 'Declaration: Max Study Duration', type: '复选框', required: '是', remark: 'Section III 声明', codeSet: '否' },
  { zh: '上传附件', en: 'Upload Attachment', type: '文件', required: '是', validation: '≤5MB', remark: 'Documents', codeSet: '否' },
]

export const withdrawalFormFieldEntries = [
  { zh: '学号', en: 'Student ID', type: '选择', required: '是', remark: 'Section I 学生信息', codeSet: '否' },
  { zh: '申请日期', en: 'Date of Application', type: '日期', required: '—', remark: 'Section I；只读；YYYY-MM-DD', codeSet: '否', sample: '2025-09-20' },
  { zh: '姓名', en: 'Name', type: '文本', required: '—', remark: 'Section I；只读', codeSet: '否' },
  { zh: '入学批次', en: 'Intake', type: '文本', required: '—', remark: 'Section I；只读', codeSet: '否' },
  { zh: '专业', en: 'Programme', type: '文本', required: '—', remark: 'Section I；只读', codeSet: '否' },
  { zh: '申请学年学期', en: 'Application Academic Session', type: '文本', required: '—', validation: '格式 YYYY/MM', remark: 'Section I 末字段；只读；选学生后写入 enrollment.intake；create 打开时为空', codeSet: '否', sample: '2023/09' },
  { zh: '个人邮箱', en: 'Personal Email', type: '文本', required: '是', remark: 'Section II 学生申请', codeSet: '否' },
  { zh: '联系电话', en: 'Phone Number', type: '文本', required: '是', remark: 'Section II', codeSet: '否' },
  { zh: '最后出勤日期', en: 'Last Date of Attendance', type: '日期', required: '是', remark: 'Section II；YYYY-MM-DD', codeSet: '否', sample: '2025-09-20' },
  { zh: '离校去向', en: 'Destination after Leaving', type: '文本', required: '是', remark: 'Section II', codeSet: '否' },
  { zh: '主要退学原因', en: 'Main Reason for Withdrawal', type: '下拉', required: '是', remark: 'Section II', codeSet: '是' },
  { zh: '目前所在地', en: 'Current Whereabout', type: '文本', required: '是', remark: 'Section II', codeSet: '否' },
  { zh: '详细原因', en: 'Detailed Reason', type: '长文本', required: '是', remark: 'Section II', codeSet: '否' },
  { zh: '信息真实完整声明', en: 'Declaration: Information Correct', type: '复选框', required: '是', remark: 'Section III 声明', codeSet: '否' },
  { zh: '家长/监护人姓名', en: 'Parent/Guardian Name', type: '文本', required: '是', remark: 'Section III 家长同意', codeSet: '否' },
  { zh: '联系电话', en: 'Contact No.', type: '文本', required: '是', remark: 'Section III', codeSet: '否' },
  { zh: '身份证/护照号', en: 'NRIC/Passport No.', type: '文本', required: '是', remark: 'Section III', codeSet: '否' },
  { zh: '关系', en: 'Relationship', type: '文本', required: '是', remark: 'Section III', codeSet: '否' },
  { zh: '邮箱', en: 'Email', type: '文本', required: '是', remark: 'Section III', codeSet: '否' },
  { zh: '上传附件', en: 'Upload Attachment', type: '文件', required: '是', validation: '≤5MB', remark: 'Documents', codeSet: '否' },
  { zh: 'ISAO 提示', en: 'ISAO Note', type: '提示', required: '—', remark: 'Section II；仅 International 显示', codeSet: '否' },
]

export const approvalFormFieldEntries = [
  { zh: '审批结果', en: 'Action (Approved/Rejected/Update Required)', type: '单选', required: '是', remark: 'MovementApprovalModal 确认审批', codeSet: '是' },
  { zh: '办理意见', en: 'Comments', type: '长文本', required: '条件必填', validation: 'Reject/Update Required 必填；最大 200 字', remark: 'MovementApprovalModal', codeSet: '否' },
  { zh: '新专业（教务核定）', en: 'New Programme (Admin)', type: '文本', required: '条件必填', remark: '转专业 Dean/HoP 节点；MovementApprovalModal 内填写', codeSet: '否' },
  { zh: '新入学批次（教务核定）', en: 'New Intake (Admin)', type: '下拉', required: '否', remark: '转专业 Dean/HoP 节点；MovementApprovalModal', codeSet: '否' },
]

export const categoryFormFieldEntries = [
  { zh: '类别编码', en: 'Category Code', type: '文本', required: '是', validation: '全局唯一', remark: 'Row1 左；新增/编辑弹窗', codeSet: '否', sample: 'PT001' },
  { zh: '类别名称', en: 'Category Name', type: '文本', required: '是', remark: 'Row1 右', codeSet: '否', sample: 'Programme Transfer' },
  { zh: '学籍状态', en: 'Student Status', type: '下拉', required: '是', remark: 'Row2 左', codeSet: '是', sample: 'Active' },
  { zh: '类别', en: 'Category', type: '下拉', required: '是', remark: 'Row2 右；全量 trackCategoryOptions，不与学籍状态联动过滤', codeSet: '是', sample: 'Programme Transfer' },
  { zh: '修改学籍状态', en: 'Modify Student Status', type: '开关', required: '否', validation: '默认关', remark: 'Row3 左；hint 说明实施时是否回写档案学籍状态', codeSet: '否' },
  { zh: '修改学籍类型', en: 'Modify Student Type', type: '开关', required: '否', validation: '默认关', remark: 'Row3 右；hint 说明实施时是否回写档案 track category', codeSet: '否' },
  { zh: '是否自动实施', en: 'Auto Implement', type: '开关', required: '否', validation: '默认关', remark: 'Row4 左；审批通过后自动 Implemented', codeSet: '否' },
  { zh: '允许学生申请', en: 'Allow Student Apply', type: '单选', required: '是', validation: 'Yes/No；默认 Yes', remark: 'Row4 右', codeSet: '是', sample: 'Yes' },
]

export const categoryReasonFieldEntries = [
  { zh: '原因名称', en: 'Reason Name', type: '文本', required: '是', validation: '非空', remark: '设置原因弹窗内小弹窗', codeSet: '否', sample: 'Health Issue' },
]

export const maintenanceReadonlyNoteFieldEntries = [
  { zh: '（无行内编辑表单）', en: '(No inline edit form)', type: '—', required: '—', remark: 'V1.9 移除行内 Edit 与「修改异动编号」；工具栏保留实施、导出、删除；行操作仅详情与流转日志', codeSet: '否' },
]

/** @deprecated V1.9 维护页已无 Edit 弹窗，保留供历史脚本引用 */
export const maintenanceEditFieldEntries = [
  { zh: '异动编号', en: 'Movement Number', type: '文本', required: '否', remark: '已移除', codeSet: '否', sample: 'MV2025001' },
]

export const queryReadonlyNoteFieldEntries = [
  { zh: '（无新增表单）', en: '(No create/edit form)', type: '—', required: '—', remark: '查询页为只读宽表，无新增/编辑表单；详情与流转日志复用审批只读组件；详情敏感字段脱敏', codeSet: '否' },
]

export const consentFormFieldEntries = [
  { zh: '知情同意书名称', en: 'Consent Form Name', type: '文本', required: '是', validation: '非空', remark: 'Create/Edit Modal', codeSet: '否' },
  { zh: '适用异动类别', en: 'Applicable Movement Type', type: '下拉', required: '是', validation: '四 Tab 枚举', remark: '转专业/休学/复学/退学', codeSet: '是' },
  { zh: 'Student Type', en: 'Student Type', type: '下拉', required: '是', validation: 'Local/Chinese/International', remark: '中文界面「中国」', codeSet: '是' },
  { zh: 'Remark', en: 'Remark', type: '长文本', required: '否', remark: '可选多行', codeSet: '否' },
  { zh: '学生知情同意书', en: 'Student Consent Letter', type: '文件', required: '是', validation: 'Upload mock', remark: '必填附件', codeSet: '否' },
  { zh: '家长知情同意书', en: 'Parent Consent Letter', type: '文件', required: '否', validation: 'Upload mock 可选', remark: '休学/退学等场景可选', codeSet: '否' },
]
