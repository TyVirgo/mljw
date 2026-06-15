/**
 * 按 Tab/Section 分组字段条目，供 buildGroupedFormFieldTable 使用
 */
import {
  profileFormFieldEntries,
  transferFormFieldEntries,
  defermentFormFieldEntries,
  resumptionFormFieldEntries,
  withdrawalFormFieldEntries,
  approvalFormFieldEntries,
} from './prd-fields.mjs'

function pick(entries, tabKey) {
  return entries.filter((e) => e.remark?.includes(tabKey))
}

function pickSection(entries, sectionPrefix) {
  return entries.filter((e) => e.remark?.startsWith(sectionPrefix) || e.remark?.includes(`${sectionPrefix}；`))
}

export const PROFILE_FORM_PAGE = '新增/编辑学生档案页面'

export const profileFormFieldGroups = [
  {
    title: 'Tab1（顶栏配置、英文名：Student Category）',
    entries: profileFormFieldEntries.filter((e) => e.en === 'Student Category'),
  },
  {
    title: 'Tab2（基本信息、英文名：Basic Info）',
    entries: pick(profileFormFieldEntries, 'Basic Info'),
  },
  {
    title: 'Tab3（学籍信息、英文名：Enrollment）',
    entries: pick(profileFormFieldEntries, 'Enrollment'),
  },
  {
    title: 'Tab4（联系方式、英文名：Contact）',
    entries: pick(profileFormFieldEntries, 'Contact'),
  },
  {
    title: 'Tab5（教育背景、英文名：Education）',
    entries: pick(profileFormFieldEntries, 'Education'),
  },
  {
    title: 'Tab6（家庭信息、英文名：Family）',
    entries: pick(profileFormFieldEntries, 'Family'),
  },
  {
    title: 'Tab7（住宿信息、英文名：Accommodation）',
    entries: pick(profileFormFieldEntries, 'Accommodation'),
  },
  {
    title: 'Tab8（其他信息、英文名：Others）',
    entries: pick(profileFormFieldEntries, 'Others'),
  },
].filter((g) => g.entries.length)

export const TRANSFER_FORM_PAGE = '新增/编辑转专业申请页面'

export const transferFormFieldGroups = [
  { title: 'Tab1（Section I 学生详情、英文名：Student Details）', entries: pickSection(transferFormFieldEntries, 'Section I') },
  { title: 'Tab2（Section II 转专业信息、英文名：Programme Transfer Info）', entries: pickSection(transferFormFieldEntries, 'Section II') },
  { title: 'Tab3（Section III 声明、英文名：Declaration）', entries: pickSection(transferFormFieldEntries, 'Section III') },
  { title: 'Tab4（Section IV 支持性文件、英文名：Supporting Documents）', entries: pickSection(transferFormFieldEntries, 'Section IV') },
  { title: 'Tab5（Section VII 教务专用、英文名：Academic Affairs Use Only）', entries: pickSection(transferFormFieldEntries, 'Section VII') },
].filter((g) => g.entries.length)

export const DEFERMENT_FORM_PAGE = '新增/编辑休学申请页面'

export const defermentFormFieldGroups = [
  { title: 'Tab1（Section I 学生信息、英文名：Student Information）', entries: pickSection(defermentFormFieldEntries, 'Section I') },
  { title: 'Tab2（Section II 学生申请、英文名：Student Application）', entries: pickSection(defermentFormFieldEntries, 'Section II') },
  { title: 'Tab3（Section III 家长同意、英文名：Parent/Guardian Consent）', entries: pickSection(defermentFormFieldEntries, 'Section III') },
  { title: 'Tab4（Documents 支持性文件、英文名：Supporting Documents）', entries: defermentFormFieldEntries.filter((e) => e.remark?.includes('Documents')) },
].filter((g) => g.entries.length)

export const RESUMPTION_FORM_PAGE = '新增/编辑复学申请页面'

export const resumptionFormFieldGroups = [
  { title: 'Tab1（Section I 学生信息、英文名：Student Information）', entries: pickSection(resumptionFormFieldEntries, 'Section I') },
  { title: 'Tab2（Section II 复学详情、英文名：Resumption Details）', entries: pickSection(resumptionFormFieldEntries, 'Section II') },
  { title: 'Tab3（Section III 声明、英文名：Declaration）', entries: pickSection(resumptionFormFieldEntries, 'Section III') },
  { title: 'Tab4（Documents 支持性文件、英文名：Supporting Documents）', entries: resumptionFormFieldEntries.filter((e) => e.remark?.includes('Documents')) },
].filter((g) => g.entries.length)

export const WITHDRAWAL_FORM_PAGE = '新增/编辑退学申请页面'

export const withdrawalFormFieldGroups = [
  { title: 'Tab1（Section I 学生信息、英文名：Student Information）', entries: pickSection(withdrawalFormFieldEntries, 'Section I') },
  { title: 'Tab2（Section II 学生申请、英文名：Student Application）', entries: pickSection(withdrawalFormFieldEntries, 'Section II') },
  { title: 'Tab3（Section III 家长同意、英文名：Parent/Guardian Consent）', entries: pickSection(withdrawalFormFieldEntries, 'Section III') },
  { title: 'Tab4（Documents 支持性文件、英文名：Supporting Documents）', entries: withdrawalFormFieldEntries.filter((e) => e.remark?.includes('Documents')) },
].filter((g) => g.entries.length)

export const APPROVAL_FORM_PAGE = '异动审批操作页面'

export const approvalFormFieldGroups = [
  { title: 'Tab1（审批操作字段、英文名：Approval Actions）', entries: approvalFormFieldEntries },
]
