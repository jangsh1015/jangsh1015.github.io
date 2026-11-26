/* ── DS2YTO 햄 전파 도우미 ───────────────────────────────────
   순수 HTML/CSS/JS · 외부 요청 없음 · 오프라인 동작
   ─────────────────────────────────────────────────────────── */
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const pad2 = n => String(n).padStart(2, '0');
const HS_KEY = 'ham-helper.v1';

/* ── 배경 별 ─────────────────────────────────────────────── */
(function stars() {
  const box = $('#stars');
  if (!box) return;
  let html = '';
  const n = 46;
  for (let i = 0; i < n; i++) {
    const x = Math.random() * 100, y = Math.random() * 100;
    const s = (Math.random() * 1.7 + 0.7).toFixed(1);
    const d = (Math.random() * 6).toFixed(1), o = (Math.random() * .5 + .18).toFixed(2);
    html += `<i style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;width:${s}px;height:${s}px;opacity:${o};animation-delay:${d}s"></i>`;
  }
  box.innerHTML = html;
})();

/* ── 태양 고도 (춘천) ────────────────────────────────────── */
const HOME_LAT = 37.85, HOME_LON = 127.74;

function solarAltitude(date, latDeg, lonDeg) {
  const RAD = Math.PI / 180;
  const jd = date.getTime() / 86400000 + 2440587.5;
  const d = jd - 2451545.0;
  const g = (357.529 + 0.98560028 * d) * RAD;
  const q = 280.459 + 0.98564736 * d;
  const L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * RAD;
  const e = (23.439 - 0.00000036 * d) * RAD;
  const dec = Math.asin(Math.sin(e) * Math.sin(L));
  let ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / RAD;
  ra = (ra + 360) % 360;
  let gmst = (18.697374558 + 24.06570982441908 * d) % 24;
  if (gmst < 0) gmst += 24;
  const ha = (((gmst + lonDeg / 15) * 15 - ra + 540) % 360 - 180) * RAD;
  const phi = latDeg * RAD;
  const alt = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(ha));
  return alt / RAD;
}

/* ── 밴드 플랜 ───────────────────────────────────────────── */
const BANDS = {
  '160m': { mhz: 1.840, mode: 'USB' },
  '80m': { mhz: 3.573, mode: 'USB' },
  '40m': { mhz: 7.074, mode: 'USB' },
  '30m': { mhz: 10.136, mode: 'USB' },
  '20m': { mhz: 14.074, mode: 'USB' },
  '17m': { mhz: 18.100, mode: 'USB' },
  '15m': { mhz: 21.074, mode: 'USB' },
  '12m': { mhz: 24.915, mode: 'USB' },
  '10m': { mhz: 28.074, mode: 'USB' },
  '6m': { mhz: 50.313, mode: 'USB' },
  '2m': { mhz: 144.174, mode: 'USB' }
};

const PHASES = {
  day: {
    icon: '☀️', name: '낮',
    bands: ['15m', '12m', '10m', '20m'],
    title: '낮 · 15m · 10m 장거리',
    tip: 'F2층이 높이 올라가 21~28 MHz DX가 열립니다. 15m 21.074 MHz부터 들어 보세요.',
    line: '15m 21.074'
  },
  dusk: {
    icon: '🌇', name: '황혼',
    bands: ['20m', '17m', '40m', '30m'],
    title: '황혼 · 그레이 라인',
    tip: '낮과 밤의 경계를 따라 20m·40m가 크게 열립니다. 지금이 DX 잡기 좋은 때.',
    line: '20m 14.074'
  },
  night: {
    icon: '🌙', name: '밤',
    bands: ['40m', '80m', '160m', '30m'],
    title: '밤 · 40m가 주력',
    tip: 'D층이 사라져 7 MHz가 멀리 갑니다. 7.074 MHz 하나로 국내외가 두루 열립니다.',
    line: '40m 7.074'
  }
};

function phaseOf(alt) {
  if (alt >= 8) return 'day';
  if (alt > -6) return 'dusk';
  return 'night';
}

/* ── 시계 · FT8 ──────────────────────────────────────────── */
const el = {
  utc: $('#clkUtc'), kst: $('#clkKst'),
  utcD: $('#clkUtcDate'), kstD: $('#clkKstDate'),
  parity: $('#slotParity'), left: $('#slotLeft'),
  fill: $('#barFill'), bar: $('#slotBar'),
  range: $('#slotRange'), next: $('#slotNext'),
  phIcon: $('#phaseIcon'), phName: $('#phaseName'), sunAlt: $('#sunAlt'), phNow: $('#phaseNow'),
  phDay: $('#phDay'), phDusk: $('#phDusk'), phNight: $('#phNight'),
  recTitle: $('#recTitle'), recTip: $('#recTip'), recFreqs: $('#recFreqs'), recTag: $('#recTag')
};
const WD = ['일', '월', '화', '수', '목', '금', '토'];
let lastSec = -1, lastPhase = '', lastMinute = -1;

function two(n) { return n < 10 ? '0' + n : '' + n; }

function paintClock() {
  const now = new Date();
  const ms = now.getMilliseconds();
  const utcSec = now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds() + ms / 1000;

  // KST = UTC+9 (기기 시간대와 무관하게 계산)
  const k = new Date(now.getTime() + 9 * 3600000);
  const sec = now.getUTCSeconds();

  if (sec !== lastSec) {
    lastSec = sec;
    el.utc.textContent = two(now.getUTCHours()) + ':' + two(now.getUTCMinutes()) + ':' + two(sec);
    el.kst.textContent = two(k.getUTCHours()) + ':' + two(k.getUTCMinutes()) + ':' + two(k.getUTCSeconds());
    el.utcD.textContent = now.getUTCFullYear() + '.' + two(now.getUTCMonth() + 1) + '.' + two(now.getUTCDate()) +
      ' (' + WD[now.getUTCDay()] + ')';
    el.kstD.textContent = k.getUTCFullYear() + '.' + two(k.getUTCMonth() + 1) + '.' + two(k.getUTCDate()) +
      ' (' + WD[k.getUTCDay()] + ')';

    // FT8 15초 슬롯
    const slot = Math.floor(utcSec / 15);
    const within = utcSec - slot * 15;
    const even = slot % 2 === 0;
    el.parity.textContent = even ? 'EVEN' : 'ODD';
    el.parity.classList.toggle('odd', !even);
    el.fill.classList.toggle('odd', !even);
    el.range.textContent = '초 ' + two((slot * 15) % 60) + '–' + two((slot * 15 + 15) % 60);
    el.next.textContent = '다음 ' + (even ? 'ODD' : 'EVEN') + ' ' + two(Math.floor((slot + 1) * 15) % 60) + '초';
    el.left.textContent = (15 - within).toFixed(1);
    el.bar.setAttribute('aria-valuenow', within.toFixed(1));
  }

  // 진행 바는 매 프레임 부드럽게
  const slotNow = Math.floor(utcSec / 15);
  const w = ((utcSec - slotNow * 15) / 15) * 100;
  el.fill.style.width = Math.min(100, w).toFixed(2) + '%';
  el.left.textContent = (15 - (utcSec - slotNow * 15)).toFixed(1);

  // 위상은 1초마다
  if (sec !== lastPhase) {
    lastPhase = sec;
    updatePhase(now);
  }
}

function updatePhase(now) {
  const alt = solarAltitude(now, HOME_LAT, HOME_LON);
  const key = phaseOf(alt);
  const p = PHASES[key];
  el.phIcon.textContent = p.icon;
  el.phName.textContent = p.name;
  el.sunAlt.textContent = (alt >= 0 ? '+' : '') + alt.toFixed(0) + '°';
  el.phNow.textContent = '추천 ' + p.line;
  el.phDay.classList.toggle('on', key === 'day');
  el.phDusk.classList.toggle('on', key === 'dusk');
  el.phNight.classList.toggle('on', key === 'night');
  if (el.recTitle.dataset.key !== key) {
    el.recTitle.dataset.key = key;
    el.recTitle.textContent = p.title;
    el.recTip.textContent = p.tip;
    el.recTag.textContent = '지금';
    el.recFreqs.innerHTML = p.bands.map(b => {
      const f = BANDS[b];
      return `<span>${b} ${f.mhz.toFixed(3)}</span>`;
    }).join('');
    markHotBands(p.bands);
  }
}

function loop() {
  paintClock();
  requestAnimationFrame(loop);
}

/* ── FT8 주파수 표 ──────────────────────────────────────── */
function buildFreqTable() {
  const list = $('#freqList');
  const order = ['160m', '80m', '40m', '30m', '20m', '17m', '15m', '12m', '10m', '6m', '2m'];
  list.innerHTML = order.map(b => {
    const f = BANDS[b];
    return `<button type="button" class="freq-row" data-band="${b}" data-mhz="${f.mhz.toFixed(3)}">
      <span class="freq-band">${b}</span>
      <span class="freq-mhz">${f.mhz.toFixed(3)}<small>MHz</small></span>
      <span class="freq-side"><span class="freq-mode">${f.mode}</span><span class="freq-now" hidden>지금</span></span>
    </button>`;
  }).join('');

  list.addEventListener('click', e => {
    const row = e.target.closest('.freq-row');
    if (!row) return;
    const txt = row.dataset.mhz + ' MHz';
    copy(txt, txt + ' 복사됨');
  });
}

function markHotBands(bands) {
  $$('.freq-row').forEach(r => {
    const hot = bands.includes(r.dataset.band);
    r.classList.toggle('hot', hot);
    const tag = $('.freq-now', r);
    if (tag) tag.hidden = !hot;
  });
}

/* ── 복사 · 토스트 ──────────────────────────────────────── */
let toastTimer = 0;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), 1700);
}
async function copy(text, msg) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(ta);
      ta.select(); document.execCommand('copy');
      document.body.removeChild(ta);
    }
    toast(msg);
  } catch (e) {
    toast(text + ' — 길게 눌러 복사하세요');
  }
}

/* ── 그리드 로케이터 ────────────────────────────────────── */
const DIR16 = ['북', '북북동', '북동', '동북동', '동', '동남동', '남동', '남남동',
               '남', '남남서', '남서', '서남서', '서', '서북서', '북서', '북북서'];

function gridToLatLon(raw) {
  const g = (raw || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!/^[A-R]{2}(\d{2}([A-X]{2})?)?$/.test(g)) return null;
  const c0 = g.charCodeAt(0) - 65, c1 = g.charCodeAt(1) - 65;
  let lon = c0 * 20 - 180;
  let lat = c1 * 10 - 90;
  let w = 20, h = 10;
  if (g.length >= 4) {
    lon += Number(g[2]) * 2;
    lat += Number(g[3]) * 1;
    w = 2; h = 1;
  }
  if (g.length >= 6) {
    lon += (g.charCodeAt(4) - 65) * (2 / 24);
    lat += (g.charCodeAt(5) - 65) * (1 / 24);
    w = 2 / 24; h = 1 / 24;
  }
  return { lat: lat + h / 2, lon: lon + w / 2, size: g.length };
}

function haversine(a, b) {
  const R = 6371.0088, RAD = Math.PI / 180;
  const dLat = (b.lat - a.lat) * RAD, dLon = (b.lon - a.lon) * RAD;
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

function bearing(a, b) {
  const RAD = Math.PI / 180, DEG = 180 / Math.PI;
  const p1 = a.lat * RAD, p2 = b.lat * RAD, dl = (b.lon - a.lon) * RAD;
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return (Math.atan2(y, x) * DEG + 360) % 360;
}

const grid = {
  mine: $('#gridMine'), target: $('#gridTarget'),
  err: $('#gridErr'), res: $('#gridRes'),
  dist: $('#distNum'), sp: $('#spDeg'), spDir: $('#spDir'),
  lp: $('#lpDeg'), lpDir: $('#lpDir'), note: $('#gridNote'),
  spArrow: $('#spArrow'), lpArrow: $('#lpArrow')
};

function fmtLatLon(p) {
  return Math.abs(p.lat).toFixed(2) + '°' + (p.lat >= 0 ? 'N' : 'S') + ' ' +
         Math.abs(p.lon).toFixed(2) + '°' + (p.lon >= 0 ? 'E' : 'W');
}

function computeGrid() {
  const mineRaw = grid.mine.value;
  const tgtRaw = grid.target.value;
  const mine = gridToLatLon(mineRaw);
  const tgt = gridToLatLon(tgtRaw);

  grid.err.hidden = true;
  grid.mine.classList.remove('bad');
  grid.target.classList.remove('bad');

  if (!mine) {
    grid.mine.classList.add('bad');
    grid.err.hidden = false;
    grid.err.textContent = '내 그리드가 형식에 맞지 않습니다. 예: PM37';
    grid.res.hidden = true;
    return;
  }
  if (!tgtRaw.trim()) { grid.res.hidden = true; return; }
  if (!tgt) {
    grid.target.classList.add('bad');
    grid.err.hidden = false;
    grid.err.textContent = '상대 그리드를 확인하세요. 4자리(PM95) 또는 6자리(PM95aa)입니다.';
    grid.res.hidden = true;
    return;
  }

  const km = haversine(mine, tgt);
  const sp = bearing(mine, tgt);
  const lp = (sp + 180) % 360;
  const dir = b => DIR16[Math.round(b / 22.5) % 16];

  grid.dist.textContent = Math.round(km).toLocaleString('ko-KR');
  grid.sp.textContent = sp.toFixed(1) + '°';
  grid.spDir.textContent = dir(sp);
  grid.lp.textContent = lp.toFixed(1) + '°';
  grid.lpDir.textContent = dir(lp);
  grid.note.textContent =
    '내 그리드 ' + fmtLatLon(mine) + ' → 상대 ' + fmtLatLon(tgt) +
    ' · 장거리 경로 ' + Math.round(km).toLocaleString('ko-KR') + ' km';

  grid.spArrow.setAttribute('transform', `rotate(${sp.toFixed(1)} 100 100)`);
  grid.lpArrow.setAttribute('transform', `rotate(${lp.toFixed(1)} 100 100)`);
  grid.res.hidden = false;
}

function bindGrid() {
  try {
    const saved = localStorage.getItem(HS_KEY + '.grid');
    if (saved && gridToLatLon(saved)) grid.mine.value = saved.toUpperCase();
  } catch (e) { /* 저장소 없음 */ }

  grid.mine.addEventListener('input', () => {
    grid.mine.value = grid.mine.value.toUpperCase();
    try { localStorage.setItem(HS_KEY + '.grid', grid.mine.value); } catch (e) {}
    computeGrid();
  });
  grid.target.addEventListener('input', () => {
    grid.target.value = grid.target.value.toUpperCase();
    computeGrid();
  });

  $('#gridPresets').addEventListener('click', e => {
    const b = e.target.closest('.chip');
    if (!b) return;
    grid.target.value = b.dataset.grid;
    computeGrid();
    grid.res.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
}

/* ── DXCC 접두사 데이터 ─────────────────────────────────── */
/* [한글, 영문, 대륙, CQ, ITU, 접두사(공백 구분, AA-AL 형태 범위 허용)] */
const DXCC_RAW = [
  ['대한민국', 'South Korea', 'AS', '25', '44', 'HL DS D7 D8 D9 6K 6L 6M 6N'],
  ['조선민주주의인민공화국', 'North Korea', 'AS', '25', '44', 'P5 P6 P7 P8 P9 HM'],
  ['일본', 'Japan', 'AS', '25', '45', 'JA-JS 7J-7N 8J-8N'],
  ['중국', 'China', 'AS', '23~24', '43~44', 'B BA-BL BT BY'],
  ['대만', 'Taiwan', 'AS', '24', '44', 'BV BM-BQ BU-BX'],
  ['홍콩', 'Hong Kong', 'AS', '24', '44', 'VR'],
  ['마카오', 'Macao', 'AS', '24', '44', 'XX9'],
  ['인도', 'India', 'AS', '22', '41', 'VU VV VW VT'],
  ['스리랑카', 'Sri Lanka', 'AS', '22', '41', '4S 4P'],
  ['몰디브', 'Maldives', 'AS', '22', '41', '8Q'],
  ['네팔', 'Nepal', 'AS', '22', '42', '9N'],
  ['부탄', 'Bhutan', 'AS', '22', '41', 'A5'],
  ['방글라데시', 'Bangladesh', 'AS', '22', '41', 'S2'],
  ['파키스탄', 'Pakistan', 'AS', '21', '41', 'AP AQ'],
  ['아프가니스탄', 'Afghanistan', 'AS', '21', '40', 'YA T6 Y6'],
  ['타지키스탄', 'Tajikistan', 'AS', '21', '42', 'EY'],
  ['키르기스스탄', 'Kyrgyzstan', 'AS', '21', '42', 'EX'],
  ['우즈베키스탄', 'Uzbekistan', 'AS', '21', '42', 'UK UJ'],
  ['투르크메니스탄', 'Turkmenistan', 'AS', '21', '42', 'EZ'],
  ['카자흐스탄', 'Kazakhstan', 'AS', '17', '30', 'UN UO UP UQ'],
  ['아제르바이잔', 'Azerbaijan', 'AS', '21', '29', '4J 4K'],
  ['조지아', 'Georgia', 'AS', '21', '29', '4L'],
  ['아르메니아', 'Armenia', 'AS', '21', '29', 'EK'],
  ['사우디아라비아', 'Saudi Arabia', 'AS', '21', '39', 'HZ 7Z'],
  ['오만', 'Oman', 'AS', '21', '39', 'A4'],
  ['아랍에미리트', 'United Arab Emirates', 'AS', '21', '39', 'A6'],
  ['카타르', 'Qatar', 'AS', '21', '39', 'A7'],
  ['쿠웨이트', 'Kuwait', 'AS', '21', '39', '9K'],
  ['바레인', 'Bahrain', 'AS', '21', '39', 'A9'],
  ['요르단', 'Jordan', 'AS', '20', '39', 'JY'],
  ['레바논', 'Lebanon', 'AS', '20', '39', 'OD'],
  ['시리아', 'Syria', 'AS', '20', '39', 'YK'],
  ['이라크', 'Iraq', 'AS', '21', '39', 'YI'],
  ['이란', 'Iran', 'AS', '21', '40', 'EP EQ'],
  ['튀르키예', 'Türkiye', 'AS', '20', '39', 'TA-TC YM'],
  ['이스라엘', 'Israel', 'AS', '20', '39', '4X 4Z'],
  ['키프로스', 'Cyprus', 'AS', '20', '39', '5B H2 P3'],
  ['예멘', 'Yemen', 'AS', '21', '39', '7O'],
  ['말레이시아(서)', 'West Malaysia', 'AS', '28', '54', '9M2 9M4 9W'],
  ['말레이시아(동)', 'East Malaysia', 'OC', '28', '54', '9M6 9M8'],
  ['싱가포르', 'Singapore', 'AS', '28', '54', '9V S6'],
  ['인도네시아', 'Indonesia', 'OC', '28', '54', 'YB-YH'],
  ['필리핀', 'Philippines', 'OC', '27', '50', 'DU-DZ 4D-4I'],
  ['태국', 'Thailand', 'AS', '26', '49', 'HS E2'],
  ['캄보디아', 'Cambodia', 'AS', '26', '49', 'XU'],
  ['라오스', 'Laos', 'AS', '26', '49', 'XW'],
  ['베트남', 'Vietnam', 'AS', '26', '49', 'XV 3W'],
  ['미얀마', 'Myanmar', 'AS', '26', '46', 'XZ'],
  ['브루나이', 'Brunei', 'OC', '28', '54', 'V8'],
  ['몽골', 'Mongolia', 'AS', '23', '32', 'JT-JV'],
  ['동티모르', 'Timor-Leste', 'OC', '28', '54', '4W'],
  ['호주', 'Australia', 'OC', '29~30', '55~59', 'VK AX'],
  ['뉴질랜드', 'New Zealand', 'OC', '32', '60', 'ZL ZM'],
  ['피지', 'Fiji', 'OC', '32', '56', '3D2'],
  ['사모아', 'Samoa', 'OC', '32', '62', '5W'],
  ['통가', 'Tonga', 'OC', '32', '62', 'A3'],
  ['나우루', 'Nauru', 'OC', '31', '65', 'C2'],
  ['팔라우', 'Palau', 'OC', '27', '64', 'T8'],
  ['미크로네시아', 'Micronesia', 'OC', '27', '65', 'V6'],
  ['마셜제도', 'Marshall Islands', 'OC', '31', '65', 'V7'],
  ['키리바시(서)', 'West Kiribati', 'OC', '31', '65', 'T30'],
  ['투발루', 'Tuvalu', 'OC', '31', '65', 'T2'],
  ['쿡제도', 'Cook Islands', 'OC', '32', '62', 'E5'],
  ['프랑스령 폴리네시아', 'French Polynesia', 'OC', '32', '63', 'FO'],
  ['바누아투', 'Vanuatu', 'OC', '32', '63', 'YJ'],
  ['솔로몬제도', 'Solomon Islands', 'OC', '28', '65', 'H4'],
  ['파푸아뉴기니', 'Papua New Guinea', 'OC', '28', '51', 'P2'],
  ['뉴칼레도니아', 'New Caledonia', 'OC', '32', '56', 'FK'],
  ['노퍽섬', 'Norfolk Island', 'OC', '32', '60', 'VK9N'],
  ['토켈라우', 'Tokelau', 'OC', '31', '62', 'ZK3'],
  ['피트케언섬', 'Pitcairn Islands', 'OC', '32', '63', 'VP6'],
  ['하와이', 'Hawaii', 'OC', '31', '61', 'KH6 KH7 AH6 WH6 NH6'],
  ['괌', 'Guam', 'OC', '27', '64', 'KH2 AH2 WH2 NH2'],
  ['북마리아나제도', 'Mariana Islands', 'OC', '27', '64', 'KH0'],
  ['아메리칸사모아', 'American Samoa', 'OC', '32', '62', 'KH8'],
  ['미국', 'United States', 'NA', '03~05', '06~08', 'K W N AA-AL KA-KZ'],
  ['알래스카', 'Alaska', 'NA', '01', '01', 'KL7 AL7 WL7 NL7'],
  ['캐나다', 'Canada', 'NA', '01~05', '02~09', 'VE VA VY VO CY CF CG'],
  ['멕시코', 'Mexico', 'NA', '06', '10', 'XA-XI 4A-4C 6D-6F'],
  ['쿠바', 'Cuba', 'NA', '08', '11', 'CO CM CL'],
  ['도미니카공화국', 'Dominican Republic', 'NA', '08', '11', 'HI'],
  ['푸에르토리코', 'Puerto Rico', 'NA', '08', '11', 'KP4 NP4 WP4'],
  ['미국령 버진아일랜드', 'US Virgin Islands', 'NA', '08', '11', 'KP2 NP2 WP2'],
  ['자메이카', 'Jamaica', 'NA', '08', '11', '6Y'],
  ['아이티', 'Haiti', 'NA', '08', '11', 'HH 4V'],
  ['파나마', 'Panama', 'NA', '07', '11', 'HP H3 HO'],
  ['코스타리카', 'Costa Rica', 'NA', '07', '11', 'TI TE'],
  ['과테말라', 'Guatemala', 'NA', '07', '11', 'TG TD'],
  ['온두라스', 'Honduras', 'NA', '07', '11', 'HR HQ'],
  ['엘살바도르', 'El Salvador', 'NA', '07', '11', 'YS'],
  ['니카라과', 'Nicaragua', 'NA', '07', '11', 'YN HT'],
  ['벨리즈', 'Belize', 'NA', '07', '11', 'V3'],
  ['바하마', 'Bahamas', 'NA', '08', '11', 'C6'],
  ['케이맨제도', 'Cayman Islands', 'NA', '08', '11', 'ZF'],
  ['버뮤다', 'Bermuda', 'NA', '05', '11', 'VP9'],
  ['바베이도스', 'Barbados', 'NA', '08', '11', '8P'],
  ['세인트루시아', 'Saint Lucia', 'NA', '08', '11', 'J6'],
  ['그레나다', 'Grenada', 'NA', '08', '11', 'J3'],
  ['앤티가바부다', 'Antigua & Barbuda', 'NA', '08', '11', 'V2'],
  ['세인트빈센트', 'Saint Vincent', 'NA', '08', '11', 'J8'],
  ['마르티니크', 'Martinique', 'NA', '08', '11', 'FM'],
  ['과들루프', 'Guadeloupe', 'NA', '08', '11', 'FG'],
  ['생마르탱', 'Saint Martin', 'NA', '08', '11', 'FS'],
  ['아루바', 'Aruba', 'SA', '09', '11', 'P4'],
  ['퀴라소', 'Curaçao', 'SA', '09', '11', 'PJ2'],
  ['트리니다드토바고', 'Trinidad & Tobago', 'SA', '09', '11', '9Y 9Z'],
  ['브라질', 'Brazil', 'SA', '11', '12~15', 'PP-PY ZV-ZZ'],
  ['아르헨티나', 'Argentina', 'SA', '13', '14', 'LO-LW'],
  ['칠레', 'Chile', 'SA', '12', '14', 'CA-CE XQ-XR'],
  ['이스터섬', 'Easter Island', 'SA', '12', '63', 'CE0'],
  ['페루', 'Peru', 'SA', '10', '12', 'OA-OC'],
  ['콜롬비아', 'Colombia', 'SA', '09', '12', 'HK HJ 5J 5K'],
  ['베네수엘라', 'Venezuela', 'SA', '09', '12', 'YV-YY 4M'],
  ['에콰도르', 'Ecuador', 'SA', '10', '12', 'HC HD'],
  ['갈라파고스', 'Galapagos', 'SA', '10', '12', 'HC8'],
  ['볼리비아', 'Bolivia', 'SA', '10', '14', 'CP'],
  ['파라과이', 'Paraguay', 'SA', '11', '14', 'ZP'],
  ['우루과이', 'Uruguay', 'SA', '13', '14', 'CX'],
  ['가이아나', 'Guyana', 'SA', '09', '12', '8R'],
  ['수리남', 'Suriname', 'SA', '09', '12', 'PZ'],
  ['포클랜드제도', 'Falkland Islands', 'SA', '13', '16', 'VP8'],
  ['잉글랜드', 'England', 'EU', '14', '27', 'G M 2E'],
  ['스코틀랜드', 'Scotland', 'EU', '14', '27', 'GM MM 2M'],
  ['웨일스', 'Wales', 'EU', '14', '27', 'GW MW 2W'],
  ['북아일랜드', 'Northern Ireland', 'EU', '14', '27', 'GI MI 2I'],
  ['아일랜드', 'Ireland', 'EU', '14', '27', 'EI EJ'],
  ['프랑스', 'France', 'EU', '14', '27', 'F TK'],
  ['벨기에', 'Belgium', 'EU', '14', '27', 'ON-OT'],
  ['네덜란드', 'Netherlands', 'EU', '14', '27', 'PA-PI'],
  ['독일', 'Germany', 'EU', '14', '28', 'DA-DR'],
  ['스위스', 'Switzerland', 'EU', '14', '28', 'HB HE'],
  ['리히텐슈타인', 'Liechtenstein', 'EU', '14', '28', 'HB0'],
  ['오스트리아', 'Austria', 'EU', '15', '28', 'OE'],
  ['이탈리아', 'Italy', 'EU', '15', '28', 'I IK IW IZ IS II'],
  ['스페인', 'Spain', 'EU', '14', '37', 'EA-EH AM'],
  ['포르투갈', 'Portugal', 'EU', '14', '37', 'CT CQ CR CS'],
  ['아조레스', 'Azores', 'EU', '14', '37', 'CU'],
  ['마데이라', 'Madeira', 'AF', '33', '36', 'CT3'],
  ['그리스', 'Greece', 'EU', '20', '28', 'SV SX SY SZ J4'],
  ['루마니아', 'Romania', 'EU', '20', '28', 'YO-YR'],
  ['불가리아', 'Bulgaria', 'EU', '20', '28', 'LZ'],
  ['세르비아', 'Serbia', 'EU', '15', '28', 'YU YT YZ'],
  ['크로아티아', 'Croatia', 'EU', '15', '28', '9A'],
  ['슬로베니아', 'Slovenia', 'EU', '15', '28', 'S5'],
  ['보스니아헤르체고비나', 'Bosnia & Herzegovina', 'EU', '15', '28', 'E7'],
  ['북마케도니아', 'North Macedonia', 'EU', '15', '28', 'Z3'],
  ['몬테네그로', 'Montenegro', 'EU', '15', '28', '4O'],
  ['코소보', 'Kosovo', 'EU', '15', '28', 'Z6'],
  ['알바니아', 'Albania', 'EU', '15', '28', 'ZA'],
  ['헝가리', 'Hungary', 'EU', '15', '28', 'HA HG'],
  ['체코', 'Czechia', 'EU', '15', '28', 'OK OL'],
  ['슬로바키아', 'Slovakia', 'EU', '15', '28', 'OM'],
  ['폴란드', 'Poland', 'EU', '15', '28', 'SP SQ SO SN 3Z'],
  ['덴마크', 'Denmark', 'EU', '14', '18', 'OZ OU OV OW'],
  ['페로제도', 'Faroe Islands', 'EU', '14', '18', 'OY'],
  ['아이슬란드', 'Iceland', 'EU', '40', '17', 'TF'],
  ['노르웨이', 'Norway', 'EU', '14', '18', 'LA-LN'],
  ['스웨덴', 'Sweden', 'EU', '14', '18', 'SM SA-SD SE SF SG SH SI SJ SK SL'],
  ['핀란드', 'Finland', 'EU', '15', '18', 'OH OF OG OI OJ'],
  ['올란드제도', 'Åland Islands', 'EU', '15', '18', 'OH0'],
  ['스발바르', 'Svalbard', 'EU', '40', '18', 'JW'],
  ['얀마옌', 'Jan Mayen', 'EU', '40', '18', 'JX'],
  ['그린란드', 'Greenland', 'NA', '40', '05', 'OX'],
  ['에스토니아', 'Estonia', 'EU', '15', '29', 'ES'],
  ['라트비아', 'Latvia', 'EU', '15', '29', 'YL'],
  ['리투아니아', 'Lithuania', 'EU', '15', '29', 'LY'],
  ['벨라루스', 'Belarus', 'EU', '16', '29', 'EU EV EW'],
  ['우크라이나', 'Ukraine', 'EU', '16', '29', 'UR US UT UU UV UW UX UY UZ EM EN EO'],
  ['몰도바', 'Moldova', 'EU', '16', '29', 'ER'],
  ['러시아(유럽)', 'Russia (Europe)', 'EU', '16', '29', 'UA1-UA7 UB-UI RA-RZ R1-R7'],
  ['러시아(아시아)', 'Russia (Asiatic)', 'AS', '17~19', '30~35', 'UA9 UA0 RA9 RA0 R9 R0'],
  ['룩셈부르크', 'Luxembourg', 'EU', '14', '27', 'LX'],
  ['모나코', 'Monaco', 'EU', '14', '27', '3A'],
  ['몰타', 'Malta', 'EU', '15', '28', '9H'],
  ['산마리노', 'San Marino', 'EU', '15', '28', 'T7'],
  ['바티칸', 'Vatican City', 'EU', '15', '28', 'HV'],
  ['지브롤터', 'Gibraltar', 'EU', '14', '37', 'ZB'],
  ['안도라', 'Andorra', 'EU', '14', '27', 'C3'],
  ['저지', 'Jersey', 'EU', '14', '27', 'GJ MJ'],
  ['건지', 'Guernsey', 'EU', '14', '27', 'GU MU'],
  ['맨섬', 'Isle of Man', 'EU', '14', '27', 'GD MD'],
  ['남아프리카공화국', 'South Africa', 'AF', '38', '57', 'ZS ZR ZT ZU'],
  ['나미비아', 'Namibia', 'AF', '38', '57', 'V5'],
  ['보츠와나', 'Botswana', 'AF', '38', '57', 'A2'],
  ['짐바브웨', 'Zimbabwe', 'AF', '38', '53', 'Z2'],
  ['잠비아', 'Zambia', 'AF', '36', '53', '9J'],
  ['말라위', 'Malawi', 'AF', '37', '53', '7Q'],
  ['모잠비크', 'Mozambique', 'AF', '37', '53', 'C8 C9'],
  ['앙골라', 'Angola', 'AF', '36', '52', 'D2 D3'],
  ['탄자니아', 'Tanzania', 'AF', '37', '53', '5H 5I'],
  ['케냐', 'Kenya', 'AF', '37', '48', '5Z 5Y'],
  ['우간다', 'Uganda', 'AF', '37', '48', '5X'],
  ['에티오피아', 'Ethiopia', 'AF', '37', '48', 'ET 9E'],
  ['수단', 'Sudan', 'AF', '34', '47', 'ST 6T'],
  ['남수단', 'South Sudan', 'AF', '34', '48', 'Z8'],
  ['이집트', 'Egypt', 'AF', '34', '38', 'SU 6A 6B'],
  ['리비아', 'Libya', 'AF', '34', '38', '5A'],
  ['튀니지', 'Tunisia', 'AF', '33', '37', 'TS 3V'],
  ['알제리', 'Algeria', 'AF', '33', '37', '7X 7Y'],
  ['모로코', 'Morocco', 'AF', '33', '37', 'CN 5C 5D'],
  ['세네갈', 'Senegal', 'AF', '35', '46', '6V 6W'],
  ['감비아', 'Gambia', 'AF', '35', '46', 'C5'],
  ['기니', 'Guinea', 'AF', '35', '46', '3X'],
  ['기니비사우', 'Guinea-Bissau', 'AF', '35', '46', 'J5'],
  ['시에라리온', 'Sierra Leone', 'AF', '35', '46', '9L'],
  ['라이베리아', 'Liberia', 'AF', '35', '46', 'EL A8'],
  ['코트디부아르', "Côte d'Ivoire", 'AF', '35', '46', 'TU'],
  ['가나', 'Ghana', 'AF', '35', '46', '9G'],
  ['토고', 'Togo', 'AF', '35', '46', '5V'],
  ['베냉', 'Benin', 'AF', '35', '46', 'TY'],
  ['부르키나파소', 'Burkina Faso', 'AF', '35', '46', 'XT'],
  ['말리', 'Mali', 'AF', '35', '46', 'TZ'],
  ['니제르', 'Niger', 'AF', '35', '46', '5U'],
  ['모리타니', 'Mauritania', 'AF', '35', '46', '5T'],
  ['카보베르데', 'Cape Verde', 'AF', '35', '46', 'D4'],
  ['나이지리아', 'Nigeria', 'AF', '35', '46', '5N 5O'],
  ['카메룬', 'Cameroon', 'AF', '36', '47', 'TJ'],
  ['차드', 'Chad', 'AF', '36', '47', 'TT'],
  ['중앙아프리카공화국', 'Central African Republic', 'AF', '36', '47', 'TL'],
  ['콩고', 'Congo', 'AF', '36', '52', 'TN'],
  ['콩고민주공화국', 'DR Congo', 'AF', '36', '52', '9Q-9T'],
  ['가봉', 'Gabon', 'AF', '36', '52', 'TR'],
  ['적도기니', 'Equatorial Guinea', 'AF', '36', '47', '3C'],
  ['상투메프린시페', 'São Tomé & Príncipe', 'AF', '36', '47', 'S9'],
  ['레소토', 'Lesotho', 'AF', '38', '57', '7P'],
  ['에스와티니', 'Eswatini', 'AF', '38', '57', '3DA'],
  ['마다가스카르', 'Madagascar', 'AF', '39', '53', '5R 5S'],
  ['모리셔스', 'Mauritius', 'AF', '39', '53', '3B8'],
  ['로드리게스섬', 'Rodrigues', 'AF', '39', '53', '3B9'],
  ['레위니옹', 'Réunion', 'AF', '39', '53', 'FR'],
  ['마요트', 'Mayotte', 'AF', '39', '53', 'FH'],
  ['코모로', 'Comoros', 'AF', '39', '53', 'D6'],
  ['세이셸', 'Seychelles', 'AF', '39', '53', 'S7'],
  ['차고스제도', 'Chagos Islands', 'AF', '39', '62', 'VQ9'],
  ['상트헬레나', 'Saint Helena', 'AF', '36', '66', 'ZD7'],
  ['소말리아', 'Somalia', 'AF', '37', '48', '6O T5'],
  ['지부티', 'Djibouti', 'AF', '37', '48', 'J2'],
  ['에리트레아', 'Eritrea', 'AF', '37', '48', 'E3'],
  ['르완다', 'Rwanda', 'AF', '36', '52', '9X'],
  ['부룬디', 'Burundi', 'AF', '36', '52', '9U'],
  ['남극', 'Antarctica', 'AN', '39', '67', 'KC4 CE9 VK0 ZL5'],
  ['국제연합 본부', 'United Nations HQ', 'NA', '05', '08', '4U1UN 4U'],
  ['ITU 제네바', 'ITU Geneva', 'EU', '14', '28', '4U1ITU'],
  ['비엔나 국제센터', 'Vienna Intl Centre', 'EU', '14', '28', '4U1VIC'],
  ['몰타기사단', 'Sovereign Order of Malta', 'EU', '15', '28', '1A0']
];

const CONT = {
  AS: { name: '아시아', icon: '🌏' },
  EU: { name: '유럽', icon: '🌍' },
  AF: { name: '아프리카', icon: '🌍' },
  NA: { name: '북아메리카', icon: '🌎' },
  SA: { name: '남아메리카', icon: '🌎' },
  OC: { name: '오세아니아', icon: '🌏' },
  AN: { name: '남극', icon: '🧊' }
};

function seqPrefix(a, b) {
  const out = [];
  const cur = a.split('');
  if (a.length !== b.length) return [a, b];
  for (let guard = 0; guard < 600; guard++) {
    const s = cur.join('');
    out.push(s);
    if (s === b) break;
    for (let i = cur.length - 1; i >= 0; i--) {
      const c = cur[i].charCodeAt(0);
      const isDigit = c >= 48 && c <= 57;
      const low = isDigit ? 48 : 65;
      const high = isDigit ? 57 : 90;
      cur[i] = String.fromCharCode(c >= high ? low : c + 1);
      if (c < high) break;
    }
  }
  return out;
}

const PREFIXES = [];
(function buildPrefixes() {
  for (const row of DXCC_RAW) {
    const entry = { ko: row[0], en: row[1], cont: row[2], cq: row[3], itu: row[4] };
    for (const token of row[5].split(/\s+/)) {
      const list = token.includes('-') ? seqPrefix(...token.split('-')) : [token];
      for (const p of list) PREFIXES.push({ p, entry });
    }
  }
  PREFIXES.sort((a, b) => b.p.length - a.p.length || a.p.localeCompare(b.p));
})();

function lookupCallsign(raw) {
  const call = (raw || '').toUpperCase().replace(/[^A-Z0-9/]/g, '');
  if (call.length < 1) return null;
  // 실제 콜사인은 4자리 이상이면 반드시 숫자를 포함합니다 ("JA", "P5" 같은 앞자리 입력은 허용)
  if (call.length >= 4 && !/[0-9]/.test(call)) return null;
  const parts = call.split('/').filter(Boolean);
  let best = null;
  for (const part of parts) {
    for (const item of PREFIXES) {
      if (part.startsWith(item.p)) {
        if (!best || item.p.length > best.p.length) best = { p: item.p, entry: item.entry, part };
        break;
      }
    }
  }
  return best;
}

/* ── 콜사인 UI ─────────────────────────────────────────── */
const callIn = $('#callIn');
const callEmpty = $('#callEmpty'), callCard = $('#callCard'), callNone = $('#callNone');

function renderCall() {
  const raw = callIn.value;
  const hit = lookupCallsign(raw);
  const empty = !raw.trim();
  callEmpty.hidden = !empty;
  callCard.hidden = empty || !hit;
  callNone.hidden = empty || !!hit;
  if (!hit) return;

  const e = hit.entry;
  const c = CONT[e.cont] || { name: e.cont, icon: '🌐' };
  $('#ccFlag').textContent = c.icon;
  $('#ccName').textContent = e.ko;
  $('#ccEn').textContent = e.en;
  $('#ccCont').textContent = c.name;
  $('#ccCq').textContent = e.cq;
  $('#ccItu').textContent = e.itu;
  $('#ccPrefix').textContent = hit.p;
}

function bindCall() {
  callIn.addEventListener('input', () => {
    callIn.value = callIn.value.toUpperCase();
    renderCall();
  });
  $('#callPresets').addEventListener('click', ev => {
    const chip = ev.target.closest('.chip');
    if (!chip) return;
    callIn.value = chip.dataset.call;
    renderCall();
  });
  renderCall();
}

/* ── QRP 체크리스트 ────────────────────────────────────── */
const PACK = [
  ['SYNC TIME', '기기 시계를 자동 동기화. 1초만 어긋나도 FT8은 디코드되지 않습니다.'],
  ['SWR 확인', '안테나 튜너로 1.5 이하. 나가기 전 한 번, 주파수 바꿀 때마다.'],
  ['카운터포이즈', '랜덤와이어라도 5 m 이상 깔고, 차량이면 차체 접지.'],
  ['출력 5W 이하', 'QRP 확인. 배터리와 무전기 둘 다 지킵니다.'],
  ['배터리 · 예비 안테나', '보조배터리와 예비 와이어 한 벌.'],
  ['안전한 자리', '전선·차량 통행·사유지 피하고, 한쪽에 물러나 세우기.']
];

function buildPack() {
  const ul = $('#packList');
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(HS_KEY + '.pack') || '{}'); } catch (e) {}

  ul.innerHTML = PACK.map(([t, d], i) => `
    <li>
      <label>
        <input type="checkbox" data-i="${i}" ${saved[i] ? 'checked' : ''}>
        <span class="box"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="#04121c" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        <span class="tx"><b>${t}</b><span>${d}</span></span>
      </label>
    </li>`).join('');

  const update = () => {
    const boxes = $$('input[type=checkbox]', ul);
    const on = boxes.filter(b => b.checked).length;
    $('#packCount').textContent = on + ' / ' + boxes.length + ' 완료';
    const obj = {};
    boxes.forEach(b => { if (b.checked) obj[b.dataset.i] = 1; });
    try { localStorage.setItem(HS_KEY + '.pack', JSON.stringify(obj)); } catch (e) {}
  };

  ul.addEventListener('change', update);
  $('#packReset').addEventListener('click', () => {
    $$('input[type=checkbox]', ul).forEach(b => { b.checked = false; });
    update();
    toast('체크리스트를 비웠습니다');
  });
  update();
}

/* ── 그레이 라인 도파관 시뮬레이터 ──────────────────────── */
const Sim = (() => {
  const stage = $('#simStage');
  const canvas = $('#simCanvas');
  if (!canvas) return { setMode() {}, toggle() {} };
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W = 360, H = 290, dpr = 1;
  let R = 500, cx = 180, cy = 800;
  let mode = 'grey';
  let playing = !reduce;
  let tStart = performance.now();
  let p = reduce ? .62 : 0;
  let visible = true;
  let stars = [];
  let cities = [];
  let raf = 0;

  const LAYERS = [
    { k: 'D', h: 30, color: '#ffb26b', name: 'D 60–90' },
    { k: 'E', h: 50, color: '#8ff0c0', name: 'E 90–150' },
    { k: 'F1', h: 72, color: '#5fa9ff', name: 'F1 150–220' },
    { k: 'F2', h: 96, color: '#b98cff', name: 'F2 220–500' }
  ];

  const MODES = {
    day: {
      dur: 5200,
      hops: [{ x0: .10, x1: .32, h: 30, absorbed: true }],
      caption: 'D층 흡수 · 단거리',
      note: '낮의 40m는 D층에서 흡수됩니다'
    },
    night: {
      dur: 7600,
      hops: [
        { x0: .08, x1: .28, h: 96 }, { x0: .28, x1: .49, h: 92 },
        { x0: .49, x1: .70, h: 97 }, { x0: .70, x1: .93, h: 93 }
      ],
      caption: 'F층 다중 반사 · 야간 원거리',
      note: 'D층이 사라져 40m가 멀리 갑니다'
    },
    grey: {
      dur: 8200,
      hops: [
        { x0: .12, x1: .29, h: 96 }, { x0: .29, x1: .46, h: 99 },
        { x0: .46, x1: .63, h: 94 }, { x0: .63, x1: .80, h: 99 },
        { x0: .80, x1: .97, h: 94 }
      ],
      caption: '그레이 라인 도파관 · 지구 반대편',
      note: 'D층 흡수 없이 파이프처럼'
    }
  };

  function ground(x) {
    const th = (x - cx) / R;
    return [cx + R * Math.sin(th), cy - R * Math.cos(th)];
  }
  function at(x, hr) {
    const th = (x - cx) / R;
    const r = R + hr;
    return [cx + r * Math.sin(th), cy - r * Math.cos(th)];
  }
  function arcPath(hr) {
    const a = Math.asin(Math.max(-.999, Math.min(.999, (0 - cx) / R)));
    const b = Math.asin(Math.max(-.999, Math.min(.999, (W - cx) / R)));
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const th = a + (b - a) * (i / 40);
      pts.push([cx + (R + hr) * Math.sin(th), cy - (R + hr) * Math.cos(th)]);
    }
    return pts;
  }

  function buildRoute(m) {
    const pts = [];
    m.hops.forEach(hop => {
      const x0 = hop.x0 * W, x1 = hop.x1 * W;
      const n = 26;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const tt = hop.absorbed ? t * 0.52 : t;   // 흡수되는 경로는 층 안에서 끝
        const x = x0 + (x1 - x0) * tt;
        const r = hop.h * Math.sin(Math.PI * tt);
        pts.push({ p: at(x, r), t, hop });
      }
    });
    return pts;
  }

  function resize() {
    const rect = stage.getBoundingClientRect();
    W = Math.max(240, rect.width);
    dpr = Math.min(2.5, window.devicePixelRatio || 1);
    const h = window.matchMedia('(max-width: 420px)').matches ? 290 : 330;
    H = h;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    R = W * 1.35;
    cx = W / 2;
    cy = H - 62 + R;
    stars = [];
    for (let i = 0; i < 40; i++) {
      stars.push({ x: Math.random() * W, y: Math.random() * H * .55, r: Math.random() * 1.1 + .3, a: Math.random() * .6 + .2 });
    }
    cities = [];
    for (let i = 0; i < 26; i++) {
      cities.push({ x: Math.random() * W, r: Math.random() * 1.3 + .5, a: Math.random() * .5 + .25 });
    }
  }

  function drawSky(m) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    if (mode === 'day') {
      g.addColorStop(0, '#0a1830'); g.addColorStop(.55, '#123055'); g.addColorStop(1, '#2a3f5e');
    } else if (mode === 'night') {
      g.addColorStop(0, '#04060f'); g.addColorStop(.6, '#070d1c'); g.addColorStop(1, '#0a1424');
    } else {
      g.addColorStop(0, '#060a17'); g.addColorStop(.5, '#0b1428'); g.addColorStop(1, '#122036');
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // 별은 밤 쪽에만
    for (const s of stars) {
      const nightSide = mode === 'day' ? s.x > W * .82 : s.x > W * .30;
      if (!nightSide) continue;
      ctx.globalAlpha = s.a * (mode === 'grey' ? .9 : .7);
      ctx.fillStyle = '#dbe8ff';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (mode === 'day') {
      // 태양
      const sx = W * .76, sy = H * .155;
      const sun = ctx.createRadialGradient(sx, sy, 2, sx, sy, W * .34);
      sun.addColorStop(0, 'rgba(255,240,205,.9)');
      sun.addColorStop(.10, 'rgba(255,203,128,.45)');
      sun.addColorStop(.42, 'rgba(255,170,90,.11)');
      sun.addColorStop(1, 'rgba(255,170,90,0)');
      ctx.fillStyle = sun; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff6dd';
      ctx.beginPath(); ctx.arc(sx, sy, 6, 0, 7); ctx.fill();
    } else if (mode === 'grey') {
      const sx = W * .13, sy = H * .70;
      const sun = ctx.createRadialGradient(sx, sy, 2, sx, sy, W * .52);
      sun.addColorStop(0, 'rgba(255,214,150,.85)');
      sun.addColorStop(.16, 'rgba(255,164,96,.32)');
      sun.addColorStop(.5, 'rgba(160,120,255,.12)');
      sun.addColorStop(1, 'rgba(120,90,220,0)');
      ctx.fillStyle = sun; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ffe0ae';
      ctx.beginPath(); ctx.arc(sx, sy, 5, 0, 7); ctx.fill();
    } else {
      // 밤: 지평선 아래로 진 붉은 잔광
      const g2 = ctx.createLinearGradient(0, H * .45, 0, H);
      g2.addColorStop(0, 'rgba(90,60,140,0)');
      g2.addColorStop(1, 'rgba(80,55,120,.18)');
      ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
    }
  }

  function drawTerminator() {
    if (mode !== 'grey') return;
    const cxT = W * .13;
    const wBand = W * .22;
    const g = ctx.createLinearGradient(cxT - wBand, 0, cxT + wBand, 0);
    g.addColorStop(0, 'rgba(255,170,110,0)');
    g.addColorStop(.42, 'rgba(255,180,120,.16)');
    g.addColorStop(.52, 'rgba(190,150,255,.14)');
    g.addColorStop(1, 'rgba(120,110,220,0)');
    ctx.fillStyle = g;
    ctx.fillRect(cxT - wBand, 0, wBand * 2, H);
    if (mode === 'grey') {
      ctx.strokeStyle = 'rgba(255,200,150,.22)';
      ctx.setLineDash([3, 6]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cxT, 18); ctx.lineTo(cxT, H - 40); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,214,170,.85)';
      ctx.font = '9px ui-monospace, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('그레이 라인', cxT + 5, 46);
    }
  }

  function drawDuct(m) {
    if (mode !== 'grey') return;
    const x0 = m.hops[0].x0 * W, x1 = m.hops[m.hops.length - 1].x1 * W;
    ctx.save();
    ctx.beginPath();
    const steps = 26;
    for (let i = 0; i <= steps; i++) {
      const x = x0 + (x1 - x0) * (i / steps);
      const [px, py] = at(x, 96);
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    for (let i = steps; i >= 0; i--) {
      const x = x0 + (x1 - x0) * (i / steps);
      const [px, py] = ground(x);
      ctx.lineTo(px, py);
    }
    ctx.closePath();
    const g = ctx.createLinearGradient(0, H - 130, 0, H);
    g.addColorStop(0, 'rgba(185,168,255,.16)');
    g.addColorStop(.55, 'rgba(150,180,255,.07)');
    g.addColorStop(1, 'rgba(127,216,255,.03)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(185,168,255,.13)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function drawLayers() {
    LAYERS.forEach((L, idx) => {
      const pts = arcPath(L.h);
      let alpha = .5;
      if (L.k === 'D') {
        if (mode === 'night') alpha = .10;
        else if (mode === 'grey') alpha = .22;
        else alpha = .72;
      } else if (idx === 1) alpha = .3;
      else alpha = .38;

      ctx.beginPath();
      pts.forEach((pt, i) => i ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1]));
      ctx.strokeStyle = L.color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = L.k === 'D' ? (mode === 'day' ? 7 : 2) : 1.4;
      if (L.k === 'D' && mode !== 'day') ctx.setLineDash([4, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // 라벨 (오른쪽 여백 안쪽에 맞춤)
      const targetX = W - 52;
      const th = Math.asin(Math.max(-.92, Math.min(.92, (targetX - cx) / (R + L.h))));
      const lx = cx + (R + L.h) * Math.sin(th);
      const ly = cy - (R + L.h) * Math.cos(th);
      ctx.fillStyle = 'rgba(200,214,240,.55)';
      ctx.font = '8.5px ui-monospace, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(L.name, lx, ly - 4);
    });
  }

  function txFrac() {
    return mode === 'day' ? .10 : mode === 'night' ? .08 : .12;
  }

  function drawGround() {
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) {
      const [px, py] = ground(x);
      ctx.lineTo(px, py);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, H - 60, 0, H);
    g.addColorStop(0, '#101c30');
    g.addColorStop(1, '#060b16');
    ctx.fillStyle = g;
    ctx.fill();

    ctx.beginPath();
    for (let x = 0; x <= W; x += 8) {
      const [px, py] = ground(x);
      x ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.strokeStyle = 'rgba(127,216,255,.45)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 지표 도시 불빛
    for (const c of cities) {
      const [px, py] = ground(c.x);
      ctx.globalAlpha = c.a * .8;
      ctx.fillStyle = '#ffd9a0';
      ctx.beginPath(); ctx.arc(px, py - 1.5, c.r, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 송신 지점 — DS2YTO 안테나
    const tx = txFrac() * W;
    const [tx1, ty1] = ground(tx);

    // 마스트
    ctx.strokeStyle = 'rgba(127,216,255,.85)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(tx1, ty1); ctx.lineTo(tx1, ty1 - 20);
    ctx.moveTo(tx1 - 4, ty1); ctx.lineTo(tx1, ty1 - 18);
    ctx.moveTo(tx1 + 4, ty1); ctx.lineTo(tx1, ty1 - 18);
    ctx.moveTo(tx1 - 3.4, ty1 - 5); ctx.lineTo(tx1 + 3.4, ty1 - 5);
    ctx.moveTo(tx1 - 2, ty1 - 12); ctx.lineTo(tx1 + 2, ty1 - 12);
    ctx.stroke();
    // 전파 마크
    ctx.strokeStyle = 'rgba(255,217,160,.9)';
    ctx.lineWidth = 1.1;
    [-6, -10, -14].forEach(dy => {
      ctx.beginPath();
      ctx.arc(tx1, ty1 - 20, -dy, -Math.PI * 0.78, -Math.PI * 0.22);
      ctx.stroke();
    });
    ctx.beginPath(); ctx.arc(tx1, ty1 - 20, 1.8, 0, 7);
    ctx.fillStyle = '#ffd9a0'; ctx.fill();

    // 호출부호 배지 (지표 아래)
    const label = 'DS2YTO';
    const sub = 'PM37';
    ctx.font = '700 9px ui-monospace, monospace';
    const lw = ctx.measureText(label).width;
    ctx.font = '600 7.5px ui-monospace, monospace';
    const sw2 = ctx.measureText(sub).width;
    const bw = lw + sw2 + 16, bh = 16;
    let bx = tx1 - 10, by = ty1 + 9;
    if (bx + bw > W - 4) bx = W - 4 - bw;
    if (bx < 4) bx = 4;
    ctx.fillStyle = 'rgba(8,15,30,.82)';
    roundRect(bx, by, bw, bh, 4.5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(127,216,255,.45)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.textAlign = 'left';
    ctx.fillStyle = '#eaf7ff';
    ctx.font = '700 9px ui-monospace, monospace';
    ctx.fillText(label, bx + 5, by + 11);
    ctx.fillStyle = 'rgba(185,168,255,.95)';
    ctx.font = '600 7.5px ui-monospace, monospace';
    ctx.fillText(sub, bx + 5 + lw + 4, by + 10.6);
  }

  function drawRoute(pts, prog) {
    const n = pts.length;
    const head = Math.max(0, Math.min(n - 1, Math.floor(prog * (n - 1))));

    // 전체 경로(희미)
    ctx.beginPath();
    pts.forEach((pt, i) => i ? ctx.lineTo(pt.p[0], pt.p[1]) : ctx.moveTo(pt.p[0], pt.p[1]));
    ctx.strokeStyle = 'rgba(190,220,255,.16)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([3, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 지나온 경로
    ctx.beginPath();
    for (let i = 0; i <= head; i++) {
      const q = pts[i].p;
      i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
    }
    const col = mode === 'day' ? '#ffcf8f' : mode === 'grey' ? '#a9ecff' : '#8fd8ff';
    ctx.strokeStyle = col;
    ctx.shadowColor = col;
    ctx.shadowBlur = 9;
    ctx.lineWidth = mode === 'grey' ? 2.4 : 2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 머리
    const hp = pts[head].p;
    const glow = ctx.createRadialGradient(hp[0], hp[1], 0, hp[0], hp[1], 12);
    glow.addColorStop(0, mode === 'day' ? 'rgba(255,179,107,.95)' : 'rgba(200,244,255,.95)');
    glow.addColorStop(1, 'rgba(127,216,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(hp[0], hp[1], 12, 0, 7); ctx.fill();
    ctx.fillStyle = mode === 'day' ? '#ffd3a6' : '#eafaff';
    ctx.beginPath(); ctx.arc(hp[0], hp[1], 3, 0, 7); ctx.fill();

    // 낮 모드: 흡수 지점
    if (mode === 'day') {
      const end = pts[n - 1].p;
      const flash = .5 + .5 * Math.sin(performance.now() / 260);
      ctx.strokeStyle = `rgba(255,170,110,${.35 + .35 * flash})`;
      ctx.lineWidth = 1.2;
      [8, 14, 20].forEach(r => {
        ctx.beginPath(); ctx.arc(end[0], end[1], r + flash * 2, 0, 7); ctx.stroke();
      });
      ctx.fillStyle = 'rgba(255,190,150,.9)';
      ctx.font = '9px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('흡수', end[0], end[1] + 28);
    }

    // 그레이 라인: 반대편 도달 지점
    if (mode === 'grey') {
      const end = pts[n - 1].p;
      ctx.beginPath(); ctx.arc(end[0], end[1] - 4, 2.6, 0, 7);
      ctx.fillStyle = '#a9ecff'; ctx.fill();
      ctx.beginPath(); ctx.arc(end[0], end[1] - 4, 7, 0, 7);
      ctx.strokeStyle = 'rgba(169,236,255,.35)'; ctx.lineWidth = 1; ctx.stroke();
    }
  }

  function drawCaption(m) {
    ctx.textAlign = 'left';
    ctx.font = '600 9.5px ui-monospace, monospace';
    const txt = m.caption;
    const w = ctx.measureText(txt).width + 16;
    ctx.fillStyle = 'rgba(6,11,24,.72)';
    roundRect(8, 8, w, 21, 7);
    ctx.fill();
    ctx.strokeStyle = 'rgba(127,216,255,.28)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#dff4ff';
    ctx.fillText(txt, 16, 22);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  let routeCache = null, routeMode = '';
  function frame(now) {
    const m = MODES[mode];
    if (playing) {
      p = ((now - tStart) % m.dur) / m.dur;
    }
    if (!routeCache || routeMode !== mode) { routeCache = buildRoute(m); routeMode = mode; }

    ctx.clearRect(0, 0, W, H);
    drawSky(m);
    drawTerminator();
    drawDuct(m);
    drawLayers();
    drawRoute(routeCache, p);
    drawGround();
    drawCaption(m);
    if (visible) raf = requestAnimationFrame(frame);
  }

  function start() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }

  function setMode(next) {
    if (!MODES[next]) return;
    mode = next;
    tStart = performance.now();
    p = 0;
    $$('#simModes button').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
    routeCache = null;
    if (!playing) frame(performance.now());
  }

  function toggle() {
    if (playing) {
      playing = false;
      cancelAnimationFrame(raf);
      $('#playBtn').innerHTML = playIcon(true);
      $('#playBtn').setAttribute('aria-label', '재생');
    } else {
      playing = true;
      $('#playBtn').innerHTML = playIcon(false);
      $('#playBtn').setAttribute('aria-label', '일시정지');
      tStart = performance.now() - p * MODES[mode].dur;
      start();
    }
  }

  function playIcon(paused) {
    return paused
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';
  }

  function init() {
    resize();
    setMode('grey');
    $('#playBtn').innerHTML = playIcon(!playing);
    $('#playBtn').setAttribute('aria-label', playing ? '일시정지' : '재생');
    $('#simModes').addEventListener('click', e => {
      const b = e.target.closest('button[data-mode]');
      if (b) setMode(b.dataset.mode);
    });
    $('#playBtn').addEventListener('click', toggle);

    if (window.ResizeObserver) {
      let t = 0;
      new ResizeObserver(() => {
        clearTimeout(t);
        t = setTimeout(() => { resize(); routeCache = null; if (!playing) frame(performance.now()); }, 120);
      }).observe(stage);
    } else {
      window.addEventListener('resize', () => { resize(); routeCache = null; });
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => {
        const vis = es[0].isIntersecting;
        if (vis === visible) return;
        visible = vis;
        if (vis && playing) start();
        else cancelAnimationFrame(raf);
      }, { threshold: .05 }).observe(stage);
    }

    if (playing) start(); else frame(performance.now());
  }

  return { init, setMode, toggle, get playing() { return playing; } };
})();

/* ── 서비스워커 ────────────────────────────────────────── */
function initSW() {
  const note = $('#swNote');
  const badge = $('#liveBadge'), liveText = $('#liveText');
  const isLocal = location.protocol === 'file:';

  if (!('serviceWorker' in navigator) || isLocal) {
    badge.classList.add('off');
    liveText.textContent = 'LOCAL';
    note.textContent = '파일에서 열림 — 오프라인 그대로 동작';
    return;
  }

  navigator.serviceWorker.register('sw.js').then(() => {
    badge.classList.add('off');
    badge.style.background = 'rgba(143,240,192,.1)';
    badge.style.borderColor = 'rgba(143,240,192,.3)';
    badge.classList.remove('off');
    liveText.textContent = 'READY';
    note.textContent = '오프라인 저장 완료 — 인터넷 없이 열립니다';
  }).catch(() => {
    badge.classList.add('off');
    liveText.textContent = 'ONLINE';
    note.textContent = '오프라인 저장은 https 접속에서 가능합니다';
  });
}

/* ── 시작 ──────────────────────────────────────────────── */
buildFreqTable();
markHotBands(['40m', '80m', '160m', '30m']);
bindGrid();
computeGrid();
bindCall();
buildPack();
Sim.init();
initPhase();
requestAnimationFrame(loop);
initSW();

function initPhase() {
  updatePhase(new Date());
}
