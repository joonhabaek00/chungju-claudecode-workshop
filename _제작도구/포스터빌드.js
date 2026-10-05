// 포스터-소스.html 의 data-qr / data-icon 자리에 SVG 를 심어 홍보물/포스터.html 을 만든다. (멱등)
//   node "_제작도구/포스터빌드.js"
//
// qr-네이버예약.svg       — qrcode-generator 로 뽑은 25×25 path. fill 은 currentColor 라 색은 CSS 가 정한다.
//                           예약 링크가 바뀌면 이 파일만 갈아 끼우면 된다.
// 아이콘-클로드코드.svg   — 직접 그린 8방향 sunburst. 공식 로고가 아니고 「이 도구」를 가리키는 표시다.
//                           화면 모사 블록(.tm) 안에서만 쓰고 헤더에 로고처럼 박지 않는다.
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src  = path.join(__dirname, '포스터-소스.html');
const qr   = fs.readFileSync(path.join(__dirname, 'qr-네이버예약.svg'), 'utf8').trim();
const icon = fs.readFileSync(path.join(__dirname, '아이콘-클로드코드.svg'), 'utf8').trim();
const outDir = path.join(root, '홍보물');
fs.mkdirSync(outDir, { recursive: true });

let html = fs.readFileSync(src, 'utf8');

let nq = 0, ni = 0;
html = html.replace(/(<div class="qr" data-qr>)(\s*)(<\/div>)/g, (m, a, _s, b) => {
  nq++; return a + qr + b;
});
html = html.replace(/(<span class="ccmark" data-icon>)(\s*)(<\/span>)/g, (m, a, _s, b) => {
  ni++; return a + icon + b;
});

const out = path.join(outDir, '포스터.html');
fs.writeFileSync(out, html, 'utf8');
console.log(`포스터.html (${(Buffer.byteLength(html) / 1024).toFixed(0)}KB) · QR ${nq}곳 · 클로드 코드 표식 ${ni}곳`);
if (!nq) console.warn('경고: data-qr 자리를 찾지 못했습니다.');
if (!ni) console.warn('경고: data-icon 자리를 찾지 못했습니다.');
