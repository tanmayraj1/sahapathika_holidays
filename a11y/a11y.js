/*
 * Sahapathika Holidays — accessibility toolbar.
 *
 * Self-hosted, no dependencies. Loaded (not deferred) in <head> on every page,
 * right after support.js, so saved settings are applied before first paint.
 *
 *   - Settings live in localStorage under KEY and are reapplied on every page.
 *   - Each setting is a class on <html>; the look is defined in a11y.css.
 *   - The UI (#a11y-ui) is appended to <html>, outside <body>, so the page's
 *     React re-renders never touch it and page-level overrides never restyle it.
 *   - Shortcut: Alt+A opens / closes the panel.
 *
 * Exposes window.SHA11y = { trapFocus, announce, open, close } for page fixes.
 */
(function () {
  'use strict';

  var KEY = 'sh-a11y-v1';
  var HIDE_KEY = 'sh-a11y-hidden';
  var STATEMENT_URL = 'accessibility.html'; /* accessibility statement, linked from the panel footer */
  var ATKINSON_CSS = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&display=swap';

  var root = document.documentElement;

  /* ───────────── State ───────────── */

  var DEFAULTS = {
    contrast: 0, saturation: 0, text: 0, spacing: 0, lineHeight: 0, align: 0, cursor: 0,
    links: false, hideImages: false, pause: false, readable: false, dyslexia: false,
    guide: false, mask: false, labels: false, focus: false, clickRead: false,
    profiles: [], side: 'left'
  };

  var LEVELS = {
    contrast: ['Dark contrast', 'Light contrast', 'High contrast', 'Invert colours'],
    saturation: ['Low saturation', 'Greyscale', 'High saturation'],
    text: ['110%', '125%', '150%'],
    spacing: ['Light', 'Medium', 'Wide'],
    lineHeight: ['1.5×', '1.8×', '2×'],
    align: ['Left', 'Centre', 'Right'],
    cursor: ['Black', 'White']
  };

  function copyDefaults() {
    var s = {};
    for (var k in DEFAULTS) s[k] = Array.isArray(DEFAULTS[k]) ? DEFAULTS[k].slice() : DEFAULTS[k];
    return s;
  }

  function load() {
    var s = copyDefaults();
    try {
      var saved = JSON.parse(localStorage.getItem(KEY) || '{}');
      for (var k in DEFAULTS) {
        if (!(k in saved)) continue;
        var d = DEFAULTS[k], v = saved[k];
        if (Array.isArray(d) ? Array.isArray(v) : typeof v === typeof d) s[k] = v;
      }
      for (var lk in LEVELS) if (s[lk] < 0 || s[lk] > LEVELS[lk].length) s[lk] = 0;
    } catch (e) { /* private mode, blocked storage or bad JSON: use defaults */ }
    return s;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* not fatal */ }
  }

  var state = load();

  /* ───────────── Apply settings to the page ───────────── */

  function filterValue() {
    var f = [];
    if (state.contrast === 3) f.push('contrast(1.5)');
    if (state.contrast === 4) f.push('invert(1) hue-rotate(180deg)');
    if (state.saturation === 1) f.push('saturate(.5)');
    if (state.saturation === 2) f.push('grayscale(1)');
    if (state.saturation === 3) f.push('saturate(2)');
    return f.join(' ');
  }

  function applyClasses() {
    var keep = [];
    root.className.split(/\s+/).forEach(function (c) { if (c && c.indexOf('a11y-') !== 0) keep.push(c); });
    for (var k in DEFAULTS) {
      var v = state[k];
      if (k === 'profiles' || k === 'side') continue;
      if (v === true) keep.push('a11y-' + k);
      else if (typeof v === 'number' && v > 0) keep.push('a11y-' + k + '-' + v);
    }
    var f = filterValue();
    if (f) { keep.push('a11y-filtered'); root.style.setProperty('--a11y-filter', f); }
    else root.style.removeProperty('--a11y-filter');
    root.className = keep.join(' ');
    window.__a11yReduceMotion = !!state.pause;
    if (state.readable) loadReadableFont();
  }

  function loadReadableFont() {
    if (document.getElementById('a11y-font-atkinson') || !document.head) return;
    var l = document.createElement('link');
    l.id = 'a11y-font-atkinson'; l.rel = 'stylesheet'; l.href = ATKINSON_CSS;
    document.head.appendChild(l);
  }

  /* Runs now, in <head>, before the page paints */
  applyClasses();

  /* ───────────── Small helpers ───────────── */

  function isShown(el) {
    if (!el || !el.getClientRects().length) return false;
    var cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none';
  }

  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

  function focusables(container) {
    return Array.prototype.filter.call(container.querySelectorAll(FOCUSABLE), function (el) {
      return !el.closest('[hidden]') && el.getClientRects().length > 0;
    });
  }

  /* Keep Tab inside `container`. Returns release(), which returns focus to `returnTo`. */
  function trapFocus(container, returnTo) {
    function onKey(e) {
      if (e.key !== 'Tab') return;
      var f = focusables(container);
      if (!f.length) { e.preventDefault(); return; }
      var first = f[0], last = f[f.length - 1], a = document.activeElement;
      var inside = container.contains(a);
      if (e.shiftKey && (a === first || !inside)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (a === last || !inside)) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', onKey, true);
    return function release(focusBack) {
      document.removeEventListener('keydown', onKey, true);
      if (focusBack !== false && returnTo && document.contains(returnTo) && returnTo.focus) returnTo.focus();
    };
  }

  var liveEl = null;
  function announce(msg) {
    if (!liveEl) return;
    liveEl.textContent = '';
    setTimeout(function () { liveEl.textContent = msg; }, 60);
  }

  function nameOf(el) {
    var t = el.getAttribute('aria-label') || el.getAttribute('alt') || '';
    if (!t && el.getAttribute('aria-labelledby')) {
      var lb = document.getElementById(el.getAttribute('aria-labelledby'));
      if (lb) t = lb.textContent;
    }
    if (!t && el.labels && el.labels[0]) t = el.labels[0].textContent;
    if (!t) t = el.innerText || el.value || el.getAttribute('placeholder') || el.getAttribute('title') || '';
    return String(t).replace(/\s+/g, ' ').trim();
  }

  function roleOf(el) {
    var r = el.getAttribute('role');
    if (r) return r;
    var t = el.tagName;
    if (t === 'A') return 'link';
    if (t === 'BUTTON') return 'button';
    if (t === 'SELECT') return 'list box';
    if (t === 'TEXTAREA') return 'text area';
    if (t === 'INPUT') return ({ checkbox: 'checkbox', radio: 'radio button', submit: 'button', button: 'button' })[el.type] || 'text field';
    if (/^H[1-6]$/.test(t)) return 'heading level ' + t[1];
    return '';
  }

  /* ───────────── Icons ───────────── */

  function svg(inner, extra) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"' + (extra || '') + '>' + inner + '</svg>';
  }
  function p(d) { return '<path d="' + d + '"/>'; }

  var ICONS = {
    access: '<circle cx="12" cy="12" r="10.2"/><circle cx="12" cy="6.6" r="1.6" fill="currentColor" stroke="none"/>' + p('M6.5 9.6 12 10.8l5.5-1.2M12 10.8v4.2M12 15l-2.6 4.4M12 15l2.6 4.4'),
    close: p('M6 6l12 12M18 6 6 18'),
    back: p('M15 5l-7 7 7 7'),
    contrast: '<circle cx="12" cy="12" r="9"/>' + '<path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
    text: p('M3 18 8 6l5 12M4.8 14h6.4M15 18l3-7.5 3 7.5M16 15.6h4'),
    saturation: p('M12 3s6.5 6.6 6.5 11.2a6.5 6.5 0 0 1-13 0C5.5 9.6 12 3 12 3z') + p('M8.5 14.5a3.5 3.5 0 0 0 3.5 3.5'),
    links: p('M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'),
    cursor: p('M6 3v15l4-4 3 7 3-1.4-3-6.8h5.6z'),
    hideImages: '<rect x="3" y="5" width="18" height="14" rx="2"/>' + p('M3 16l5-5 4 4 3-3 6 6M2 2l20 20'),
    pause: '<circle cx="12" cy="12" r="9"/>' + p('M10 9v6M14 9v6'),
    readable: '<text x="12" y="16.5" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor" stroke="none" font-family="Verdana,sans-serif">Aa</text>',
    dyslexia: p('M4 5h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h6z'),
    spacing: p('M3 12h18M6.5 8.5 3 12l3.5 3.5M17.5 8.5 21 12l-3.5 3.5'),
    lineHeight: p('M11 6h10M11 12h10M11 18h10M5 4v16M3 6l2-2 2 2M3 18l2 2 2-2'),
    align: p('M4 6h16M4 10h10M4 14h16M4 18h10'),
    guide: '<rect x="2.5" y="10" width="19" height="4" rx="1" fill="currentColor"/>' + p('M4 5h16M4 19h16'),
    mask: '<rect x="2.5" y="3" width="19" height="5" rx="1" fill="currentColor" opacity=".55"/><rect x="2.5" y="16" width="19" height="5" rx="1" fill="currentColor" opacity=".55"/>' + p('M4 12h16'),
    labels: p('M4 5h16v10H10l-5 4v-4H4z') + p('M8 9h8M8 12h5'),
    structure: p('M4 6h3M4 12h3M4 18h3M10 6h10M10 12h10M10 18h10'),
    focus: p('M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4') + '<circle cx="12" cy="12" r="3"/>',
    readPage: p('M4 9v6h4l5 4V5L8 9zM16.5 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11'),
    clickRead: p('M7 3v11l3-2.2 2.2 5.2 2.2-1-2.2-5.1H16z') + p('M17.5 5a4 4 0 0 1 0 6'),
    blind: p('M3 3l18 18M10.6 6.1A9.6 9.6 0 0 1 12 6c5.5 0 9 6 9 6a16 16 0 0 1-3.3 3.8M6.6 6.6C4.2 8.2 3 12 3 12s3.5 6 9 6a9 9 0 0 0 4.3-1.1M9.9 9.9a3 3 0 0 0 4.2 4.2'),
    vision: p('M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z') + '<circle cx="12" cy="12" r="3"/>',
    colour: '<circle cx="12" cy="12" r="9"/><circle cx="8" cy="10" r="1.3" fill="currentColor"/><circle cx="12" cy="7.5" r="1.3" fill="currentColor"/><circle cx="16" cy="10" r="1.3" fill="currentColor"/>' + p('M12 21a2.5 2.5 0 0 1 0-5h1.5'),
    seizure: p('M13 2 4 14h7l-1 8 9-12h-7z'),
    adhd: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
    cognitive: p('M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z'),
    motor: '<rect x="2.5" y="6.5" width="19" height="11" rx="2"/>' + p('M6.5 10.5h.01M10 10.5h.01M14 10.5h.01M17.5 10.5h.01M8 14h8'),
    play: '<path d="M7 5l12 7-12 7z" fill="currentColor"/>',
    pauseSmall: '<rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" stroke="none"/>',
    prev: p('M18 6l-8 6 8 6zM6 6v12'),
    next: p('M6 6l8 6-8 6zM18 6v12')
  };

  /* ───────────── Panel content ───────────── */

  var PROFILES = [
    { id: 'blind', label: 'Blind', preset: { clickRead: true, links: true, focus: true } },
    { id: 'vision', label: 'Visually impaired', preset: { text: 2, readable: true, links: true, cursor: 1 } },
    { id: 'colour', label: 'Colour blind', preset: { saturation: 3, links: true } },
    { id: 'dyslexia', label: 'Dyslexia', preset: { dyslexia: true, spacing: 2, lineHeight: 2, guide: true } },
    { id: 'seizure', label: 'Seizure safe', preset: { pause: true, saturation: 1 } },
    { id: 'adhd', label: 'ADHD friendly', preset: { mask: true, pause: true } },
    { id: 'cognitive', label: 'Cognitive & learning', preset: { readable: true, lineHeight: 2, links: true, pause: true } },
    { id: 'motor', label: 'Motor & keyboard', preset: { focus: true, cursor: 1 } }
  ];

  var SECTIONS = [
    { title: 'Read aloud', note: 'Uses your device’s own voices. If you already use a screen reader, keep using it — this is for reading support.', tiles: [
      { key: 'readPage', label: 'Read page', action: true },
      { key: 'clickRead', label: 'Click to read' }
    ] },
    { title: 'Vision', tiles: [
      { key: 'contrast', label: 'Contrast' },
      { key: 'text', label: 'Bigger text' },
      { key: 'saturation', label: 'Saturation' },
      { key: 'links', label: 'Highlight links' },
      { key: 'cursor', label: 'Big cursor' },
      { key: 'hideImages', label: 'Hide images' },
      { key: 'pause', label: 'Pause animations' }
    ] },
    { title: 'Reading', tiles: [
      { key: 'readable', label: 'Readable font' },
      { key: 'dyslexia', label: 'Dyslexia font' },
      { key: 'spacing', label: 'Text spacing' },
      { key: 'lineHeight', label: 'Line height' },
      { key: 'align', label: 'Text align' },
      { key: 'guide', label: 'Reading guide' },
      { key: 'mask', label: 'Reading mask' }
    ] },
    { title: 'Navigation', tiles: [
      { key: 'structure', label: 'Page structure', action: true },
      { key: 'focus', label: 'Strong focus' },
      { key: 'labels', label: 'Show labels' }
    ] }
  ];

  var TILE_LABEL = {};
  SECTIONS.forEach(function (s) { s.tiles.forEach(function (t) { TILE_LABEL[t.key] = t.label; }); });

  /* ───────────── Build the UI ───────────── */

  var ui, launcher, panel, backdrop, mainView, structView, player, guide, maskTop, maskBottom, tip;
  var release = null;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function tileHTML(t) {
    var n = LEVELS[t.key] ? LEVELS[t.key].length : 0;
    var dots = '';
    if (n) { dots = '<span class="a11y-dots" aria-hidden="true">'; for (var i = 0; i < n; i++) dots += '<i></i>'; dots += '</span>'; }
    return '<button type="button" class="a11y-tile" data-key="' + t.key + '"' + (t.action && t.key === 'structure' ? '' : ' aria-pressed="false"') + '>' +
      svg(ICONS[t.key] || '') +
      '<span class="a11y-tile-name">' + esc(t.label) + '</span>' +
      (n ? '<span class="a11y-tile-level" aria-hidden="true"></span>' : '') + dots + '</button>';
  }

  function build() {
    ui = document.createElement('div');
    ui.id = 'a11y-ui';
    var sections = SECTIONS.map(function (s) {
      /* role=group divs, not <section>: motion.js animates every <section> on the page */
      return '<div class="a11y-section" role="group" aria-labelledby="a11y-h-' + s.title.replace(/\W/g, '') + '">' +
        '<h3 id="a11y-h-' + s.title.replace(/\W/g, '') + '">' + esc(s.title) + '</h3>' +
        (s.note ? '<p class="a11y-note">' + esc(s.note) + '</p>' : '') +
        '<div class="a11y-tiles">' + s.tiles.map(tileHTML).join('') + '</div></div>';
    }).join('');
    var profiles = PROFILES.map(function (pr) {
      return '<button type="button" class="a11y-profile" data-profile="' + pr.id + '" aria-pressed="false">' + svg(ICONS[pr.id]) + '<span>' + esc(pr.label) + '</span></button>';
    }).join('');

    ui.innerHTML =
      '<button type="button" id="a11y-launch" aria-label="Accessibility options" title="Accessibility options (Alt+A)" aria-keyshortcuts="Alt+A" aria-haspopup="dialog" aria-expanded="false" aria-controls="a11y-panel">' + svg(ICONS.access, ' stroke-width="1.6"') + '</button>' +
      '<button type="button" id="a11y-restore" aria-label="Show the accessibility button" title="Show the accessibility button">' + svg(ICONS.access, ' stroke-width="1.8"') + '</button>' +
      '<div id="a11y-backdrop" hidden></div>' +
      '<div id="a11y-panel" role="dialog" aria-modal="true" aria-labelledby="a11y-title" aria-describedby="a11y-desc" tabindex="-1" hidden>' +
        '<div class="a11y-head"><div class="a11y-head-text"><h2 id="a11y-title">Accessibility</h2><p id="a11y-desc">Adjust this site to suit how you see, read and browse. Shortcut: Alt+A.</p></div>' +
        '<button type="button" class="a11y-icon-btn" data-act="close" aria-label="Close accessibility options">' + svg(ICONS.close) + '</button></div>' +
        '<div class="a11y-body" id="a11y-main-view">' +
          '<div class="a11y-section" role="group" aria-labelledby="a11y-h-profiles"><h3 id="a11y-h-profiles">Profiles</h3>' +
          '<p class="a11y-note">One tap turns on a set of adjustments. You can fine-tune any of them below.</p>' +
          '<div class="a11y-profiles">' + profiles + '</div></div>' + sections +
        '</div>' +
        '<div class="a11y-body" id="a11y-struct-view" hidden>' +
          '<button type="button" class="a11y-btn" data-act="back" style="margin-top:14px;width:100%">' + svg(ICONS.back, ' style="width:16px;height:16px;vertical-align:-3px;margin-right:6px"') + 'Back to all options</button>' +
          '<div class="a11y-tabs" role="group" aria-label="Show"><button type="button" data-list="headings" aria-pressed="true">Headings</button><button type="button" data-list="landmarks" aria-pressed="false">Regions</button><button type="button" data-list="links" aria-pressed="false">Links</button></div>' +
          '<p class="a11y-note" id="a11y-struct-count" aria-live="polite"></p>' +
          '<ul class="a11y-list" id="a11y-struct-list"></ul>' +
        '</div>' +
        '<div class="a11y-foot">' +
          '<button type="button" class="a11y-btn a11y-btn-primary" data-act="reset">Reset all</button>' +
          '<button type="button" class="a11y-btn" data-act="side"></button>' +
          '<button type="button" class="a11y-btn" data-act="hide">Minimise button</button>' +
          (STATEMENT_URL ? '<a href="' + STATEMENT_URL + '">Accessibility statement</a>' : '') +
        '</div>' +
      '</div>' +
      '<div id="a11y-player" role="region" aria-label="Read aloud controls" hidden>' +
        '<button type="button" data-say="prev" aria-label="Previous paragraph">' + svg(ICONS.prev) + '</button>' +
        '<button type="button" data-say="toggle" aria-label="Pause reading">' + svg(ICONS.pauseSmall) + '</button>' +
        '<button type="button" data-say="next" aria-label="Next paragraph">' + svg(ICONS.next) + '</button>' +
        '<button type="button" data-say="rate" aria-label="Reading speed 1 times">1×</button>' +
        '<span class="a11y-player-label" aria-live="off"></span>' +
        '<button type="button" data-say="stop" aria-label="Stop reading">' + svg(ICONS.stop) + '</button>' +
      '</div>' +
      '<div id="a11y-guide" hidden></div>' +
      '<div id="a11y-mask-top" class="a11y-mask" hidden></div><div id="a11y-mask-bottom" class="a11y-mask" hidden></div>' +
      '<div id="a11y-tip" role="tooltip" hidden></div>' +
      '<div id="a11y-live" class="a11y-sr" aria-live="polite" aria-atomic="true"></div>';

    root.appendChild(ui);
    launcher = ui.querySelector('#a11y-launch');
    panel = ui.querySelector('#a11y-panel');
    backdrop = ui.querySelector('#a11y-backdrop');
    mainView = ui.querySelector('#a11y-main-view');
    structView = ui.querySelector('#a11y-struct-view');
    player = ui.querySelector('#a11y-player');
    guide = ui.querySelector('#a11y-guide');
    maskTop = ui.querySelector('#a11y-mask-top');
    maskBottom = ui.querySelector('#a11y-mask-bottom');
    tip = ui.querySelector('#a11y-tip');
    liveEl = ui.querySelector('#a11y-live');

    try { if (sessionStorage.getItem(HIDE_KEY) === '1') ui.classList.add('a11y-hidden-launch'); } catch (e) { /* ignore */ }

    ui.querySelector('#a11y-restore').addEventListener('click', function () {
      setMinimised(false);
      announce('Accessibility button restored.');
      launcher.focus();
    });
    launcher.addEventListener('click', function () { isOpen() ? close() : open(launcher); });
    backdrop.addEventListener('click', function () { close(); });
    panel.addEventListener('click', onPanelClick);
    player.addEventListener('click', onPlayerClick);
    renderAll();
  }

  /* Minimised launcher: remembered for this visit (sessionStorage), always restorable */
  function setMinimised(on) {
    ui.classList.toggle('a11y-hidden-launch', on);
    try { if (on) sessionStorage.setItem(HIDE_KEY, '1'); else sessionStorage.removeItem(HIDE_KEY); } catch (e) { /* ignore */ }
  }

  /* ───────────── Panel open / close ───────────── */

  function isOpen() { return panel && !panel.hidden; }

  function open(returnTo) {
    if (!panel) return;
    if (!returnTo || !returnTo.focus) returnTo = launcher && isShown(launcher) ? launcher : document.activeElement;
    showMain();
    panel.hidden = false; backdrop.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    release = trapFocus(panel, returnTo);
    panel.focus();
  }

  function close(focusBack) {
    if (!isOpen()) return;
    panel.hidden = true; backdrop.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    if (release) { var r = release; release = null; r(focusBack); }
  }

  function showMain(focusTile) {
    structView.hidden = true; mainView.hidden = false;
    if (focusTile) { var t = mainView.querySelector('[data-key="structure"]'); if (t) t.focus(); }
  }

  /* ───────────── Changing settings ───────────── */

  function describe(key) {
    var v = state[key], label = TILE_LABEL[key] || key;
    if (LEVELS[key]) return v ? label + ': ' + LEVELS[key][v - 1] : label + ' off';
    return label + (v ? ' on' : ' off');
  }

  function setValue(key, value) {
    state[key] = value;
    if (key === 'readable' && value) state.dyslexia = false;
    if (key === 'dyslexia' && value) state.readable = false;
    if (key === 'guide' && value) state.mask = false;
    if (key === 'mask' && value) state.guide = false;
  }

  function onTile(key) {
    if (key === 'readPage') { speech.active ? stopReading() : startReading(); return; }
    if (key === 'structure') { showStructure(); return; }
    if (LEVELS[key]) setValue(key, (state[key] + 1) % (LEVELS[key].length + 1));
    else setValue(key, !state[key]);
    commit();
    announce(describe(key));
  }

  function toggleProfile(id) {
    var pr = PROFILES.filter(function (x) { return x.id === id; })[0];
    if (!pr) return;
    var i = state.profiles.indexOf(id);
    if (i === -1) {
      state.profiles.push(id);
      for (var k in pr.preset) setValue(k, pr.preset[k]);
      announce(pr.label + ' profile on');
    } else {
      state.profiles.splice(i, 1);
      for (var k2 in pr.preset) {
        var stillWanted = state.profiles.some(function (other) {
          var o = PROFILES.filter(function (x) { return x.id === other; })[0];
          return o && k2 in o.preset;
        });
        if (!stillWanted && state[k2] === pr.preset[k2]) state[k2] = DEFAULTS[k2];
      }
      announce(pr.label + ' profile off');
    }
    commit();
  }

  function resetAll() {
    var side = state.side;
    stopReading();
    state = copyDefaults();
    state.side = side;
    commit();
    announce('All accessibility settings reset');
  }

  function commit() {
    applyClasses();
    save();
    renderAll();
    syncBehaviours();
  }

  function renderAll() {
    if (!ui) return;
    ui.classList.toggle('a11y-right', state.side === 'right');
    ui.querySelectorAll('.a11y-tile').forEach(function (b) {
      var key = b.getAttribute('data-key'), label = TILE_LABEL[key];
      if (key === 'structure') return;
      if (key === 'readPage') { b.setAttribute('aria-pressed', speech.active ? 'true' : 'false'); return; }
      var v = state[key], on = !!v;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (LEVELS[key]) {
        var n = LEVELS[key].length;
        b.querySelector('.a11y-tile-level').textContent = v ? LEVELS[key][v - 1] : 'Off';
        b.setAttribute('aria-label', label + (v ? ', ' + LEVELS[key][v - 1] + ', level ' + v + ' of ' + n : ', off'));
        b.querySelectorAll('.a11y-dots i').forEach(function (d, i) { d.classList.toggle('on', i < v); });
      }
    });
    ui.querySelectorAll('.a11y-profile').forEach(function (b) {
      b.setAttribute('aria-pressed', state.profiles.indexOf(b.getAttribute('data-profile')) !== -1 ? 'true' : 'false');
    });
    var side = ui.querySelector('[data-act="side"]');
    if (side) side.textContent = state.side === 'right' ? 'Move button left' : 'Move button right';
  }

  function onPanelClick(e) {
    var t = e.target.closest('button');
    if (!t || !panel.contains(t)) return;
    if (t.hasAttribute('data-key')) { onTile(t.getAttribute('data-key')); return; }
    if (t.hasAttribute('data-profile')) { toggleProfile(t.getAttribute('data-profile')); return; }
    if (t.hasAttribute('data-list')) { renderStructure(t.getAttribute('data-list')); return; }
    var act = t.getAttribute('data-act');
    if (act === 'close') close();
    else if (act === 'reset') resetAll();
    else if (act === 'side') { state.side = state.side === 'right' ? 'left' : 'right'; save(); renderAll(); announce('Accessibility button moved ' + state.side); }
    else if (act === 'hide') {
      /* Minimise, never remove: the button shrinks to a slim edge tab that brings it back
         (a fully hidden button stranded touch users — Alt+A needs a keyboard). */
      setMinimised(true);
      close(false);
      announce('Accessibility button minimised to a small tab at the edge of the screen.');
      var tab = ui.querySelector('#a11y-restore');
      if (tab) tab.focus();
    }
    else if (act === 'back') showMain(true);
  }

  /* ───────────── Page structure ───────────── */

  var structItems = [];

  function showStructure() {
    mainView.hidden = true; structView.hidden = false;
    renderStructure('headings');
    structView.querySelector('[data-act="back"]').focus();
  }

  function inPage(el) { return !ui.contains(el) && !el.closest('[aria-hidden="true"],[hidden]') && isShown(el); }

  function renderStructure(kind) {
    structView.querySelectorAll('[data-list]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-list') === kind ? 'true' : 'false'); });
    var items = [];
    if (kind === 'headings') {
      document.querySelectorAll('body h1, body h2, body h3, body h4, body h5, body h6').forEach(function (h) {
        var text = nameOf(h);
        if (text && inPage(h)) items.push({ el: h, badge: 'H' + h.tagName[1], text: text, indent: (+h.tagName[1] - 1) * 10 });
      });
    } else if (kind === 'landmarks') {
      var names = { HEADER: 'Header', NAV: 'Navigation', MAIN: 'Main content', FOOTER: 'Footer', ASIDE: 'Sidebar', FORM: 'Form' };
      document.querySelectorAll('body header, body nav, body main, body footer, body aside, body [role="region"][aria-label], body section[aria-label], body form[aria-label]').forEach(function (l) {
        if (!inPage(l)) return;
        var label = l.getAttribute('aria-label') || '';
        items.push({ el: l, badge: '', text: (names[l.tagName] || 'Region') + (label ? ' — ' + label : '') });
      });
    } else {
      var seen = {};
      document.querySelectorAll('body a[href]').forEach(function (a) {
        var text = nameOf(a), k = text + '|' + a.getAttribute('href');
        if (!text || seen[k] || !inPage(a)) return;
        seen[k] = 1;
        items.push({ el: a, badge: '', text: text });
      });
    }
    structItems = items;
    var list = structView.querySelector('#a11y-struct-list');
    list.innerHTML = items.map(function (it, i) {
      return '<li><button type="button" data-goto="' + i + '"' + (it.indent ? ' style="padding-left:' + (12 + it.indent) + 'px"' : '') + '>' + (it.badge ? '<b>' + it.badge + '</b>' : '') + '<span>' + esc(it.text.slice(0, 120)) + '</span></button></li>';
    }).join('');
    var label = { headings: 'headings', landmarks: 'regions', links: 'links' }[kind];
    structView.querySelector('#a11y-struct-count').textContent = items.length ? items.length + ' ' + label + ' on this page. Choose one to jump to it.' : 'No ' + label + ' found on this page.';
  }

  function gotoItem(i) {
    var it = structItems[i];
    if (!it) return;
    var el = it.el;
    close(false);
    if (!el.matches(FOCUSABLE)) { el.setAttribute('tabindex', '-1'); el.setAttribute('data-a11y-tabindex', ''); }
    el.scrollIntoView({ block: 'center', behavior: state.pause ? 'auto' : 'smooth' });
    el.focus({ preventScroll: true });
  }

  /* ───────────── Read aloud ───────────── */

  var synth = window.speechSynthesis;
  var hasTTS = !!(synth && window.SpeechSynthesisUtterance);
  var RATES = [0.75, 1, 1.25, 1.5];
  var speech = { active: false, paused: false, blocks: [], i: 0, rateIdx: 1, token: 0, lit: null };

  function pickVoice(lang) {
    if (!hasTTS) return null;
    var vs = synth.getVoices() || [];
    var prefs = lang === 'hi' ? ['hi-in', 'hi'] : ['en-in', 'en-gb', 'en-us', 'en'];
    for (var i = 0; i < prefs.length; i++) {
      for (var j = 0; j < vs.length; j++) if (String(vs[j].lang).replace('_', '-').toLowerCase().indexOf(prefs[i]) === 0) return vs[j];
    }
    return null;
  }
  if (hasTTS && synth.addEventListener) synth.addEventListener('voiceschanged', function () { /* voices load async; picked per utterance */ });

  /* Long utterances get cut off in some browsers, so speak sentence-sized chunks. */
  function chunks(text) {
    var parts = String(text).replace(/\s+/g, ' ').trim().split(/(?<=[.!?।])\s+/);
    var out = [];
    parts.forEach(function (s) {
      while (s.length > 220) { var cut = s.lastIndexOf(' ', 220); if (cut < 80) cut = 220; out.push(s.slice(0, cut)); s = s.slice(cut).trim(); }
      if (s) out.push(s);
    });
    return out;
  }

  function speak(text, done) {
    if (!hasTTS) { announce('Read aloud is not supported in this browser.'); return; }
    var token = ++speech.token;
    synth.cancel();
    var list = chunks(text), k = 0;
    function nextChunk() {
      if (token !== speech.token) return;
      if (k >= list.length) { if (done) done(); return; }
      var part = list[k++];
      var u = new SpeechSynthesisUtterance(part);
      var hi = /[ऀ-ॿ]/.test(part);
      var v = pickVoice(hi ? 'hi' : 'en');
      if (v) u.voice = v;
      u.lang = v ? v.lang : (hi ? 'hi-IN' : 'en-IN');
      u.rate = RATES[speech.rateIdx];
      u.onend = function () { nextChunk(); };
      u.onerror = function (ev) { if (ev && (ev.error === 'interrupted' || ev.error === 'canceled')) return; nextChunk(); };
      synth.speak(u);
    }
    setTimeout(nextChunk, 60); /* Chrome drops an utterance queued right after cancel() */
  }

  var BLOCK_DISPLAY = /^(block|flex|grid|list-item|table|table-cell|table-caption|flow-root|inline-block|inline-flex|inline-grid)$/;

  function collectBlocks(scope) {
    var blocks = [], byEl = new Map(), disp = new Map();
    function display(el) { if (!disp.has(el)) disp.set(el, getComputedStyle(el).display); return disp.get(el); }
    var walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var pe = n.parentElement;
        if (!pe || pe.closest('script,style,noscript,template,x-dc,[aria-hidden="true"],[hidden],#a11y-ui')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var n;
    while ((n = walker.nextNode())) {
      var el = n.parentElement;
      while (el && el !== scope && !BLOCK_DISPLAY.test(display(el))) el = el.parentElement;
      if (!el) continue;
      var rect = el.getBoundingClientRect();
      if (rect.height < 2 || !isShown(el)) continue;
      var b = byEl.get(el);
      if (!b) { b = { el: el, parts: [] }; byEl.set(el, b); blocks.push(b); }
      b.parts.push(n.nodeValue);
    }
    return blocks.map(function (b) { return { el: b.el, text: b.parts.join(' ').replace(/\s+/g, ' ').trim() }; })
      .filter(function (b) { return /[\p{L}\p{N}]/u.test(b.text); });
  }

  function light(el) {
    if (speech.lit) speech.lit.classList.remove('a11y-reading');
    speech.lit = el || null;
    if (el) el.classList.add('a11y-reading');
  }

  function startReading() {
    if (!hasTTS) { announce('Read aloud is not supported in this browser.'); return; }
    var scope = Array.prototype.filter.call(document.querySelectorAll('main'), isShown)[0] || document.body;
    speech.blocks = collectBlocks(scope);
    if (!speech.blocks.length) { announce('Nothing to read on this page.'); return; }
    speech.active = true; speech.paused = false; speech.i = 0;
    close(false);
    player.hidden = false;
    renderAll();
    readCurrent();
    var t = player.querySelector('[data-say="toggle"]'); if (t) t.focus();
  }

  function readCurrent() {
    var b = speech.blocks[speech.i];
    if (!b) { stopReading(); announce('Finished reading the page.'); return; }
    light(b.el);
    b.el.scrollIntoView({ block: 'center', behavior: state.pause ? 'auto' : 'smooth' });
    player.querySelector('.a11y-player-label').textContent = (speech.i + 1) + ' / ' + speech.blocks.length;
    setToggle(false);
    speak(b.text, function () { speech.i++; readCurrent(); });
  }

  function setToggle(paused) {
    speech.paused = paused;
    var t = player.querySelector('[data-say="toggle"]');
    t.innerHTML = svg(paused ? ICONS.play : ICONS.pauseSmall);
    t.setAttribute('aria-label', paused ? 'Resume reading' : 'Pause reading');
  }

  function stopReading() {
    speech.token++;
    if (hasTTS) synth.cancel();
    light(null);
    var wasActive = speech.active;
    speech.active = false; speech.paused = false;
    if (player) player.hidden = true;
    renderAll();
    if (wasActive && launcher && isShown(launcher)) launcher.focus();
  }

  function onPlayerClick(e) {
    var b = e.target.closest('button'); if (!b) return;
    var act = b.getAttribute('data-say');
    if (act === 'stop') { stopReading(); announce('Stopped reading'); }
    else if (act === 'toggle') {
      if (speech.paused) { setToggle(false); synth.resume(); if (!synth.speaking) readCurrent(); }
      else { setToggle(true); synth.pause(); }
    }
    else if (act === 'next') { speech.i = Math.min(speech.i + 1, speech.blocks.length - 1); readCurrent(); }
    else if (act === 'prev') { speech.i = Math.max(speech.i - 1, 0); readCurrent(); }
    else if (act === 'rate') {
      speech.rateIdx = (speech.rateIdx + 1) % RATES.length;
      var r = RATES[speech.rateIdx];
      b.textContent = r + '×'; b.setAttribute('aria-label', 'Reading speed ' + r + ' times');
      if (!speech.paused) readCurrent();
    }
  }

  /* Click to read: reads what you click (or tab to) */
  function blockOf(el) {
    var e = el;
    while (e && e !== document.body && !BLOCK_DISPLAY.test(getComputedStyle(e).display)) e = e.parentElement;
    return e || el;
  }
  function onClickRead(e) {
    if (!state.clickRead || speech.active) return;
    var t = e.target;
    if (!(t instanceof Element) || ui.contains(t) || !document.body.contains(t)) return;
    var ctl = t.closest('a[href],button,input,select,textarea,[role="button"],[role="link"]');
    var text, el;
    if (ctl) { el = ctl; text = [nameOf(ctl), roleOf(ctl)].filter(Boolean).join(', '); }
    else { el = blockOf(t); text = (el.innerText || '').trim(); }
    if (!text) return;
    light(el);
    speak(text.slice(0, 1200), function () { if (speech.lit === el) light(null); });
  }
  function onFocusRead(e) {
    if (!state.clickRead || speech.active) return;
    var t = e.target;
    if (!(t instanceof Element) || ui.contains(t) || !t.matches(':focus-visible')) return;
    var text = [nameOf(t), roleOf(t)].filter(Boolean).join(', ');
    if (text) speak(text.slice(0, 400));
  }

  /* ───────────── Reading guide, mask, labels, pause ───────────── */

  var lastY = Math.round(window.innerHeight / 2);
  function placeAids(y) {
    if (typeof y === 'number') lastY = y;
    if (state.guide) guide.style.top = Math.max(0, lastY - 6) + 'px';
    if (state.mask) {
      var band = 140, top = Math.max(0, lastY - band / 2);
      maskTop.style.height = top + 'px';
      maskBottom.style.height = Math.max(0, window.innerHeight - (top + band)) + 'px';
    }
  }
  function onPointerMove(e) { if (state.guide || state.mask) placeAids(e.clientY); }
  function onTouchMove(e) { if ((state.guide || state.mask) && e.touches[0]) placeAids(e.touches[0].clientY); }
  function onFocusAids(e) {
    if (!(state.guide || state.mask) || !(e.target instanceof Element) || ui.contains(e.target)) return;
    var r = e.target.getBoundingClientRect();
    placeAids(r.top + r.height / 2);
  }

  function labelFor(el) {
    var host = el.closest('[aria-label],img[alt],image-slot[alt],[title]');
    if (!host || ui.contains(host)) return null;
    var text = host.getAttribute('aria-label') || host.getAttribute('alt') || host.getAttribute('title');
    return text && text.trim() ? { el: host, text: text.trim() } : null;
  }
  function showTip(e) {
    if (!state.labels || !(e.target instanceof Element)) return;
    var found = labelFor(e.target);
    if (!found) { tip.hidden = true; return; }
    tip.textContent = found.text;
    tip.hidden = false;
    var r = found.el.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
    var x = Math.min(Math.max(8, r.left + r.width / 2 - tw / 2), window.innerWidth - tw - 8);
    var y = r.bottom + 8 + th > window.innerHeight ? r.top - th - 8 : r.bottom + 8;
    tip.style.left = x + 'px'; tip.style.top = Math.max(8, y) + 'px';
  }
  function hideTip() { if (tip) tip.hidden = true; }

  /* A play the visitor asked for (tapping a reel, its Play button) is allowed even while
     "Pause animations" is on; anything that starts by itself is stopped. */
  var userPlayAt = 0;
  function onPlay(e) {
    var v = e.target;
    if (!v || v.tagName !== 'VIDEO') return;
    var reel = v.closest('.hx-reel');
    if (reel && Date.now() - userPlayAt < 1200) {
      v.removeAttribute('data-user-paused');
      syncReelButton(reel);
      return;
    }
    if (state.pause) {
      v.setAttribute('data-a11y-paused', '');
      v.pause();
    }
  }

  /* Reels: visible Pause / Play per video (WCAG 2.2.2). A reel the visitor paused stays
     paused (the autoplay script checks data-user-paused). */
  function syncReelButton(reel) {
    var b = reel.querySelector('[data-a11y-reel-pp]'), v = reel.querySelector('video');
    if (!b || !v) return;
    var paused = v.hasAttribute('data-user-paused');
    b.setAttribute('aria-pressed', paused ? 'true' : 'false');
    var t = (reel.querySelector('.hx-reel-meta strong') || {}).textContent || 'video';
    b.setAttribute('aria-label', (paused ? 'Play video: ' : 'Pause video: ') + t);
    b.classList.toggle('is-paused', paused);
  }
  function onReelClick(e) {
    var t = e.target instanceof Element ? e.target : null;
    if (!t) return;
    if (t.closest('.hx-reel-frame')) { userPlayAt = Date.now(); return; }
    var b = t.closest('[data-a11y-reel-pp]');
    if (!b) return;
    var reel = b.closest('.hx-reel'), v = reel && reel.querySelector('video');
    if (!v) return;
    if (v.hasAttribute('data-user-paused')) {
      v.removeAttribute('data-user-paused');
      userPlayAt = Date.now();
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    } else {
      v.setAttribute('data-user-paused', '');
      v.pause();
    }
    syncReelButton(reel);
  }
  function syncVideos() {
    document.querySelectorAll('video').forEach(function (v) {
      if (state.pause) {
        if (!v.paused) { v.setAttribute('data-a11y-paused', ''); v.pause(); }
      } else if (v.hasAttribute('data-a11y-paused')) {
        v.removeAttribute('data-a11y-paused');
        var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
      }
    });
  }

  function syncBehaviours() {
    if (!ui) return;
    guide.hidden = !state.guide;
    maskTop.hidden = maskBottom.hidden = !state.mask;
    placeAids();
    if (!state.labels) hideTip();
    syncVideos();
    if (!state.clickRead && !speech.active && hasTTS) { speech.token++; synth.cancel(); light(null); }
  }

  /* ───────────── Page fixes that must survive re-renders ───────────── */

  /* Skip link: move focus into the visible <main> (the template has one per view; only the
     current view renders). tabindex is added only for the jump and removed on blur, so a
     mouse click inside <main> never focuses the whole page. */
  function onSkipClick(e) {
    /* any [data-a11y-open] control (skip menu, statement page) opens the panel */
    var opener = e.target.closest && e.target.closest('[data-a11y-open]');
    if (opener && !ui.contains(opener)) { e.preventDefault(); open(opener); return; }
    var a = e.target.closest && e.target.closest('.a11y-skip-link');
    if (!a) return;
    var target = Array.prototype.filter.call(document.querySelectorAll('main'), isShown)[0];
    if (!target) return;
    e.preventDefault();
    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1');
      target.addEventListener('blur', function rm() { target.removeAttribute('tabindex'); target.removeEventListener('blur', rm); });
    }
    target.scrollIntoView({ block: 'start', behavior: 'auto' });
    target.focus({ preventScroll: true });
  }

  /* Decorative icons: an <svg> with no title and no role says nothing a screen reader can
     use, so hide it (the control around it carries the name). React re-renders can create
     new ones at any time, hence the observer. */
  function hideDecorativeSvgs(scope) {
    var list = (scope || document.body).querySelectorAll('svg:not([aria-hidden]):not([role])');
    for (var i = 0; i < list.length; i++) {
      var s = list[i];
      if (s.querySelector('title') || s.hasAttribute('aria-label') || s.hasAttribute('aria-labelledby')) continue;
      s.setAttribute('aria-hidden', 'true');
      s.setAttribute('focusable', 'false');
    }
  }
  function watchPage() {
    hideDecorativeSvgs();
    var queued = false;
    new MutationObserver(function () {
      if (queued) return;
      queued = true;
      setTimeout(function () { queued = false; hideDecorativeSvgs(); }, 120);
    }).observe(document.body, { childList: true, subtree: true });
  }

  /* ───────────── Page widgets: keyboard and focus behaviour (Phase 3) ─────────────
     The templates now say what each control is and its state (aria-expanded/pressed).
     This part supplies what attributes can't: where focus goes, and the keys. */

  var lastFocus = null;        /* last element that had focus anywhere on the page */
  var lastOutside = null;      /* last focused element outside any open dialog */
  var popTrigger = null;       /* last popover trigger the user opened */
  var dialogs = [];            /* open page dialogs: { cfg, el, release } */

  /* Page dialogs. focus: what gets focus on open (default: first control).
     keys: key -> control to click while the dialog is open (Escape is otherwise left to the page). */
  var DIALOGS = [
    { sel: '[data-a11y-lightbox]', focus: '[data-a11y-lb="close"]',
      keys: { Escape: '[data-a11y-lb="close"]', ArrowLeft: '[data-a11y-lb="prev"]', ArrowRight: '[data-a11y-lb="next"]' } },
    { sel: '.px-sheet', focus: '.px-sheet-h button', keys: { Escape: '.px-sheet-h button' } },
    { sel: '.hx-sheet', focus: 'input', keys: {} },
    { sel: '#sx-bsheet:not([hidden])', focus: '.sx-bs-panel:not([hidden]) .sx-bs-x', keys: {} }
  ];

  /* Inside any page dialog — checked by selector, not just registered dialogs, because some
     dialogs (the home search sheet) move focus inside themselves before they are registered. */
  function inOpenDialog(el) {
    for (var i = 0; i < dialogs.length; i++) if (dialogs[i].el.contains(el)) return true;
    for (var j = 0; j < DIALOGS.length; j++) if (el.closest(DIALOGS[j].sel)) return true;
    return !!el.closest('#sh-mobile-nav');
  }

  function syncDialogs() {
    DIALOGS.forEach(function (cfg) {
      var el = Array.prototype.filter.call(document.querySelectorAll(cfg.sel), isShown)[0] || null;
      var open = dialogs.filter(function (d) { return d.cfg === cfg; })[0];
      if (el && !open) {
        var opener = lastOutside && document.contains(lastOutside) ? lastOutside : null;
        var d = { cfg: cfg, el: el, release: trapFocus(el, opener) };
        dialogs.push(d);
        if (!el.contains(document.activeElement)) {
          var f = (cfg.focus && el.querySelector(cfg.focus)) || focusables(el)[0];
          if (f) setTimeout(function () { if (document.contains(f)) f.focus(); }, 40);
        }
      } else if (open && open.el !== el) {
        dialogs.splice(dialogs.indexOf(open), 1);
        open.release(); /* focus back to whatever opened it */
      }
    });
  }

  /* Popovers (search fields, sort menu, booking date): opened by keyboard, focus moves to
     the selected option (or the first one). */
  function popoverItems(trigger) {
    var scope = trigger.parentElement, out = [];
    if (!scope) return out;
    var all = focusables(scope), after = false;
    for (var i = 0; i < all.length; i++) {
      if (all[i] === trigger) { after = true; continue; }
      if (after && !all[i].disabled) out.push(all[i]);
    }
    return out;
  }
  function onPageClick(e) {
    var t = e.target instanceof Element ? e.target : null;
    if (!t) return;
    var trig = t.closest('[data-a11y-popover-trigger]');
    if (trig) {
      popTrigger = trig;
      if (e.detail === 0) { /* keyboard activation */
        setTimeout(function () {
          if (trig.getAttribute('aria-expanded') !== 'true') return;
          var items = popoverItems(trig);
          /* the selected option, else (calendars) the first available day, else the first control */
          var pick = items.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })[0] ||
            items.filter(function (b) { return b.hasAttribute('data-a11y-day'); })[0] || items[0];
          if (pick) pick.focus();
        }, 90);
      }
    }
    var dest = t.closest('[aria-controls="sx-mega-dest"]');
    if (dest && e.detail === 0) {
      setTimeout(function () {
        var first = document.querySelector('#sx-mega-dest a[href]');
        if (first && dest.getAttribute('aria-expanded') === 'true') first.focus();
      }, 90);
    }
  }

  /* When the focused element is removed by a re-render (an option picked, a popover closed),
     focus would fall to <body>; put it back on the control that opened the popover. */
  function rescueFocus() {
    setTimeout(function () {
      var a = document.activeElement;
      if (a && a !== document.body) return;
      if (lastFocus && document.contains(lastFocus)) return;
      if (popTrigger && document.contains(popTrigger) && isShown(popTrigger)) popTrigger.focus();
    }, 80);
  }

  function megaOpen() { return document.querySelector('.sx-mega'); }
  function closeMega() {
    var b = document.querySelector('[data-a11y-bridge="close-menu"]');
    if (b) b.click();
  }

  /* Calendar: arrow keys move between days (left/right a day, up/down a week), Home/End to week edges */
  function onCalendarKey(e) {
    var t = e.target;
    var step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (!step && e.key !== 'Home' && e.key !== 'End') return false;
    var grid = t.parentElement && t.closest('.dx-cal-grid, .hx-cal-grid, [class*="cal-grid"]');
    var days = Array.prototype.slice.call((grid || t.parentElement).querySelectorAll('[data-a11y-day]'));
    var i = days.indexOf(t);
    if (i < 0) return false;
    var j = e.key === 'Home' ? i - (i % 7) : e.key === 'End' ? i - (i % 7) + 6 : i + step;
    var dir = step ? (step > 0 ? 1 : -1) : (e.key === 'Home' ? 1 : -1);
    while (j >= 0 && j < days.length && days[j].disabled) j += dir;
    if (j >= 0 && j < days.length) days[j].focus();
    e.preventDefault();
    return true;
  }

  function onPageKey(e) {
    var t = e.target instanceof Element ? e.target : null;

    /* Enter/Space on custom buttons (role=button divs) */
    if (t && (e.key === 'Enter' || e.key === ' ') && t.hasAttribute('data-a11y-keyclick')) {
      e.preventDefault(); t.click(); return;
    }
    if (t && t.hasAttribute('data-a11y-day') && onCalendarKey(e)) return;

    /* Keys for the top-most open dialog */
    var top = dialogs[dialogs.length - 1];
    if (top && top.cfg.keys[e.key]) {
      var ctl = top.el.querySelector(top.cfg.keys[e.key]);
      if (ctl) { e.preventDefault(); e.stopPropagation(); ctl.click(); return; }
    }

    if (e.key === 'Escape') {
      /* Mega-menus (hover content must be dismissable without moving the pointer) */
      if (megaOpen()) {
        var wasInside = t && (t.closest('.sx-mega') || t.closest('header'));
        closeMega();
        var destBtn = document.querySelector('[aria-controls="sx-mega-dest"]');
        if (wasInside && destBtn) destBtn.focus();
        return;
      }
      /* Popovers without their own Escape (sort menu, booking date) */
      if (popTrigger && document.contains(popTrigger) && popTrigger.getAttribute('aria-expanded') === 'true' &&
          t && popTrigger.parentElement && popTrigger.parentElement.contains(t)) {
        e.preventDefault();
        popTrigger.click();
        popTrigger.focus();
      }
    }
  }

  function onFocusIn(e) {
    var t = e.target;
    if (!(t instanceof Element) || ui.contains(t)) return;
    lastFocus = t;
    if (!inOpenDialog(t)) lastOutside = t;
    /* Keyboard focus leaving the header closes an open mega-menu */
    if (megaOpen() && !t.closest('header')) closeMega();
  }

  function watchWidgets() {
    var queued = false;
    function run() { queued = false; syncDialogs(); }
    new MutationObserver(function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(run);
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class'] });
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('click', onPageClick, true);
    document.addEventListener('click', rescueFocus);
    document.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') rescueFocus(); });
    document.addEventListener('keydown', onPageKey, true);
    syncDialogs();
  }

  /* ───────────── Global keys ───────────── */

  function onKey(e) {
    if (e.altKey && !e.ctrlKey && !e.metaKey && (e.code === 'KeyA' || e.key === 'a' || e.key === 'A')) {
      e.preventDefault();
      isOpen() ? close() : open(document.activeElement);
      return;
    }
    if (e.key === 'Escape') {
      if (isOpen()) {
        e.stopPropagation(); e.preventDefault();
        if (!structView.hidden) showMain(true); else close();
      } else if (speech.active) { stopReading(); }
    }
  }

  /* ───────────── Start ───────────── */

  function start() {
    if (document.getElementById('a11y-ui')) return;
    build();
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('focusin', onFocusAids);
    document.addEventListener('mouseover', showTip);
    document.addEventListener('focusin', showTip);
    document.addEventListener('mouseout', function (e) { if (!e.relatedTarget || !labelFor(e.relatedTarget)) hideTip(); });
    document.addEventListener('focusout', hideTip);
    window.addEventListener('scroll', hideTip, { passive: true });
    window.addEventListener('resize', function () { placeAids(); });
    document.addEventListener('play', onPlay, true);
    document.addEventListener('click', onReelClick, true);
    document.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target instanceof Element && e.target.closest('.hx-reel-frame')) userPlayAt = Date.now();
    }, true);
    document.addEventListener('click', onClickRead, true);
    document.addEventListener('focusin', onFocusRead);
    structView.addEventListener('click', function (e) {
      var b = e.target.closest('[data-goto]'); if (b) gotoItem(+b.getAttribute('data-goto'));
    });
    window.addEventListener('pagehide', function () { if (hasTTS) synth.cancel(); });
    document.addEventListener('click', onSkipClick);
    watchPage();
    watchWidgets();
    syncBehaviours();
  }

  window.SHA11y = { trapFocus: trapFocus, announce: announce, open: open, close: close };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
