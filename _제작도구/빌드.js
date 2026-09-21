// 소스-*.html 을 순서대로 합치고, 사진/ 의 jpg 를 base64 로 심어 모집페이지.html 을 만든다.
// 몇 번을 돌려도 결과가 같다(소스는 건드리지 않는다).
//   node "_제작도구/빌드.js"
const fs = require('fs');
const path = require('path');

const root     = path.resolve(__dirname, '..');
const toolDir  = path.join(root, '_제작도구');
const photoDir = path.join(root, '사진');
const out      = path.join(root, 'index.html'); // GitHub Pages 가 찾는 이름

const parts = fs.readdirSync(toolDir)
  .filter(f => /^소스-\d+-.*\.html$/.test(f))
  .sort();

if (!parts.length) { console.error('소스 파일이 없습니다.'); process.exit(1); }

let html = parts
  .map(f => fs.readFileSync(path.join(toolDir, f), 'utf8').replace(/\s+$/, ''))
  .join('\n\n');

let planted = 0, missing = [];

html = html.replace(
  /<figure([^>]*?)data-photo="([^"]+)"([^>]*)>([\s\S]*?)<\/figure>/g,
  (whole, before, name, after, inner) => {
    const file = path.join(photoDir, name + '.jpg');
    if (!fs.existsSync(file)) { missing.push(name); return `<!-- 사진 없음: ${name} -->`; }
    const b64 = fs.readFileSync(file).toString('base64');
    const withSrc = inner.replace(/<img\s/, `<img src="data:image/jpeg;base64,${b64}" `);
    if (withSrc === inner) { missing.push(name + ' (img 태그 없음)'); return whole; }
    planted++;
    return `<figure${before}data-photo="${name}"${after}>${withSrc}</figure>`;
  }
);

fs.writeFileSync(out, html, 'utf8');

const kb = n => (n / 1024).toFixed(0) + 'KB';
console.log(`파트 ${parts.length}개 → ${path.basename(out)} (${kb(Buffer.byteLength(html))})`);
console.log(`사진 ${planted}장 심음` + (missing.length ? ` · 빠짐: ${missing.join(', ')}` : ''));
