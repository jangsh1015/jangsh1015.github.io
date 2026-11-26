/* ── 5개국어 전환 (한국어 · English · 日本語 · 中文 · Русский) ──────────────
   · 외부 번역 서비스(구글 번역 위젯)를 쓰지 않고, 페이지 안에 담아 둔
     번역문(assets/i18n-*.js)만으로 전환한다.
   · 한국어 원문은 HTML에 그대로 두고, 처음 불릴 때 읽어서 보관했다가
     한국어로 되돌릴 때 되쓴다. (원문을 복제하지 않으므로 어긋날 일이 없다)
   · 선택한 언어는 localStorage 에 저장하고, 주소에 ?lang=en 처럼 붙여도 된다.
   ───────────────────────────────────────────────────────────────────── */
(function () {
  var LANGS = ['ko', 'en', 'ja', 'zh', 'ru'];
  var CODE = { ko: 'KO', en: 'EN', ja: 'JA', zh: 'ZH', ru: 'RU' };
  var HTMLLANG = { ko: 'ko', en: 'en', ja: 'ja', zh: 'zh-Hans', ru: 'ru' };
  var LOCALE = { ko: 'ko-KR', en: 'en-US', ja: 'ja-JP', zh: 'zh-CN', ru: 'ru-RU' };
  var ARIA_SUFFIX = {
    ko: ' 사진 크게 보기', en: ' — view photo', ja: ' 写真を大きく見る',
    zh: ' 查看大图', ru: ' — открыть фото'
  };
  var STORE = 'sh_lang5';
  var data = window.__i18nData || {};
  var lang = 'ko';

  /* JS가 직접 쓰는 문구의 한국어 기본값 (HTML에 없는 것) */
  var JSKO = {
    'letters.more': '지난 글 더 보기',
    'letters.less': '접기',
    'letters.moreCount': '({n}편)',
    'vstats.loading': '불러오는 중…',
    'vstats.error': '방문 기록을 불러오지 못했습니다.',
    'vstats.updated': '마지막 기록 {time}',
    'vstats.recent': '최근 7일',
    'vstats.hits': '{date} · {n}회'
  };

  /* 한국어 원문 보관 */
  var ko = { html: {}, aria: {}, card: {} };
  var koTitle = document.title;

  function capture() {
    var i, el, k;
    var nodes = document.querySelectorAll('[data-i18n]');
    for (i = 0; i < nodes.length; i++) {
      el = nodes[i];
      k = el.getAttribute('data-i18n');
      if (!(k in ko.html)) ko.html[k] = el.innerHTML;
    }
    nodes = document.querySelectorAll('[data-i18n-aria]');
    for (i = 0; i < nodes.length; i++) {
      el = nodes[i];
      k = el.getAttribute('data-i18n-aria');
      if (!(k in ko.aria)) ko.aria[k] = el.getAttribute('aria-label') || '';
    }
    nodes = document.querySelectorAll('[data-i18n-card]');
    for (i = 0; i < nodes.length; i++) {
      el = nodes[i];
      var n = el.getAttribute('data-i18n-card');
      var tEl = el.querySelector('.gallery-title');
      var dEl = el.querySelector('.gallery-desc');
      var dtEl = el.querySelector('.gallery-date');
      ko.card[n] = {
        title: el.getAttribute('data-title') || '',
        cap: el.getAttribute('data-caption') || '',
        aria: el.getAttribute('aria-label') || '',
        titleText: tEl ? tEl.textContent : '',
        descText: dEl ? dEl.textContent : '',
        date: dtEl ? dtEl.textContent : ''
      };
    }
  }

  function tr(key) {
    if (lang !== 'ko' && data[lang] && typeof data[lang][key] === 'string') return data[lang][key];
    return null;
  }

  /* 다른 스크립트에서 쓰는 번역 함수 */
  function t(key) {
    var v = tr(key);
    if (v != null) return v;
    if (key in JSKO) return JSKO[key];
    if (ko.html[key] != null) return ko.html[key].replace(/<[^>]*>/g, '');
    if (ko.aria[key] != null) return ko.aria[key];
    return key;
  }

  function applyLang(next) {
    if (LANGS.indexOf(next) < 0) next = 'ko';
    lang = next;

    var i, el, k, v;
    var nodes = document.querySelectorAll('[data-i18n]');
    for (i = 0; i < nodes.length; i++) {
      el = nodes[i];
      k = el.getAttribute('data-i18n');
      v = tr(k);
      el.innerHTML = (v == null) ? ko.html[k] : v;
    }
    nodes = document.querySelectorAll('[data-i18n-aria]');
    for (i = 0; i < nodes.length; i++) {
      el = nodes[i];
      k = el.getAttribute('data-i18n-aria');
      v = tr(k);
      el.setAttribute('aria-label', (v == null) ? ko.aria[k] : v);
    }
    nodes = document.querySelectorAll('[data-i18n-card]');
    for (i = 0; i < nodes.length; i++) {
      el = nodes[i];
      var n = el.getAttribute('data-i18n-card');
      var c = ko.card[n] || {};
      var title = tr('gal.' + n + '.title');
      var cap = tr('gal.' + n + '.cap');
      var date = tr('gal.' + n + '.date');
      var aria = tr('gal.' + n + '.aria');
      var tEl = el.querySelector('.gallery-title');
      var dEl = el.querySelector('.gallery-desc');
      var dtEl = el.querySelector('.gallery-date');
      if (tEl) tEl.textContent = (title == null) ? c.titleText : title;
      if (dEl) dEl.textContent = (cap == null) ? c.descText : cap;
      if (dtEl && (date != null || c.date)) dtEl.textContent = (date == null) ? c.date : date;
      el.setAttribute('data-title', (title == null) ? c.title : title);
      el.setAttribute('data-caption', (cap == null) ? c.cap : cap);
      el.setAttribute('aria-label', (aria == null) ? c.aria : ((title == null) ? c.titleText : title) + ARIA_SUFFIX[lang]);
    }

    document.documentElement.lang = HTMLLANG[lang] || 'ko';
    document.title = (lang === 'ko' || !tr('meta.title')) ? koTitle : tr('meta.title');

    var code = document.getElementById('lang-code');
    if (code) code.textContent = CODE[lang];

    var opts = document.querySelectorAll('#lang-menu button[data-lang]');
    for (i = 0; i < opts.length; i++) {
      opts[i].setAttribute('aria-selected', opts[i].getAttribute('data-lang') === lang ? 'true' : 'false');
    }

    try { localStorage.setItem(STORE, lang); } catch (e) { /* 저장이 막혀도 전환은 한다 */ }

    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
  }

  /* ── 버튼·메뉴 ─────────────────────────────────────────── */
  function initUI() {
    var btn = document.getElementById('lang-btn');
    var menu = document.getElementById('lang-menu');
    if (!btn || !menu) return;
    var wrap = document.getElementById('lang');

    function open() {
      menu.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      var sel = menu.querySelector('button[aria-selected="true"]') || menu.querySelector('button');
      if (sel) sel.focus();
    }
    function close(focusBtn) {
      menu.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      if (focusBtn) btn.focus();
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (menu.hidden) open(); else close(false);
    });
    menu.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('button[data-lang]') : null;
      if (!b) return;
      applyLang(b.getAttribute('data-lang'));
      close(true);
    });
    document.addEventListener('click', function (e) {
      if (!menu.hidden && wrap && !wrap.contains(e.target)) close(false);
    });
    document.addEventListener('keydown', function (e) {
      if (menu.hidden) return;
      if (e.key === 'Escape') { close(true); }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        var items = Array.prototype.slice.call(menu.querySelectorAll('button'));
        var at = items.indexOf(document.activeElement);
        if (at < 0) at = 0;
        var to = e.key === 'ArrowDown' ? (at + 1) % items.length : (at - 1 + items.length) % items.length;
        items[to].focus();
        e.preventDefault();
      }
    });
  }

  /* ── 시작 ─────────────────────────────────────────────── */
  function detect() {
    var n = (navigator.language || 'ko').toLowerCase();
    if (n.indexOf('ko') === 0) return 'ko';
    if (n.indexOf('ja') === 0) return 'ja';
    if (n.indexOf('zh') === 0) return 'zh';
    if (n.indexOf('ru') === 0) return 'ru';
    if (n.indexOf('en') === 0) return 'en';
    return 'ko';
  }

  var stored = null;
  try { stored = localStorage.getItem(STORE); } catch (e) { stored = null; }
  var forced = (location.search.match(/[?&]lang=(ko|en|ja|zh|ru)\b/) || [])[1] || null;
  var start = forced || (LANGS.indexOf(stored) >= 0 ? stored : detect());

  capture();
  initUI();

  window.Lang5 = {
    get: function () { return lang; },
    set: applyLang,
    t: t,
    locale: function () { return LOCALE[lang] || 'ko-KR'; }
  };

  applyLang(start);
})();
