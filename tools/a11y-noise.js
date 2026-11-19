/*
 * Screen-reader noise check (accessibility round 2).
 *
 * Measures how much a blind visitor has to listen through on a page:
 *   tabStops   - keyboard stops (visible, not inert, not tabindex=-1)
 *   links      - links among those stops
 *   repeats    - a link followed directly by another link to the same page
 *   symbols    - stops whose spoken name contains a decorative symbol (▾ → ★ ॥ …). The middle
 *                dot (·) is left out: screen readers don't speak it at default punctuation.
 *   deva       - stops whose spoken name mixes Devanagari into English
 *   vague      - stops named only "View", "Read more", "Click here"…
 *   glued      - words run together in a name ("Kashmir4", "DestinationAny destination")
 *   mismatch   - aria-label that does not contain the visible words (WCAG 2.5.3). Checked for
 *                short visible labels (up to 40 characters, with letters); a control that
 *                holds a whole block of content has no single visible label to match.
 *   long       - names over 90 characters
 *
 * Usage, in a page or an iframe's window:  a11yNoise(document) → { counts, items }
 * Used by tools/a11y-selftest.html. Run after the page has rendered.
 */
(function (root) {
  'use strict';
  var SYMBOLS = /[▾▸►→←★☆✦।॥•›»↗]/;
  var DEVA = /[ऀ-ॿ]/;
  var VAGUE = /^(view|read more|more|click here|learn more|view all|explore|here|details|go)$/i;
  /* words run together: "Kashmir4", "DestinationAny" (brand names and handles excepted) */
  var GLUED = /([a-z]{3,}\d)|([a-z]{3,}[A-Z][a-z])/;
  var GLUED_OK = /WhatsApp|YouTube|OpenDyslexic|RytfulMedia|@\S+|sahapathikateam\d+|\.html/g;

  function hidden(el, win) {
    for (var n = el; n && n.nodeType === 1; n = n.parentElement) {
      if (n.hasAttribute('inert') || n.getAttribute('aria-hidden') === 'true') return true;
      var cs = win.getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden') return true;
    }
    return !el.getClientRects().length;
  }

  function clean(s) { return (s || '').replace(/\s+/g, ' ').trim(); }

  /* Approximate accessible name (enough for links and buttons) */
  function textOf(node, win) {
    var out = '';
    node.childNodes.forEach(function (c) {
      if (c.nodeType === 3) { out += c.nodeValue; return; }
      if (c.nodeType !== 1) return;
      if (c.getAttribute('aria-hidden') === 'true') return;
      var cs = win.getComputedStyle(c);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      if (c.tagName === 'IMG') { out += ' ' + (c.getAttribute('alt') || '') + ' '; return; }
      if (c.tagName === 'svg' || c.tagName === 'SVG') {
        var t = c.querySelector('title'); if (t) out += ' ' + t.textContent + ' '; return;
      }
      if (c.getAttribute('aria-label')) { out += ' ' + c.getAttribute('aria-label') + ' '; return; }
      var block = /^(block|flex|grid|list-item|table)/.test(cs.display);
      out += (block ? ' ' : '') + textOf(c, win) + (block ? ' ' : '');
    });
    return out;
  }
  function nameOf(el, win) {
    var lb = el.getAttribute('aria-labelledby');
    if (lb) return clean(lb.split(/\s+/).map(function (id) { var t = el.ownerDocument.getElementById(id); return t ? textOf(t, win) : ''; }).join(' '));
    if (el.getAttribute('aria-label')) return clean(el.getAttribute('aria-label'));
    if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
      if (el.labels && el.labels.length) return clean(textOf(el.labels[0], win));
      return clean(el.getAttribute('placeholder') || el.getAttribute('title') || '');
    }
    return clean(textOf(el, win)) || clean(el.getAttribute('title'));
  }
  /* What a sighted person sees on the control (for label-in-name) */
  function visibleText(el, win) {
    var t = '';
    (function walk(n) {
      n.childNodes.forEach(function (c) {
        if (c.nodeType === 3) { t += c.nodeValue; return; }
        if (c.nodeType !== 1) return;
        var cs = win.getComputedStyle(c);
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        if (c.classList.contains('a11y-sr')) return;
        var block = /^(block|flex|grid|list-item)/.test(cs.display);
        if (block) t += ' ';
        walk(c);
        if (block) t += ' ';
      });
    })(el);
    return clean(t);
  }
  function words(s) {
    return clean(s.toLowerCase().replace(/[ऀ-ॿ]+/g, ' ').replace(/[^a-z0-9@ ]+/g, ' '));
  }
  function hrefKey(a, doc) {
    try { var u = new URL(a.getAttribute('href'), doc.baseURI); return u.pathname.replace(/\/index\.html$/, '/') + u.search + u.hash; }
    catch (e) { return a.getAttribute('href'); }
  }

  function a11yNoise(doc) {
    var win = doc.defaultView;
    var sel = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[tabindex]';
    var stops = [].slice.call(doc.querySelectorAll(sel)).filter(function (el) {
      if (el.disabled) return false;
      var ti = el.getAttribute('tabindex');
      if (ti !== null && +ti < 0) return false;
      if (el.closest('#a11y-ui')) return false;
      return !hidden(el, win);
    });
    var items = { repeats: [], symbols: [], deva: [], vague: [], glued: [], mismatch: [], long: [] };
    var prev = null, prevName = '';
    stops.forEach(function (el) {
      var name = nameOf(el, win);
      var label = el.getAttribute('aria-label');
      if (el.tagName === 'A') {
        var k = hrefKey(el, doc);
        /* same page, and one name says nothing new (a photo, "View", the title again).
           Distinct options that share a page (five services → contact form) are not noise. */
        var pn = prev ? words(prevName) : '', nn = words(name);
        if (prev && prev.tagName === 'A' && hrefKey(prev, doc) === k && !/^#/.test(el.getAttribute('href')) &&
            (!pn || !nn || pn.indexOf(nn) >= 0 || nn.indexOf(pn) >= 0 || /^(view|more|read more)\b/.test(nn))) items.repeats.push(name + '  [' + k + ']');
      }
      prev = el; prevName = name;
      if (SYMBOLS.test(name)) items.symbols.push(name);
      if (DEVA.test(name) && /[a-z]/i.test(name)) items.deva.push(name);
      if (VAGUE.test(name)) items.vague.push(name);
      if (GLUED.test(name.replace(GLUED_OK, ' '))) items.glued.push(name);
      if (name.length > 90) items.long.push(name);
      if (label && !el.getAttribute('aria-labelledby')) {
        var vis = words(visibleText(el, win));
        if (vis && vis.length <= 40 && /[a-z]/.test(vis) && words(label).indexOf(vis) !== 0 && words(label).indexOf(vis) < 0) items.mismatch.push('"' + vis + '" vs "' + label + '"');
      }
    });
    var counts = { tabStops: stops.length, links: stops.filter(function (e) { return e.tagName === 'A'; }).length };
    Object.keys(items).forEach(function (k) { counts[k] = items[k].length; });
    return { counts: counts, items: items };
  }
  root.a11yNoise = a11yNoise;
})(typeof window !== 'undefined' ? window : this);
