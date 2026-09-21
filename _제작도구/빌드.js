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

// ── 정식 HTML 로 감싼다 ──────────────────────────────────────────
// 소스 조각은 <meta charset> + <title> + 폰트 <link> + <style> 로 시작하고
// 그 뒤가 본문이다. 마지막 </style> 을 경계로 잘라 head / body 로 나눈다.
const cut = html.lastIndexOf('</style>');
if (cut < 0) { console.error('</style> 을 찾지 못해 head 를 나눌 수 없습니다.'); process.exit(1); }
const headSrc = html.slice(0, cut + '</style>'.length);
const bodySrc = html.slice(cut + '</style>'.length).replace(/^\s+/, '');

const SITE = 'https://joonhabaek00.github.io/chungju-claudecode-workshop/';
const DESC = 'AI로 뭘 해야 할지 모르겠다면, 일단 하나 만들어 보세요. '
           + '충주 관아골에서 밤 8시부터 세 시간, 가게나 일에 쓸 것 하나를 직접 만들어 '
           + '인터넷 주소까지 만들고 가는 실습 수업입니다. 10/16~31 중 하루, 90,000원.';
// 탭 아이콘: 노란 사각 안의 검은 점 하나 (페이지 팔레트와 같다)
const ICON = 'data:image/svg+xml,'
  + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">'
  + '<rect width="32" height="32" fill="%230A0A09"/>'
  + '<rect x="6" y="6" width="20" height="20" fill="%23FFE500"/></svg>').replace(/'/g, '%27');

const head = headSrc
  .replace('<meta charset="utf-8">',
    '<meta charset="utf-8">\n'
    + '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
    + `<meta name="description" content="${DESC}">\n`
    + '<meta name="author" content="백준하 · 관아골 하이라이트">\n'
    + '<meta property="og:type" content="website">\n'
    + '<meta property="og:site_name" content="충주 클로드코드 워크숍">\n'
    + '<meta property="og:locale" content="ko_KR">\n'
    + '<meta property="og:title" content="AI로 뭘 해야 할지 모르겠다면, 일단 하나 만들어 보세요">\n'
    + `<meta property="og:description" content="${DESC}">\n`
    + `<meta property="og:url" content="${SITE}">\n`
    + `<meta property="og:image" content="${SITE}og.jpg">\n`
    + '<meta property="og:image:width" content="1200">\n'
    + '<meta property="og:image:height" content="630">\n'
    + '<meta name="twitter:card" content="summary_large_image">\n'
    + '<meta name="twitter:title" content="AI로 뭘 해야 할지 모르겠다면, 일단 하나 만들어 보세요">\n'
    + `<meta name="twitter:description" content="${DESC}">\n`
    + `<meta name="twitter:image" content="${SITE}og.jpg">\n`
    + `<link rel="icon" href="${ICON}">`);

const page = `<!doctype html>\n<html lang="ko">\n<head>\n${head}\n</head>\n<body>\n${bodySrc}\n</body>\n</html>\n`;

fs.writeFileSync(out, page, 'utf8');

const kb = n => (n / 1024).toFixed(0) + 'KB';
console.log(`파트 ${parts.length}개 → ${path.basename(out)} (${kb(Buffer.byteLength(page))})`);
console.log(`사진 ${planted}장 심음` + (missing.length ? ` · 빠짐: ${missing.join(', ')}` : ''));
console.log('정식 HTML 래퍼 + 공유 카드(OG) 포함');
