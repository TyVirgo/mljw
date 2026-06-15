import fs from 'fs'
import JSZip from 'jszip'
import {
  PROFILE_FORM_PAGE,
  profileFormFieldGroups,
  transferFormFieldGroups,
} from './prd/prd-field-groups.mjs'

console.log('profile groups:', profileFormFieldGroups.length, profileFormFieldGroups.map((g) => g.title))
console.log('transfer groups:', transferFormFieldGroups.length)

const p = 'c:/Users/admin/Desktop/马来教务/模板/厦大马来分校本科教务系统产品需求文档-学籍管理模块-V1.5.docx'
const zip = await JSZip.loadAsync(fs.readFileSync(p))
const xml = await zip.file('word/document.xml').async('string')

const checks = [
  '（2）新增—字段信息表',
  '（3）菜单功能清单',
  '新增—字段信息表',
  '菜单功能清单',
  `${PROFILE_FORM_PAGE}——Tab2（基本信息`,
  'Tab1（Section I 学生详情',
  '1、页面展示字段信息',
  '3、数据前后流转关系',
]
for (const c of checks) console.log(c, xml.includes(c) ? 'OK' : 'MISSING')

const dup2 = (xml.match(/（2）新增/g) || []).length
const dup3 = (xml.match(/（3）菜单/g) || []).length
console.log('duplicate (2) count:', dup2, 'duplicate (3) count:', dup3)
