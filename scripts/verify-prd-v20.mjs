import fs from 'fs';
import JSZip from 'jszip';

const TARGET =
  'c:\\Users\\admin\\Desktop\\马来教务\\模板\\厦大马来分校本科教务系统产品需求文档-学籍管理模块-V2.0.docx';

const buf = fs.readFileSync(TARGET);
const zip = await JSZip.loadAsync(buf);
const xml = await zip.file('word/document.xml').async('string');

const checks = [
  '文档版本：V2.0',
  'V2.0 增量约定见 §2.6',
  'MovementApplicationDetailDrawer',
  'ApprovalTimeline',
  '通过/不通过/驳回',
  '国籍信息',
  '版本快照',
  'Status Log',
  '状态日志',
  'AttachmentPreviewModal',
  '2.6 V2.0',
];

for (const s of checks) {
  console.log(s, xml.includes(s) ? 'OK' : 'MISSING');
}

const outdated = [
  '文档版本：V1.9',
  'MovementApprovalReviewView',
  'Details | Log',
];

console.log('\n--- 应减少出现的旧描述 ---');
for (const s of outdated) {
  const n = xml.split(s).length - 1;
  console.log(s, 'count=', n);
}
