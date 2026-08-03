import { createColumnHeaderStore } from '../utils/columnHeaderConfig.js'

function h(id, group, nameZh, nameEn, nameMs = nameEn) {
  return { id, group, nameZh, nameEn, nameMs }
}

export const defaultProgrammeVersionColumnHeaders = [
  // 列表主表
  h('programmeCode', 'listMain', '专业代码', 'Programme Code', 'Kod Program'),
  h('programmeName', 'listMain', '专业名称', 'Programme Name', 'Nama Program'),
  h('programmeLevel', 'listMain', '培养层次', 'Programme Level', 'Tahap Pengajian'),
  h('years', 'listMain', '学制', 'Years', 'Tempoh Pengajian'),
  h('schoolElectiveCategory', 'listMain', '校选类别', 'School Elective Category', 'Kategori Elektif Sekolah'),
  // 列表版本明细
  h('mqaCode', 'listNested', 'MQA 编码', 'MQA Code', 'Kod MQA'),
  h('mqaValidityStart', 'listNested', 'MQA 有效期开始', 'MQA Validity Start Date', 'Tarikh Mula Sah MQA'),
  h('mqaValidityExpiry', 'listNested', 'MQA 有效期结束', 'MQA Validity Expiry Date', 'Tarikh Tamat Sah MQA'),
  h('moheCode', 'listNested', 'MOHE 编码', 'MOHE Code', 'Kod MOHE'),
  h('approvalDate', 'listNested', '批准日期', 'Approval Date', 'Tarikh Kelulusan'),
  h('moheValidityStart', 'listNested', 'MOHE 有效期开始', 'MOHE Validity Start Date', 'Tarikh Mula Sah MOHE'),
  h('moheValidityExpiry', 'listNested', 'MOHE 有效期结束', 'MOHE Validity Expiry Date', 'Tarikh Tamat Sah MOHE'),
  h('versionPublish', 'listNested', '版本发布', 'Version Publish', 'Terbitan Versi'),
  // 新增 - 培养方案信息
  h('programmeNameEn', 'programmeInfo', '培养方案名称（英文）', 'Programme Name_EN', 'Nama Program (EN)'),
  h('programmeNameMal', 'programmeInfo', '培养方案名称（马来语）', 'Programme Name_MAL', 'Nama Program (MAL)'),
  h('idCode', 'programmeInfo', 'ID 编码', 'ID Code', 'Kod ID'),
  h('nec', 'programmeInfo', 'National Education Code (NEC)', 'National Education Code (NEC)', 'Kod Pendidikan Kebangsaan (NEC)'),
  h('studyDurationChinese', 'programmeInfo', '中国学生学制', 'Study Duration for Chinese Students', 'Tempoh Pengajian Pelajar China'),
  h('levelOfStudy', 'programmeInfo', '层次', 'Level', 'Tahap'),
  h('fieldOfStudy', 'programmeInfo', '学科领域', 'Field of Study', 'Bidang Pengajian'),
  h('typeOfProgramme', 'programmeInfo', '培养方案类型', 'Type of Programme', 'Jenis Program'),
  h('methodOfLearning', 'programmeInfo', '学习与教学方式', 'Method of Learning and Teaching', 'Kaedah Pembelajaran dan Pengajaran'),
  h('modeOfStudy', 'programmeInfo', '学习模式', 'Mode of Study', 'Mod Pengajian'),
  h('mediumOfInstruction', 'programmeInfo', '授课语言', 'Medium of Instruction', 'Medium Pengajaran'),
  h('methodOfDelivery', 'programmeInfo', '授课方式', 'Method of Delivery', 'Kaedah Penyampaian'),
  h('modeOfOffer', 'programmeInfo', '开设模式', 'Mode of Offer', 'Mod Tawaran'),
  h('awardingBody', 'programmeInfo', '授予机构', 'Awarding body', 'Badan Penganugerahan'),
  h('department', 'programmeInfo', '院系', 'Department', 'Jabatan'),
  h('schoolElectiveCategory', 'programmeInfo', '校选类别', 'School Elective Category', 'Kategori Elektif Sekolah'),
  h('progCommence', 'programmeInfo', '开课时间', 'Prog. Commence', 'Tarikh Mula Program'),
  h('advertisementCode', 'programmeInfo', '广告编码', 'Advertisement Code', 'Kod Iklan'),
  h('accStatus', 'programmeInfo', '认证状态', 'Acc. Status', 'Status Akreditasi'),
  h('longSemesterWeeks', 'programmeInfo', '长学期周数', 'No. of weeks (Long Semester)', 'Bil. Minggu (Semester Panjang)'),
  h('longSemesterCount', 'programmeInfo', '长学期学期数', 'No. of semester (Long Semester)', 'Bil. Semester (Semester Panjang)'),
  h('shortSemesterWeeks', 'programmeInfo', '短学期周数', 'No. of weeks (Short Semester)', 'Bil. Minggu (Semester Pendek)'),
  h('shortSemesterCount', 'programmeInfo', '短学期学期数', 'No. of semester (Short Semester)', 'Bil. Semester (Semester Pendek)'),
  h('industrialTrainingWeeks', 'programmeInfo', '工业培训周数', 'No. of weeks (Industrial Training)', 'Bil. Minggu (Latihan Industri)'),
  h('industrialTrainingCount', 'programmeInfo', '工业培训学期数', 'No. of semester (Industrial Training)', 'Bil. Semester (Latihan Industri)'),
  h('attachments', 'programmeInfo', '附件', 'Attachments', 'Lampiran'),
  h('attachmentDescription', 'programmeInfo', '附件说明', 'Description', 'Keterangan'),
  // 新增 - MQA 信息
  h('mqaStartDate', 'approvalMqa', '开始日期（MQA）', 'Start Date (MQA)', 'Tarikh Mula (MQA)'),
  h('mqaExpiryDate', 'approvalMqa', '到期日期（MQA）', 'Expiry Date (MQA)', 'Tarikh Tamat (MQA)'),
  h('mqaSyorDatePa', 'approvalMqa', 'Syor 日期（PA）', 'Syor Date(PA)', 'Tarikh Syor (PA)'),
  h('mqaSyorReferencePa', 'approvalMqa', 'Syor 参考号（PA）', 'Syor Reference (PA)', 'Rujukan Syor (PA)'),
  h('mqaSyorDateFa', 'approvalMqa', 'Syor 日期（FA）', 'Syor Date(FA)', 'Tarikh Syor (FA)'),
  h('mqaSyorReferenceFa', 'approvalMqa', 'Syor 参考号（FA）', 'Syor Reference (FA)', 'Rujukan Syor (FA)'),
  h('mqaFirstIntakeDuration', 'approvalMqa', '批准中的首次入学学制', 'First intake duration as in approval', 'Tempoh kemasukan pertama seperti dalam kelulusan'),
  // 新增 - MOHE 信息
  h('moheApprovalReferenceNo', 'approvalMohe', 'MOHE 批准参考号', 'MOHE Approval Reference No.', 'No. Rujukan Kelulusan MOHE'),
  h('moheApprovalDate', 'approvalMohe', '批准日期（MOHE）', 'Approval Date (MOHE)', 'Tarikh Kelulusan (MOHE)'),
  h('moheStartDate', 'approvalMohe', '开始日期（MOHE）', 'Start Date (MOHE)', 'Tarikh Mula (MOHE)'),
  h('moheExpiryDate', 'approvalMohe', '到期日期（MOHE）', 'Expiry Date (MOHE)', 'Tarikh Tamat (MOHE)'),
  // 新增 - 入学要求
  h('muet', 'entryRequirements', 'MUET', 'MUET', 'MUET'),
  h('ielts', 'entryRequirements', 'IELTS', 'IELTS', 'IELTS'),
  h('toeflIbt', 'entryRequirements', 'TOEFL IBT', 'TOEFL IBT', 'TOEFL IBT'),
  h('toeflEssentials', 'entryRequirements', 'TOEFL Essentials（在线）', 'TOEFL Essentials (Online)', 'TOEFL Essentials (Dalam Talian)'),
  h('pearsonTestOfEnglish', 'entryRequirements', 'PEARSON TEST OF ENGLISH', 'PEARSON TEST OF ENGLISH', 'PEARSON TEST OF ENGLISH'),
  h('cambridgeEnglishIii', 'entryRequirements', 'CAMBRIDGE ENGLISH(iii)', 'CAMBRIDGE ENGLISH(iii)', 'CAMBRIDGE ENGLISH(iii)'),
  h('cambridgeEnglishI/ii', 'entryRequirements', 'CAMBRIDGE ENGLISH(i/ii)', 'CAMBRIDGE ENGLISH(i/ii)', 'CAMBRIDGE ENGLISH(i/ii)'),
  h('els', 'entryRequirements', 'ELS', 'ELS', 'ELS'),
  // 新增 - 门槛分数
  h('totalContinuousAssessment', 'thresholdMarks', '持续评估总分', 'Total Continuous Assessment', 'Jumlah Penilaian Berterusan'),
  h('totalFinalAssessment', 'thresholdMarks', '期末评估总分', 'Total Final Assessment', 'Jumlah Penilaian Akhir'),
  h('overallScore', 'thresholdMarks', '总评分', 'Overall Score', 'Skor Keseluruhan'),
  // 新增 - 费用结构
  h('durationMinYear', 'feeStructure', '学制（最低年数）', 'Duration (Min. Year)', 'Tempoh (Tahun Min.)'),
  h('typeOfApproval', 'feeStructure', '批准类型', 'Type of Approval', 'Jenis Kelulusan'),
  h('checkTotalLocal', 'feeStructure', '核对合计（本地学生）', 'Check Total (Local Student)', 'Semak Jumlah (Pelajar Tempatan)'),
  h('checkTotalInternational', 'feeStructure', '核对合计（国际学生）', 'Check Total (International Student)', 'Semak Jumlah (Pelajar Antarabangsa)'),
  // 新增 - 本地学生费用
  h('localTuitionFee', 'feeLocal', '学费', 'Tuition Fee', 'Yuran Pengajian'),
  h('localApplicationFee', 'feeLocal', '申请费（不退还）', 'Application Fee (Non-Refundable)', 'Yuran Permohonan (Tidak Boleh Dibayar Balik)'),
  h('localRegistrationFee', 'feeLocal', '注册费（不退还）', 'Registration Fee (Non-Refundable)', 'Yuran Pendaftaran (Tidak Boleh Dibayar Balik)'),
  h('localTuitionDeposit', 'feeLocal', '学费押金（可退还）', 'Tuition Deposit (Refundable)', 'Deposit Yuran (Boleh Dibayar Balik)'),
  h('localResourcesFacilities', 'feeLocal', '资源/设施费', 'Resources/ Facilities', 'Sumber/ Kemudahan'),
  h('localOthers', 'feeLocal', '其他', 'Others', 'Lain-lain'),
  h('localTotalPerProgramme', 'feeLocal', '培养方案合计', 'Total per programme', 'Jumlah setiap program'),
  h('localJumlahYuran', 'feeLocal', '全程费用合计（批准函）', 'Jumlah Yuran Sepanjang Tempoh (Approval Letter)', 'Jumlah Yuran Sepanjang Tempoh (Surat Kelulusan)'),
  // 新增 - 国际学生费用
  h('intlTuitionFee', 'feeInternational', '学费', 'Tuition Fee', 'Yuran Pengajian'),
  h('intlApplicationFee', 'feeInternational', '申请费（不退还）', 'Application Fee (Non-Refundable)', 'Yuran Permohonan (Tidak Boleh Dibayar Balik)'),
  h('intlRegistrationFee', 'feeInternational', '注册费（不退还）', 'Registration Fee (Non-Refundable)', 'Yuran Pendaftaran (Tidak Boleh Dibayar Balik)'),
  h('intlTuitionDeposit', 'feeInternational', '学费押金（可退还）', 'Tuition Deposit (Refundable)', 'Deposit Yuran (Boleh Dibayar Balik)'),
  h('intlResourcesFacilities', 'feeInternational', '资源/设施费', 'Resources/ Facilities', 'Sumber/ Kemudahan'),
  h('intlOthers', 'feeInternational', '其他', 'Others', 'Lain-lain'),
  h('intlPentadbiranPelajarAntarabangsa', 'feeInternational', '国际生管理费', 'Pentadbiran Pelajar Antarabangsa', 'Pentadbiran Pelajar Antarabangsa'),
  h('intlTotalPerProgramme', 'feeInternational', '培养方案合计', 'Total per programme', 'Jumlah setiap program'),
  h('intlJumlahYuran', 'feeInternational', '全程费用合计（批准函）', 'Jumlah Yuran Sepanjang Tempoh (Approval Letter)', 'Jumlah Yuran Sepanjang Tempoh (Surat Kelulusan)'),
]

export const programmeVersionColumnHeaderSections = [
  { id: 'listMain', labelKey: 'pages.programmeVersion.columnHeaderListMain' },
  { id: 'listNested', labelKey: 'pages.programmeVersion.columnHeaderListNested' },
  { id: 'programmeInfo', labelKey: 'pages.programmeVersion.columnHeaderProgrammeInfo' },
  { id: 'approvalMqa', labelKey: 'pages.programmeVersion.columnHeaderApprovalMqa' },
  { id: 'approvalMohe', labelKey: 'pages.programmeVersion.columnHeaderApprovalMohe' },
  { id: 'entryRequirements', labelKey: 'pages.programmeVersion.columnHeaderEntryRequirements' },
  { id: 'thresholdMarks', labelKey: 'pages.programmeVersion.columnHeaderThresholdMarks' },
  { id: 'feeStructure', labelKey: 'pages.programmeVersion.columnHeaderFeeStructure' },
  { id: 'feeLocal', labelKey: 'pages.programmeVersion.columnHeaderFeeLocal' },
  { id: 'feeInternational', labelKey: 'pages.programmeVersion.columnHeaderFeeInternational' },
]

export const programmeVersionColumnHeaderStore = createColumnHeaderStore(
  'jw-programme-version-column-headers',
  defaultProgrammeVersionColumnHeaders,
)

export const {
  load: loadProgrammeVersionColumnHeaders,
  save: saveProgrammeVersionColumnHeaders,
  resolve: resolveProgrammeVersionColumnHeader,
} = programmeVersionColumnHeaderStore
