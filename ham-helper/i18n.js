/* ── 5개국어 전환 (한국어 · English · 日本語 · 中文 · Русский) ─────────────
   · 홈페이지(assets/i18n.js)와 같은 저장 키 `sh_lang5` 를 쓴다.
     홈페이지에서 언어를 고르고 이 앱으로 들어오면 그 언어로 바로 열린다.
   · 한국어 원문은 HTML 에 그대로 두고, 처음에 읽어 보관했다가 한국어로 되돌릴 때 되쓴다.
   · 주소에 ?lang=en 처럼 붙여도 되고, 저장값이 없으면 브라우저 언어를 살핀다.
   · 번역문은 이 파일 옆의 i18n-data.js (window.__I18N) 에 담겨 있다.
   ───────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var LANGS = ['ko', 'en', 'ja', 'zh', 'ru'];
  var CODE = { ko: 'KO', en: 'EN', ja: 'JA', zh: 'ZH', ru: 'RU' };
  var HTMLLANG = { ko: 'ko', en: 'en', ja: 'ja', zh: 'zh-Hans', ru: 'ru' };
  var LOCALE = { ko: 'ko-KR', en: 'en-US', ja: 'ja-JP', zh: 'zh-CN', ru: 'ru-RU' };
  var STORE = 'sh_lang5';

  var data = window.__I18N || {};
  var lang = 'ko';
  var ko = { html: {}, aria: {}, ph: {}, alt: {}, title: {} };
  var koTitle = document.title;
  var titleVars = {};

  /* ── 한국어 원문 보관 ─────────────────────────────── */
  function capture() {
    var i, el, k;
    var nodes = document.querySelectorAll('[data-i18n]');
    for (i = 0; i < nodes.length; i++) {
      el = nodes[i]; k = el.getAttribute('data-i18n');
      if (!(k in ko.html)) ko.html[k] = el.innerHTML;
    }
    nodes = document.querySelectorAll('[data-i18n-aria]');
    for (i = 0; i < nodes.length; i++) {
      el = nodes[i]; k = el.getAttribute('data-i18n-aria');
      if (!(k in ko.aria)) ko.aria[k] = el.getAttribute('aria-label') || '';
    }
    nodes = document.querySelectorAll('[data-i18n-ph]');
    for (i = 0; i < nodes.length; i++) {
      el = nodes[i]; k = el.getAttribute('data-i18n-ph');
      if (!(k in ko.ph)) ko.ph[k] = el.getAttribute('placeholder') || '';
    }
    nodes = document.querySelectorAll('[data-i18n-alt]');
    for (i = 0; i < nodes.length; i++) {
      el = nodes[i]; k = el.getAttribute('data-i18n-alt');
      if (!(k in ko.alt)) ko.alt[k] = el.getAttribute('alt') || '';
    }
    nodes = document.querySelectorAll('[data-i18n-title]');
    for (i = 0; i < nodes.length; i++) {
      el = nodes[i]; k = el.getAttribute('data-i18n-title');
      if (!(k in ko.title)) ko.title[k] = el.getAttribute('title') || '';
    }
  }

  function tr(key) {
    if (data[lang] && typeof data[lang][key] === 'string') return data[lang][key];
    return null;
  }

  function fmt(s, vars) {
    if (!vars) return s;
    return String(s).replace(/\{(\w+)\}/g, function (m, k) {
      return (vars && Object.prototype.hasOwnProperty.call(vars, k)) ? vars[k] : m;
    });
  }

  /* 번역문(없으면 한국어 원문) */
  function t(key, vars) {
    var v = tr(key);
    if (v == null) v = (key in ko.html) ? ko.html[key] : (key in ko.aria ? ko.aria[key] : key);
    return fmt(v, vars);
  }

  /* 태그를 뺀 평문 (textContent·toast·캔버스용) */
  function tt(key, vars) {
    return fmt(String(t(key)).replace(/<[^>]*>/g, ''), vars);
  }

  function applyTitle() {
    var title = tr('meta.title') || koTitle;
    document.title = fmt(title, titleVars);
  }

  /* ── 적용 ─────────────────────────────────────────── */
  function applyLang(next) {
    if (LANGS.indexOf(next) < 0) next = 'ko';
    lang = next;

    var i, el, k, v;
    var nodes = document.querySelectorAll('[data-i18n]');
    for (i = 0; i < nodes.length; i++) {
      el = nodes[i]; k = el.getAttribute('data-i18n');
      v = tr(k);
      el.innerHTML = (v == null) ? (ko.html[k] != null ? ko.html[k] : el.innerHTML) : v;
    }
    nodes = document.querySelectorAll('[data-i18n-aria]');
    for (i = 0; i < nodes.length; i++) {
      el = nodes[i]; k = el.getAttribute('data-i18n-aria');
      v = tr(k);
      el.setAttribute('aria-label', (v == null) ? (ko.aria[k] || '') : v);
    }
    nodes = document.querySelectorAll('[data-i18n-ph]');
    for (i = 0; i < nodes.length; i++) {
      el = nodes[i]; k = el.getAttribute('data-i18n-ph');
      v = tr(k);
      el.setAttribute('placeholder', (v == null) ? (ko.ph[k] || '') : v);
    }
    nodes = document.querySelectorAll('[data-i18n-alt]');
    for (i = 0; i < nodes.length; i++) {
      el = nodes[i]; k = el.getAttribute('data-i18n-alt');
      v = tr(k);
      el.setAttribute('alt', (v == null) ? (ko.alt[k] || '') : v);
    }
    nodes = document.querySelectorAll('[data-i18n-title]');
    for (i = 0; i < nodes.length; i++) {
      el = nodes[i]; k = el.getAttribute('data-i18n-title');
      v = tr(k);
      el.setAttribute('title', (v == null) ? (ko.title[k] || '') : v);
    }

    document.documentElement.lang = HTMLLANG[lang] || 'ko';
    applyTitle();

    var code = document.getElementById('lang-code');
    if (code) code.textContent = CODE[lang];

    var opts = document.querySelectorAll('#lang-menu button[data-lang]');
    for (i = 0; i < opts.length; i++) {
      opts[i].setAttribute('aria-selected', opts[i].getAttribute('data-lang') === lang ? 'true' : 'false');
    }

    try { localStorage.setItem(STORE, lang); } catch (e) { /* 저장이 막혀도 전환은 한다 */ }

    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
  }

  /* ── 버튼·메뉴 ─────────────────────────────────────── */
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

  /* ── 시작 ─────────────────────────────────────────── */
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
    text: tt,
    code: function () { return CODE[lang] || 'KO'; },
    locale: function () { return LOCALE[lang] || 'ko-KR'; },
    dirs: function () { return tt('dirs').split('|'); },
    setTitleVars: function (vars) { titleVars = vars || {}; applyTitle(); },
    title: applyTitle
  };

  applyLang(start);
})();
