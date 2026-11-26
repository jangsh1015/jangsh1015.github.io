/* ── DS2YTO 모르스 부호(CW) 연습기 ─────────────────────────── */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(v => v[1]);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ── 언어 ─────────────────────────────────────────── */
  const T = (k, v) => (window.Lang5 ? window.Lang5.t(k, v) : k);

  /* ── 모르스 사전 ─────────────────────────────────── */
  const MORSE = {
    A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
    I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
    Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
    Y: '-.--', Z: '--..',
    0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-',
    5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.',
    '/': '-..-.', '?': '..--..', '.': '.-.-.-', ',': '--..--', '=': '-...-',
    '+': '.-.-.', '-': '-....-', ':': '---...', "'": '.----.', '(': '-.--.', ')': '-.--.-',
    '"': '.-..-.', '@': '.--.-.', '!': '-.-.--'
  };
  const PROSIGNS = { AR: '.-.-.', SK: '...-.-', BT: '-...-', KN: '-.--.', AS: '.-...', VE: '...-.' };
  const REV = {};
  Object.keys(MORSE).forEach(k => { if (!REV[MORSE[k]]) REV[MORSE[k]] = k; });
  const codeOf = str => Array.from(String(str).toUpperCase())
    .map(c => (c === ' ' ? '/' : (MORSE[c] || ''))).filter(Boolean).join(' ');

  /* ── 상태 ───────────────────────────────────────── */
  const LSKEY = 'cw_trainer_v1';
  const state = {
    wpm: 18, tone: 700, fw: false, eff: 12, qrn: false,
    tab: 'send', keyMode: 'straight', quizMode: 'alnum', choice: true,
    text: 'CQ CQ DE DS2YTO K'
  };
  const QDEFAULT = { total: 0, correct: 0, streak: 0 };

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(LSKEY);
      if (!raw) return;
      const o = JSON.parse(raw);
      ['wpm', 'tone', 'fw', 'eff', 'qrn', 'keyMode', 'quizMode', 'choice', 'text'].forEach(k => {
        if (k in o && typeof o[k] === typeof state[k]) state[k] = o[k];
      });
      if (state.tab === 'quiz' || state.tab === 'chart' || state.tab === 'key') state.tab = 'send';
    } catch (e) { /* 저장값이 깨졌으면 기본값 */ }
  }
  let saveT = 0;
  function savePrefs() {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      try {
        const o = {};
        ['wpm', 'tone', 'fw', 'eff', 'qrn', 'keyMode', 'quizMode', 'choice', 'text'].forEach(k => o[k] = state[k]);
        localStorage.setItem(LSKEY, JSON.stringify(o));
      } catch (e) { /* 저장 실패는 무시 */ }
    }, 250);
  }

  /* ── 오디오 엔진 ─────────────────────────────────── */
  const A = { ctx: null, master: null, noise: null, noiseGain: null };
  let hold = null;           // 스트레이트 키를 누르고 있는 동안의 오실레이터
  let oneShotEnd = 0;        // 한 번짜리 재생이 끝나는 시각
  let scopeEnv = 0;          // 스코프 표시용 엔벨로프

  function audioInit() {
    if (A.ctx) {
      if (A.ctx.state === 'suspended') A.ctx.resume().then(() => badge(true)).catch(() => {});
      else badge(A.ctx.state === 'running');
      return A.ctx;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { badge(false, 'NO AUDIO'); return null; }
    A.ctx = new AC();
    A.master = A.ctx.createGain();
    A.master.gain.value = 0.85;
    A.master.connect(A.ctx.destination);
    buildNoise();
    A.ctx.onstatechange = () => badge(A.ctx.state === 'running');
    if (A.ctx.state === 'suspended') A.ctx.resume();
    badge(A.ctx.state === 'running');
    return A.ctx;
  }

  function ensureAudio() {
    const ctx = audioInit();
    if (!ctx) return false;
    if (ctx.state === 'suspended') { ctx.resume().catch(() => {}); }
    return true;
  }

  function badge(on, txt) {
    const el = $('#audioBadge'), t = $('#audioText');
    if (!el) return;
    el.classList.toggle('off', !on);
    t.textContent = txt || (on ? 'AUDIO ON' : 'AUDIO OFF');
  }

  /* 밴드 잡음(QRN): 저역 위주 노이즈 + 아주 느린 페이딩 */
  function buildNoise() {
    const ctx = A.ctx;
    const len = Math.floor(ctx.sampleRate * 3);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let b = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b = (b + 0.02 * w) / 1.02;
      d[i] = w * 0.5 + b * 2.4;
    }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 100;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500; lp.Q.value = 0.5;
    const pk = ctx.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 260; pk.Q.value = 0.8; pk.gain.value = 6;
    A.noiseGain = ctx.createGain(); A.noiseGain.gain.value = 0.0001;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.08;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.03;
    lfo.connect(lfoG).connect(A.noiseGain.gain);
    src.connect(hp); hp.connect(lp); lp.connect(pk); pk.connect(A.noiseGain); A.noiseGain.connect(A.master);
    src.start(0); lfo.start(0);
    A.noise = { src, lfo };
  }

  function setQrn(on) {
    if (on) ensureAudio();
    if (!A.noiseGain || !A.ctx) return;
    const t = A.ctx.currentTime;
    A.noiseGain.gain.cancelScheduledValues(t);
    A.noiseGain.gain.setValueAtTime(Math.max(0.0001, A.noiseGain.gain.value), t);
    A.noiseGain.gain.linearRampToValueAtTime(on ? 0.085 : 0.0001, t + 0.5);
  }

  function tone(when, dur) {
    if (!A.ctx) return null;
    const ctx = A.ctx;
    dur = Math.max(0.02, dur);
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = state.tone;
    const g = ctx.createGain();
    const a = Math.min(0.005, dur * 0.4);
    const r = Math.min(0.005, dur * 0.4);
    const amp = 0.42;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(amp, when + a);
    g.gain.setValueAtTime(amp, when + Math.max(a, dur - r));
    g.gain.linearRampToValueAtTime(0.0001, when + dur);
    osc.connect(g); g.connect(A.master);
    osc.start(when); osc.stop(when + dur + 0.03);
    return osc;
  }

  function killNodes(nodes) {
    (nodes || []).forEach(n => { try { n.stop(); } catch (e) { /* 이미 멈춤 */ } });
  }

  /* 스트레이트 키: 누르는 동안 이어지는 사이드톤 */
  function holdStart() {
    if (!A.ctx || hold) return;
    const ctx = A.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = state.tone;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.42, t + 0.005);
    o.connect(g); g.connect(A.master); o.start(t);
    hold = { o, g };
  }
  function holdStop() {
    if (!hold || !A.ctx) return;
    const ctx = A.ctx, t = ctx.currentTime;
    try {
      hold.g.gain.cancelScheduledValues(t);
      hold.g.gain.setValueAtTime(0.42, t);
      hold.g.gain.linearRampToValueAtTime(0.0001, t + 0.005);
      hold.o.stop(t + 0.03);
    } catch (e) { /* 무시 */ }
    hold = null;
  }

  /* ── 타이밍 (Farnsworth) ─────────────────────────── */
  function timing() {
    const c = state.wpm;
    const e = state.fw ? clamp(state.eff, 5, c) : c;
    const unit = 1200 / c;                       // ms
    let charGap = 3 * unit, wordGap = 7 * unit;
    if (e < c) {
      const extra = 60000 / e - 60000 / c;       // PARIS 한 단어 기준 늘어난 시간(ms)
      charGap += extra * 0.158;                  // 글자 사이 4곳
      wordGap += extra * 0.368;                  // 단어 사이 1곳
    }
    return { unit: unit / 1000, charGap: charGap / 1000, wordGap: wordGap / 1000 };
  }

  /* ── 스코프 ─────────────────────────────────────── */
  const scopeCanvas = $('#scope');
  const scopeCtx = scopeCanvas ? scopeCanvas.getContext('2d') : null;
  const scopeLabEl = $('#scopeLab');
  let audioActive = false;

  function toneActiveNow() {
    if (hold) return true;
    if (!A.ctx) return false;
    const now = A.ctx.currentTime;
    if (oneShotEnd > now) return true;
    if (P.playing) {
      for (let i = 0; i < P.items.length; i++) {
        const it = P.items[i];
        if (now >= it.start && now < it.end) return true;
      }
    }
    return false;
  }

  function drawScope(ts) {
    requestAnimationFrame(drawScope);
    if (!scopeCtx) return;
    const c = scopeCanvas;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = c.clientWidth || 340, h = c.clientHeight || 66;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    }
    const g = scopeCtx;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);

    g.strokeStyle = 'rgba(127,216,255,.07)'; g.lineWidth = 1;
    for (let x = 0; x < w; x += 22) { g.beginPath(); g.moveTo(x + .5, 0); g.lineTo(x + .5, h); g.stroke(); }
    for (let y = 8; y < h; y += 16) { g.beginPath(); g.moveTo(0, y + .5); g.lineTo(w, y + .5); g.stroke(); }
    g.strokeStyle = 'rgba(127,216,255,.2)';
    g.beginPath(); g.moveTo(0, h / 2 + .5); g.lineTo(w, h / 2 + .5); g.stroke();

    audioActive = toneActiveNow();
    scopeEnv += ((audioActive ? 1 : 0) - scopeEnv) * 0.3;

    const t = ts / 1000;
    const idle = state.qrn ? 0.075 : 0.02;
    const amp = (h * 0.32) * Math.max(scopeEnv, idle);
    g.beginPath();
    for (let x = 0; x <= w; x += 1.5) {
      const phase = (x / w) * Math.PI * 2 * 5 + t * 9;
      const wob = audioActive ? 1 : (0.4 + 0.6 * Math.sin(t * 1.7 + x * 0.05));
      const y = h / 2 + Math.sin(phase) * amp * wob;
      if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    const hot = scopeEnv > 0.35;
    g.strokeStyle = hot ? 'rgba(255,217,160,.96)' : 'rgba(127,216,255,.72)';
    g.lineWidth = 1.5;
    g.shadowColor = hot ? 'rgba(255,178,107,.95)' : 'rgba(127,216,255,.75)';
    g.shadowBlur = 9;
    g.stroke();
    g.shadowBlur = 0;

    scopeLabEl.classList.toggle('hot', hot);
  }

  /* ── ① 재생 엔진 ────────────────────────────────── */
  const P = { items: [], chars: [], nodes: [], playing: false, loop: false, startAbs: 0, endAbs: 0, raf: 0, timer: 0, cur: -2, text: '' };

  function buildPlayback(text) {
    const T = timing();
    const chars = Array.from(String(text).toUpperCase());
    const items = [];
    let skipped = 0;
    const start = A.ctx.currentTime + 0.12;
    let t = start;
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      if (ch === '\n') { t += T.wordGap * 1.6; continue; }
      if (ch === ' ') { t += T.wordGap; continue; }
      const code = MORSE[ch];
      if (!code) { skipped++; continue; }
      for (let k = 0; k < code.length; k++) {
        const len = code[k] === '.' ? T.unit : T.unit * 3;
        items.push({ i, k, sym: code[k], start: t, end: t + len });
        t += len;
        if (k < code.length - 1) t += T.unit;
      }
      t += T.charGap;
    }
    return { items, chars, start, end: t, skipped };
  }

  function renderRibbon(chars) {
    const rb = $('#ribbon');
    rb.innerHTML = '';
    chars.forEach((ch, i) => {
      const s = document.createElement('span');
      s.textContent = ch === ' ' ? ' ' : ch;
      s.dataset.i = i;
      s.style.whiteSpace = 'pre';
      rb.appendChild(s);
    });
    if (!chars.length) rb.innerHTML = '<span class="done">—</span>';
  }

  function renderNowChar(chars, idx, symIdx) {
    const ch = chars[idx];
    const nc = $('#nowChar'), ncode = $('#nowCode');
    nc.textContent = ch === ' ' ? '␣' : ch;
    const code = MORSE[ch] || '';
    ncode.innerHTML = Array.from(code).map((s, k) =>
      `<span class="sym${k === symIdx ? ' on' : ''}">${s === '.' ? '·' : '—'}</span>`
    ).join('') || '<span class="sym">·</span>';
  }

  function playText(text, loop) {
    if (!ensureAudio()) { toast(T('toast.noAudio')); return; }
    stopPlayback();
    const b = buildPlayback(text);
    if (!b.items.length) { toast(T('toast.noChars')); return; }
    if (b.skipped) toast(T('toast.skipped', { n: b.skipped }));
    P.items = b.items;
    P.chars = b.chars;
    P.startAbs = b.start;
    P.endAbs = b.end;
    P.text = text;
    P.nodes = b.items.map(it => tone(it.start, it.end - it.start));
    P.playing = true;
    P.loop = !!loop;
    P.cur = -2;
    renderRibbon(b.chars);
    setPlayUI(true);
    $('#txTag').classList.add('on');
    $('#txTag').innerHTML = '<i></i>TX';
    P.timer = setTimeout(finishPlay, (P.endAbs - A.ctx.currentTime) * 1000 + 180);
    if (!P.raf) P.raf = requestAnimationFrame(playFrame);
  }

  function finishPlay() {
    if (!P.playing) return;
    if (P.loop) { playText(P.text, true); return; }
    stopPlayback(true);
  }

  function stopPlayback(keepRibbon) {
    P.playing = false;
    clearTimeout(P.timer);
    if (P.raf) { cancelAnimationFrame(P.raf); P.raf = 0; }
    killNodes(P.nodes);
    P.nodes = [];
    setPlayUI(false);
    $('#txTag').classList.remove('on');
    $('#txTag').innerHTML = '<i></i>STANDBY';
    $('#playBarFill').style.width = '0%';
    $('#nowChar').textContent = '—';
    $('#nowCode').innerHTML = '<span class="sym">·</span>';
    if (!keepRibbon) {
      $$('#ribbon span').forEach(s => s.classList.remove('on', 'done'));
      renderRibbon([]);
    } else {
      $$('#ribbon span').forEach(s => { s.classList.remove('on'); s.classList.add('done'); });
    }
  }

  function playFrame() {
    if (!P.playing) { P.raf = 0; return; }
    const now = A.ctx.currentTime;
    if (now >= P.endAbs) { finishPlay(); if (!P.playing) { P.raf = 0; return; } }
    let cur = -1;
    for (let i = 0; i < P.items.length; i++) {
      const it = P.items[i];
      if (now >= it.start && now < it.end) { cur = i; break; }
      if (it.start > now) break;
    }
    if (cur !== P.cur) {
      P.cur = cur;
      if (cur >= 0) {
        const it = P.items[cur];
        renderNowChar(P.chars, it.i, it.k);
        $$('#ribbon span').forEach(s => {
          const i = Number(s.dataset.i);
          s.classList.toggle('on', i === it.i);
          s.classList.toggle('done', i < it.i);
        });
      }
    }
    const total = Math.max(0.001, P.endAbs - P.startAbs);
    const pct = clamp((now - P.startAbs) / total, 0, 1) * 100;
    $('#playBarFill').style.width = pct.toFixed(1) + '%';
    P.raf = requestAnimationFrame(playFrame);
  }

  function setPlayUI(on) {
    $('#playIco').textContent = on ? '■' : '▶';
    $('#playLab').textContent = on ? T('send.stop') : T('send.play');
    $('#playBtn').classList.toggle('tx', on);
    $('#playBtn').setAttribute('aria-pressed', on ? 'true' : 'false');
    if (on) $('#scopeLab').textContent = 'TX · SIDETONE';
    else $('#scopeLab').textContent = 'SIDETONE';
  }

  /* 한 번짜리 재생 (퀴즈·부호표) */
  let oneShotNodes = [];
  function playOnce(text) {
    if (!ensureAudio()) return 0;
    killNodes(oneShotNodes); oneShotNodes = [];
    stopPlayback();
    const T = timing();
    let t = A.ctx.currentTime + 0.05;
    const chars = Array.from(String(text).toUpperCase());
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      if (ch === ' ' || ch === '\n') { t += ch === '\n' ? T.wordGap * 1.6 : T.wordGap; continue; }
      const code = MORSE[ch];
      if (!code) continue;
      for (let k = 0; k < code.length; k++) {
        const len = code[k] === '.' ? T.unit : T.unit * 3;
        oneShotNodes.push(tone(t, len));
        t += len;
        if (k < code.length - 1) t += T.unit;
      }
      t += T.charGap;
    }
    oneShotEnd = t;
    return t;
  }

  function playSyms(code, onEnd) {
    if (!ensureAudio()) return;
    killNodes(oneShotNodes); oneShotNodes = [];
    stopPlayback();
    const u = (1200 / state.wpm) / 1000;
    let t = A.ctx.currentTime + 0.04;
    Array.from(code).forEach(s => {
      const d = s === '.' ? u : u * 3;
      oneShotNodes.push(tone(t, d));
      t += d + u;
    });
    oneShotEnd = t;
    if (onEnd) setTimeout(onEnd, Math.max(0, (t - A.ctx.currentTime) * 1000));
  }

  /* ── ② 전건 타건 ────────────────────────────────── */
  const K = { unit: 1200 / 18, out: '', buf: '', down: false, downAt: 0, upAt: 0, finalT: 0 };
  const I = { dot: false, dash: false, last: '', lastAt: 0, running: false, timer: 0, first: true };

  function keyUnitFromWpm() { return 1200 / state.wpm; }

  function renderKey() {
    const out = $('#dcOut');
    const txt = K.out.replace(/ /g, '␣');
    let html = '';
    if (txt) html += esc(txt);
    if (K.buf) html += `<span class="cur">${esc(K.buf)}</span>`;
    if (!html) html = '<span class="dc-empty">' + esc(T('key.empty')) + '</span>';
    out.innerHTML = html;
    const cur = K.buf ? (REV[K.buf] || '…') : '—';
    $('#dcCur').textContent = cur;
    $('#dcCurCode').textContent = K.buf ? Array.from(K.buf).map(s => s === '.' ? '·' : '—').join(' ') : '';
    $('#dcUnit').textContent = T('key.unit', { ms: Math.round(K.unit), wpm: Math.round(1200 / K.unit) });
  }

  function pushSym(sym) {
    clearTimeout(K.finalT);
    K.buf += sym;
    if (K.buf.length > 12) K.buf = K.buf.slice(-12);
    renderKey();
  }

  function finalizeChar() {
    clearTimeout(K.finalT);
    if (!K.buf) return;
    const ch = REV[K.buf] || '?';
    K.out += ch;
    if (K.out.length > 400) K.out = K.out.slice(-400);
    K.buf = '';
    I.last = '';
    renderKey();
  }

  function keyReset() {
    K.out = ''; K.buf = ''; K.unit = keyUnitFromWpm();
    I.last = ''; I.lastAt = 0;
    clearTimeout(K.finalT);
    renderKey();
  }

  function wordSpace() {
    finalizeChar();
    if (K.out && !K.out.endsWith(' ')) K.out += ' ';
    renderKey();
  }

  function backChar() {
    if (K.buf) { K.buf = K.buf.slice(0, -1); renderKey(); return; }
    K.out = K.out.replace(/ ?$/, '');
    renderKey();
  }

  /* 스트레이트 키 이벤트 */
  const straightKey = $('#straightKey');

  function skDown(e) {
    if (e && e.cancelable) e.preventDefault();
    if (!ensureAudio()) return;
    if (K.down) return;
    const now = performance.now();
    if (K.upAt && now - K.upAt > K.unit * 7 && K.out && !K.out.endsWith(' ')) K.out += ' ';
    K.down = true;
    K.downAt = now;
    clearTimeout(K.finalT);
    holdStart();
    straightKey.classList.add('keyed');
    renderKey();
  }

  function skUp(e) {
    if (!K.down) return;
    if (e && e.cancelable) e.preventDefault();
    const now = performance.now();
    const dur = now - K.downAt;
    K.down = false;
    K.upAt = now;
    holdStop();
    straightKey.classList.remove('keyed');
    const u = K.unit;
    const isDot = dur < u * 2;
    if (isDot) K.unit = clamp(u * 0.7 + dur * 0.3, 35, 420);
    else K.unit = clamp(u * 0.85 + (dur / 3) * 0.15, 35, 420);
    pushSym(isDot ? '.' : '-');
    K.finalT = setTimeout(finalizeChar, Math.max(320, K.unit * 3.2));
  }

  straightKey.addEventListener('pointerdown', skDown);
  straightKey.addEventListener('pointerup', skUp);
  straightKey.addEventListener('pointercancel', skUp);
  straightKey.addEventListener('pointerleave', e => { if (K.down) skUp(e); });
  straightKey.addEventListener('contextmenu', e => e.preventDefault());

  /* 아이앰빅 전자키 */
  const padDot = $('#padDot'), padDash = $('#padDash');

  function keyerStep() {
    if (!I.dot && !I.dash) {
      I.running = false;
      K.finalT = setTimeout(finalizeChar, Math.max(320, K.unit * 3));
      return;
    }
    const now = performance.now();
    if (!K.buf && I.lastAt && now - I.lastAt > K.unit * 7 && K.out && !K.out.endsWith(' ')) K.out += ' ';
    const u = keyUnitFromWpm();
    K.unit = u;
    let sym;
    if (I.dot && I.dash) sym = I.last === '.' ? '-' : '.';
    else sym = I.dot ? '.' : '-';
    I.last = sym;
    I.lastAt = now;
    const dur = (sym === '.' ? u : u * 3) / 1000;
    tone(A.ctx.currentTime + 0.008, dur);
    oneShotEnd = A.ctx.currentTime + dur + 0.01;
    pushSym(sym);
    I.timer = setTimeout(keyerStep, (sym === '.' ? u * 2 : u * 4));
  }

  function padDown(which, e) {
    if (e && e.cancelable) e.preventDefault();
    if (!ensureAudio()) return;
    clearTimeout(K.finalT);
    if (which === 'dot') { I.dot = true; padDot.classList.add('keyed'); }
    else { I.dash = true; padDash.classList.add('keyed'); }
    if (!I.running) { I.running = true; keyerStep(); }
  }
  function padUp(which, e) {
    if (e && e.cancelable) e.preventDefault();
    if (which === 'dot') { I.dot = false; padDot.classList.remove('keyed'); }
    else { I.dash = false; padDash.classList.remove('keyed'); }
    if (!I.dot && !I.dash) {
      clearTimeout(I.timer);
      I.running = false;
      clearTimeout(K.finalT);
      K.finalT = setTimeout(finalizeChar, Math.max(320, K.unit * 3));
    }
  }

  [['dot', padDot], ['dash', padDash]].forEach(([w, el]) => {
    el.addEventListener('pointerdown', e => padDown(w, e));
    el.addEventListener('pointerup', e => padUp(w, e));
    el.addEventListener('pointercancel', e => padUp(w, e));
    el.addEventListener('pointerleave', e => { if ((w === 'dot' && I.dot) || (w === 'dash' && I.dash)) padUp(w, e); });
    el.addEventListener('contextmenu', e => e.preventDefault());
  });

  /* 키보드: 스페이스 = 스트레이트 키, . / = 점·선 패들 */
  document.addEventListener('keydown', e => {
    if (e.repeat) return;
    const tag = (e.target && e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if (state.tab !== 'key') return;
    if (e.code === 'Space') { e.preventDefault(); if (state.keyMode === 'straight') skDown(); else padDown('dot'); }
    else if (e.key === '.') { e.preventDefault(); padDown('dot'); }
    else if (e.key === '-') { e.preventDefault(); padDown('dash'); }
  });
  document.addEventListener('keyup', e => {
    const tag = (e.target && e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if (state.tab !== 'key') return;
    if (e.code === 'Space') { if (state.keyMode === 'straight') skUp(); else padUp('dot'); }
    else if (e.key === '.') padUp('dot');
    else if (e.key === '-') padUp('dash');
  });

  $('#keyMode').addEventListener('click', e => {
    const b = e.target.closest('button[data-km]');
    if (!b) return;
    state.keyMode = b.dataset.km;
    savePrefs();
    $$('#keyMode button').forEach(x => x.classList.toggle('on', x === b));
    $('#keyStraight').hidden = state.keyMode !== 'straight';
    $('#keyIambic').hidden = state.keyMode !== 'iambic';
    keyReset();
    if (state.keyMode === 'straight') ensureAudio();
  });

  $('#spaceBtn').addEventListener('click', () => { ensureAudio(); wordSpace(); });
  $('#backBtn').addEventListener('click', backChar);
  $('#clearBtn').addEventListener('click', () => { keyReset(); toast(T('toast.keyCleared')); });

  /* ── ③ 청취 퀴즈 ────────────────────────────────── */
  const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const NUM = '0123456789';
  const ABBR = ['CQ', 'DE', 'QTH', 'RST', '73', 'K', 'BK', 'TU'];
  const ABBR_KO = {
    CQ: 'quiz.abbrCQ', DE: 'quiz.abbrDE', QTH: 'quiz.abbrQTH', RST: 'quiz.abbrRST',
    '73': 'quiz.abbr73', K: 'quiz.abbrK', BK: 'quiz.abbrBK', TU: 'quiz.abbrTU'
  };
  const PREFIX = ['HL2', 'HL3', 'HL5', 'DS1', 'DS2', 'DS4', '6K2', 'JA1', 'JA3', 'W6', 'K1', 'VK2', 'VK4', 'DL1', 'DL5', 'F5', 'I2', 'OH2', 'UA9', 'BY1', 'VE3', 'PY2', 'ZL1', 'EA3'];
  const SUF = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const QSO_TPL = [
    { text: 'CQ CQ DE {call} K', ko: 'quiz.qso1' },
    { text: '{call} DE DS2YTO K', ko: 'quiz.qso2' },
    { text: 'DE {call} UR RST 5NN K', ko: 'quiz.qso3' },
    { text: 'DS2YTO DE {call} R RST 5NN {call} K', ko: 'quiz.qso4' },
    { text: '{call} DE DS2YTO TU 73 ES GL SK', ko: 'quiz.qso5' },
    { text: '{call} DE DS2YTO QTH PM37 QRU? K', ko: 'quiz.qso6' },
    { text: 'QRZ? DE {call} K', ko: 'quiz.qso7' }
  ];

  const Q = { mode: 'alnum', choice: true, cur: null, n: 1, answered: false, last: null, stats: { ...QDEFAULT } };

  function randCall() {
    let s = pick(SUF) + pick(SUF);
    if (Math.random() < 0.55) s += pick(SUF);
    return pick(PREFIX) + s;
  }

  function distract(correct, gen) {
    const out = [], seen = new Set([correct]);
    let guard = 0;
    while (out.length < 3 && guard++ < 200) {
      const v = gen();
      if (!seen.has(v)) { seen.add(v); out.push(v); }
    }
    return out;
  }

  function makeItem() {
    if (Q.mode === 'alnum') {
      if (Q.choice) {
        const c = pick(ABC + NUM);
        return { kind: 'char', audio: c, answer: c, ask: 'quiz.askChar', options: distract(c, () => pick(ABC + NUM)) };
      }
      let s = '';
      for (let i = 0; i < 3; i++) s += pick(ABC + NUM);
      return { kind: 'group', audio: Array.from(s).join(' '), answer: s, ask: 'quiz.askGroup', options: null };
    }
    if (Q.mode === 'abbr') {
      const a = pick(ABBR);
      return { kind: 'abbr', audio: a, answer: a, ask: 'quiz.askAbbr', options: distract(a, () => pick(ABBR)), ko: ABBR_KO[a] };
    }
    const call = randCall();
    const tp = pick(QSO_TPL);
    return {
      kind: 'qso',
      audio: tp.text.replace(/\{call\}/g, call),
      answer: call,
      ask: 'quiz.askQso',
      copy: tp.text.replace(/\{call\}/g, call),
      ko: tp.ko.replace(/\{call\}/g, call),
      options: distract(call, randCall)
    };
  }

  function loadStats() {
    try {
      const raw = localStorage.getItem(LSKEY + '_quiz');
      if (raw) {
        const o = JSON.parse(raw);
        if (o && typeof o.total === 'number') Q.stats = { total: o.total | 0, correct: o.correct | 0, streak: o.streak | 0 };
      }
    } catch (e) { /* 무시 */ }
  }
  function saveStats() {
    try { localStorage.setItem(LSKEY + '_quiz', JSON.stringify(Q.stats)); } catch (e) { /* 무시 */ }
  }
  function renderStats() {
    const s = Q.stats;
    $('#scRate').textContent = s.total ? Math.round((s.correct / s.total) * 100) + '%' : '—';
    $('#scTotal').textContent = s.total;
    $('#scStreak').textContent = s.streak;
  }

  function renderQuiz() {
    const it = Q.cur;
    if (!it) return;
    Q.answered = false;
    $('#quizTag').textContent = 'Q' + Q.n;
    $('#qAsk').textContent = T(it.ask);
    const body = $('#qBody');
    body.innerHTML = '';
    const fb = $('#qFb'); fb.hidden = true; fb.className = 'q-fb';
    $('#qNext').hidden = true;

    if (Q.choice && it.options) {
      body.classList.remove('single');
      shuffle([it.answer].concat(it.options)).forEach(o => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'q-choice';
        b.dataset.v = o;
        const sub = it.kind === 'abbr' ? (ABBR_KO[o] ? T(ABBR_KO[o]).split('—')[0].trim() : '') : '';
        b.innerHTML = `<span>${esc(o)}</span>${sub ? `<span class="qc-sub">${esc(sub)}</span>` : ''}`;
        b.addEventListener('click', () => submitAnswer(o, b));
        body.appendChild(b);
      });
    } else {
      body.classList.add('single');
      const wrap = document.createElement('div');
      wrap.className = 'q-input';
      wrap.innerHTML = `<input id="qInp" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="${esc(T(it.kind === 'qso' ? 'quiz.phCall' : (it.kind === 'group' ? 'quiz.phGroup' : 'quiz.phCode')))}" aria-label="정답 입력"><button type="button" id="qSub">확인</button>`;
      body.appendChild(wrap);
      const inp = $('#qInp', wrap), btn = $('#qSub', wrap);
      const go = () => submitAnswer(inp.value, null);
      btn.addEventListener('click', go);
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
      setTimeout(() => inp.focus({ preventScroll: true }), 60);
    }
    renderStats();
  }

  function normalize(v) { return String(v).toUpperCase().replace(/[^A-Z0-9/]/g, ''); }

  function submitAnswer(val, btn) {
    if (Q.answered) return;
    const it = Q.cur;
    if (!normalize(val)) { toast(T('toast.needAnswer')); return; }
    Q.answered = true;
    const ok = normalize(val) === normalize(it.answer);
    Q.stats.total++;
    if (ok) { Q.stats.correct++; Q.stats.streak++; } else Q.stats.streak = 0;
    saveStats();
    renderStats();

    $$('.q-choice').forEach(b => {
      b.disabled = true;
      if (normalize(b.dataset.v) === normalize(it.answer)) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
      else b.classList.add('dim');
    });
    const inp = $('#qInp');
    if (inp) { inp.disabled = true; if (!ok) inp.classList.add('wrong'); }
    const subBtn = $('#qSub');
    if (subBtn) subBtn.disabled = true;

    Q.last = { it, ok };
    renderFb();
    if (!ok) setTimeout(() => playOnce(it.audio), 260);
  }

  /* 정답 여부 풀피드백 (언어가 바뀌면 다시 그린다) */
  function renderFb() {
    const st = Q.last;
    if (!st) return;
    const it = st.it, ok = st.ok;
    const fb = $('#qFb');
    fb.hidden = false;
    fb.className = 'q-fb ' + (ok ? 'ok' : 'no');
    fb.innerHTML =
      `<div class="q-fb-h">${ok ? T('quiz.ok') : T('quiz.no')}${ok ? ' <span style="margin-left:auto;font-family:var(--mono);font-size:9px;color:var(--dim);letter-spacing:.1em">CONTACT!</span>' : ''}</div>` +
      `<div class="q-fb-ans">${esc(it.answer)} <em>${esc(codeOf(it.answer))}</em></div>` +
      (it.copy ? `<div class="q-fb-copy">${esc(it.copy)}</div>` : '') +
      (it.ko ? `<div class="q-fb-ko">${esc(T(it.ko, { call: it.answer }))}</div>` : '');
    $('#qNext').hidden = false;
  }

  function nextQuestion(autoplay) {
    Q.n += 1;
    Q.last = null;
    Q.cur = makeItem();
    renderQuiz();
    if (autoplay !== false) { playOnce(Q.cur.audio); }
  }

  $('#qModes').addEventListener('click', e => {
    const b = e.target.closest('button[data-qm]');
    if (!b) return;
    Q.mode = b.dataset.qm;
    state.quizMode = Q.mode; savePrefs();
    $$('#qModes button').forEach(x => x.classList.toggle('on', x === b));
    Q.n = 1;
    Q.cur = makeItem();
    renderQuiz();
    playOnce(Q.cur.audio);
  });

  $('#qChoice').addEventListener('change', e => {
    Q.choice = e.target.checked;
    state.choice = Q.choice; savePrefs();
    $('#qOptsNote').textContent = Q.choice ? T('quiz.offNote') : T('quiz.onNote');
    Q.cur = makeItem();
    renderQuiz();
    playOnce(Q.cur.audio);
  });

  $('#qPlay').addEventListener('click', () => {
    if (!Q.cur) Q.cur = makeItem(), renderQuiz();
    playOnce(Q.cur.audio);
  });
  $('#qNext').addEventListener('click', () => nextQuestion(true));
  $('#scReset').addEventListener('click', () => {
    Q.stats = { ...QDEFAULT };
    saveStats(); renderStats();
    toast(T('toast.quizReset'));
  });

  /* ── ④ 부호표 ───────────────────────────────────── */
  function buildChart() {
    const sets = [
      ['gridAlpha', Array.from(ABC)],
      ['gridNum', Array.from(NUM)],
      ['gridSym', ['/', '?', '.', ',', '=', '+', '-', ':']],
      ['gridPro', Object.keys(PROSIGNS)]
    ];
    sets.forEach(([id, keys]) => {
      const box = $('#' + id);
      if (!box) return;
      box.innerHTML = '';
      keys.forEach(k => {
        const code = MORSE[k] || PROSIGNS[k] || '';
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'mcell';
        el.dataset.k = k;
        el.setAttribute('aria-label', T('chart.cellAria', { k: k === ' ' ? 'space' : k }));
        el.innerHTML = `<b>${esc(k)}</b><em>${Array.from(code).map(s => `<i class="${s === '.' ? 'd' : 's'}"></i>`).join('')}</em>`;
        el.addEventListener('click', () => {
          ensureAudio();
          playSyms(code);
          el.classList.add('hit');
          setTimeout(() => el.classList.remove('hit'), 260);
        });
        box.appendChild(el);
      });
    });
  }

  /* ── 탭 · 컨트롤 ────────────────────────────────── */
  function setTab(tab) {
    state.tab = tab;
    $$('.tab').forEach(b => {
      const on = b.dataset.tab === tab;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    $$('.pane').forEach(p => p.classList.toggle('on', p.id === 'pane-' + tab));
    if (tab !== 'send') stopPlayback(true);
    if (tab === 'quiz' && !Q.cur) { Q.cur = makeItem(); renderQuiz(); }
    if (tab !== 'key') { holdStop(); clearTimeout(K.finalT); }
    if (A.ctx) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  $$('.tab').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));

  const wpmEl = $('#wpm'), toneEl = $('#tone'), effEl = $('#eff');

  function paintRange(el) {
    const min = Number(el.min), max = Number(el.max), v = Number(el.value);
    el.style.setProperty('--p', ((v - min) / (max - min) * 100).toFixed(1) + '%');
  }

  function syncControlUI() {
    $('#wpmVal').textContent = state.wpm;
    $('#toneVal').textContent = state.tone;
    $('#effVal').textContent = state.eff;
    $('#scopeFreq').textContent = state.tone + ' Hz';
    $('#scopeWpm').textContent = state.wpm + ' WPM' + (state.fw ? ' · FW ' + state.eff : '');
    $('#iambicWpm').textContent = state.wpm;
    const fwChip = $('#fwChip'), qrnChip = $('#qrnChip');
    fwChip.setAttribute('aria-pressed', state.fw ? 'true' : 'false');
    qrnChip.setAttribute('aria-pressed', state.qrn ? 'true' : 'false');
    $('#fwVal').textContent = state.fw ? state.eff + ' WPM' : 'OFF';
    $('#qrnVal').textContent = state.qrn ? 'ON' : 'OFF';
    $('#fwSub').hidden = !state.fw;
    $('#fwHint').innerHTML = T('ctl.fwHint', { wpm: state.wpm, eff: state.eff });
    wpmEl.value = state.wpm; toneEl.value = state.tone; effEl.value = state.eff;
    effEl.max = String(state.wpm);
    paintRange(wpmEl); paintRange(toneEl); paintRange(effEl);
  }

  wpmEl.addEventListener('input', () => {
    state.wpm = Number(wpmEl.value);
    if (state.eff >= state.wpm) state.eff = Math.max(5, state.wpm - 1);
    if (state.keyMode === 'straight' && !K.out && !K.buf) K.unit = keyUnitFromWpm();
    syncControlUI(); savePrefs();
  });
  toneEl.addEventListener('input', () => {
    state.tone = Number(toneEl.value);
    if (hold) hold.o.frequency.setTargetAtTime(state.tone, A.ctx.currentTime, 0.02);
    syncControlUI(); savePrefs();
  });
  effEl.addEventListener('input', () => {
    state.eff = clamp(Number(effEl.value), 5, state.wpm);
    syncControlUI(); savePrefs();
  });

  $('#fwChip').addEventListener('click', () => {
    state.fw = !state.fw;
    if (state.fw && state.eff >= state.wpm) state.eff = Math.max(5, state.wpm - 2);
    syncControlUI(); savePrefs();
    if (state.fw) toast(T('toast.fwOn', { wpm: state.wpm, eff: state.eff }));
  });

  $('#qrnChip').addEventListener('click', () => {
    state.qrn = !state.qrn;
    ensureAudio();
    setQrn(state.qrn);
    syncControlUI(); savePrefs();
    if (state.qrn) toast(T('toast.qrnOn'));
  });

  $('#audioBadge').addEventListener('click', () => {
    ensureAudio();
    if (A.ctx && A.ctx.state === 'running') {
      badge(true);
      setTimeout(() => playSyms('.-.-.'), 60);
      toast(T('toast.audioOn', { tone: state.tone }));
    } else {
      toast(T('toast.audioFail'));
    }
  });

  /* 재생 관련 */
  const textEl = $('#txText');
  textEl.value = state.text;
  textEl.addEventListener('input', () => {
    state.text = textEl.value;
    savePrefs();
    if (!P.playing) renderRibbon(Array.from(state.text.toUpperCase()));
  });

  $('#presets').addEventListener('click', e => {
    const b = e.target.closest('.preset');
    if (!b) return;
    textEl.value = b.dataset.tx;
    state.text = b.dataset.tx;
    savePrefs();
    playText(state.text, $('#loopBtn').getAttribute('aria-pressed') === 'true');
  });

  $('#playBtn').addEventListener('click', () => {
    if (P.playing) { stopPlayback(true); return; }
    const t = textEl.value.trim();
    if (!t) { toast(T('toast.needText')); textEl.focus(); return; }
    playText(t, $('#loopBtn').getAttribute('aria-pressed') === 'true');
  });

  $('#loopBtn').addEventListener('click', () => {
    const on = $('#loopBtn').getAttribute('aria-pressed') !== 'true';
    $('#loopBtn').setAttribute('aria-pressed', on ? 'true' : 'false');
    P.loop = on;
    if (on && !P.playing) {
      const t = textEl.value.trim();
      if (t) playText(t, true);
    }
    toast(on ? T('toast.loopOn') : T('toast.loopOff'));
  });

  $('#copyBtn').addEventListener('click', () => {
    const t = textEl.value.trim();
    if (!t) return;
    const done = () => toast(T('toast.copied'));
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(done).catch(() => fallbackCopy(t, done));
    } else fallbackCopy(t, done);
  });
  function fallbackCopy(t, done) {
    const ta = document.createElement('textarea');
    ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { toast(T('toast.copyBlocked')); }
    ta.remove();
  }

  /* ── 토스트 ─────────────────────────────────────── */
  let toastT = 0;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove('on'), 1900);
  }

  /* ── 별 배경 ────────────────────────────────────── */
  function stars() {
    const box = $('#stars');
    if (!box) return;
    const n = 58;
    let html = '';
    for (let i = 0; i < n; i++) {
      const s = (Math.random() * 1.7 + 0.6).toFixed(1);
      html += `<i style="left:${(Math.random() * 100).toFixed(2)}%;top:${(Math.random() * 100).toFixed(2)}%;width:${s}px;height:${s}px;opacity:${(Math.random() * 0.5 + 0.3).toFixed(2)};animation-delay:${(Math.random() * 4).toFixed(2)}s"></i>`;
    }
    box.innerHTML = html;
  }

  /* ── 오프라인 ───────────────────────────────────── */
  let SW_STATE = 'pending';
  function swPaint() {
    const el = $('#swNote');
    if (el) el.textContent = T('sw.' + SW_STATE);
  }
  function swSetup() {
    if (!('serviceWorker' in navigator)) {
      SW_STATE = 'nosupport'; swPaint();
      return;
    }
    navigator.serviceWorker.register('sw.js').then(() => {
      SW_STATE = 'ok'; swPaint();
    }).catch(() => {
      SW_STATE = 'fail'; swPaint();
    });
  }

  /* ── 언어가 바뀌면 이 화면을 새 언어로 다시 그린다 ───── */
  function relang() {
    syncControlUI();
    buildChart();
    renderKey();
    renderStats();
    swPaint();
    if (!P.playing) renderRibbon(Array.from(state.text.toUpperCase()));
    $('#playLab').textContent = P.playing ? T('send.stop') : T('send.play');
    if (Q.cur) {
      $('#qAsk').textContent = T(Q.cur.ask);
      $$('.q-choice').forEach(b => {
        const sub = b.querySelector('.qc-sub');
        if (!sub) return;
        const src = ABBR_KO[b.dataset.v];
        sub.textContent = src ? T(src).split('—')[0].trim() : '';
      });
      const inp = $('#qInp');
      if (inp) {
        inp.setAttribute('placeholder', T(Q.cur.kind === 'qso' ? 'quiz.phCall' : (Q.cur.kind === 'group' ? 'quiz.phGroup' : 'quiz.phCode')));
      }
      if (Q.answered) renderFb();
    }
  }
  document.addEventListener('langchange', relang);

  /* ── 시작 ───────────────────────────────────────── */
  function init() {
    stars();
    loadPrefs();
    loadStats();

    Q.mode = state.quizMode || 'alnum';
    Q.choice = state.choice !== false;
    $$('#qModes button').forEach(b => b.classList.toggle('on', b.dataset.qm === Q.mode));
    $('#qChoice').checked = Q.choice;
    $('#qOptsNote').textContent = Q.choice ? T('quiz.offNote') : T('quiz.onNote');

    if (state.keyMode !== 'straight' && state.keyMode !== 'iambic') state.keyMode = 'straight';
    $$('#keyMode button').forEach(b => b.classList.toggle('on', b.dataset.km === state.keyMode));
    $('#keyStraight').hidden = state.keyMode !== 'straight';
    $('#keyIambic').hidden = state.keyMode !== 'iambic';

    syncControlUI();
    $('#playLab').textContent = T('send.play');
    buildChart();
    renderKey();
    renderRibbon(Array.from(state.text.toUpperCase()));
    renderStats();
    setTab(state.tab || 'send');
    setQrn(state.qrn);

    requestAnimationFrame(drawScope);
    swPaint();
    swSetup();

    // 첫 터치에 오디오 엔진 준비 (iOS Safari 정책)
    const unlock = () => { audioInit(); };
    document.addEventListener('pointerdown', unlock, { capture: true, passive: true });
    document.addEventListener('keydown', unlock, { capture: true });
  }

  init();
})();
