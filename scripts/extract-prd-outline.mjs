import fs from 'fs';

const xmlPath = process.argv[2] || 'temp-prd-extract/word/document.xml';
const xml = fs.readFileSync(xmlPath, 'utf8');
const paras = xml.match(/<w:p[\s\S]*?<\/w:p>/g) || [];

paras.forEach((p, i) => {
  const pStyle = p.match(/<w:pStyle w:val="([^"]+)"/);
  const style = pStyle ? pStyle[1] : '';
  const texts = [...p.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join('');
  if (!texts.trim()) return;
  console.log(`${String(i + 1).padStart(4)} [${style}] ${texts.slice(0, 150)}`);
});
