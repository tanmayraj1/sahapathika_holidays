/*
 * Accessibility edits applied by tools/a11y-inject.js to every live page.
 *
 * Each edit:
 *   id          unique, used with --only=
 *   description one line for --list
 *   appliesTo   'full' (default: pages carrying the app) | 'stub' (legal pages)
 *               | 'all' | [file names] | (file, kind) => boolean
 *   find        string or RegExp. Write line breaks as '\n'; they are matched
 *               against the file's own line endings.
 *   replace     string or replacer function
 *   expect      matches required per file: a number, { min, max }, or
 *               (file, kind) => either. Default: at least one.
 *   applied     string whose presence means "already done" (default: replace,
 *               when replace is a string). Make it unique to this edit.
 *   markerFrom  id of another edit whose output deliberately contains this
 *               edit's `applied` marker (the injector otherwise refuses that).
 *
 * Keep edits in phase order. Phase 0 ships with none; each later phase adds its own.
 */
'use strict';

/* Marks a page whose colours have been updated for contrast (Phase 5) */
var CC_MARK = '<!-- a11y: colour contrast v1 -->';

/* The Varanasi guide page has no day-by-day itinerary block */
var NO_ITINERARY = (f) => f === 'package-varanasi-tour-packages-from-kerala.html' ? 0 : 1;

/* Skip links (styled in a11y/a11y.css, behaviour in a11y/a11y.js) */
var SKIP = '<div class="a11y-skip"><a class="a11y-skip-link" href="#main-content">Skip to main content</a>' +
  '<button type="button" class="a11y-skip-link" data-a11y-open>Accessibility options (Alt+A)</button></div>';

/* Footer newsletter handler (replaces the old one; the older duplicate is removed) */
var FOOTER_NL = [
  '/* Footer newsletter: send to our inbox without leaving the page.',
  '     a11y: single footer newsletter handler — the message is tied to the field and announced,',
  '     and a failed send says so instead of thanking the visitor. */',
  '  (function () {',
  '    document.addEventListener(\'submit\', function (e) {',
  '      var f = e.target; if (!f.classList || !f.classList.contains(\'subscribe\')) return;',
  '      e.preventDefault();',
  '      var inp = f.querySelector(\'input[type="email"]\'), v = (inp.value || \'\').trim();',
  '      var msg = f.parentNode.querySelector(\'.nl-msg\');',
  '      if (!msg) { msg = document.createElement(\'p\'); msg.className = \'nl-msg\'; msg.id = \'nl-msg-footer\'; msg.setAttribute(\'role\', \'status\'); f.parentNode.insertBefore(msg, f.nextSibling); }',
  '      function say(text, bad) { msg.textContent = text; msg.style.cssText = \'margin:10px 0 0;font-size:13.5px;font-weight:700;color:\' + (bad ? \'#9A1F17\' : \'#2F7A63\'); }',
  '      if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(v)) {',
  '        inp.setAttribute(\'aria-invalid\', \'true\'); inp.setAttribute(\'aria-describedby\', msg.id);',
  '        say(\'Please enter a valid email address, like name@example.com.\', true); inp.focus(); return;',
  '      }',
  '      inp.removeAttribute(\'aria-invalid\'); inp.removeAttribute(\'aria-describedby\');',
  '      var btn = f.querySelector(\'button\'); if (btn) btn.disabled = true;',
  '      say(\'Subscribing…\');',
  '      fetch(\'https://formsubmit.co/ajax/sahapathika@gmail.com\', { method: \'POST\', headers: { \'Content-Type\': \'application/json\', \'Accept\': \'application/json\' }, body: JSON.stringify({ email: v, _subject: \'New newsletter sign-up (website footer)\', _template: \'table\' }) })',
  '        .then(function (r) { if (r && r.ok === false) throw new Error(\'send failed\'); f.style.display = \'none\'; say(\'Thank you — you\\\'re on the list.\'); })',
  '        .catch(function () { if (btn) btn.disabled = false; say(\'We couldn\\\'t subscribe you just now. Please try again, or WhatsApp us on +91 90727 69547.\', true); });',
  '    });',
  '  })();'
].join('\n');

/* Photo descriptions — checked against the photos themselves */
var ALT = {
  backwater: 'Palm-lined backwater canal near Champakulam, Kerala, with wooden canoes moored on the bank',
  ashtamudi: 'Calm water of Ashtamudi Lake, Kerala, framed by coconut palm fronds',
  houseboats: 'A row of thatched houseboats moored on the Alleppey backwaters, Kerala',
  munnar: 'Mist over the rolling tea plantations of Munnar, Kerala'
};

module.exports = [

  /* ── Phase 1: accessibility toolbar ── */
  {
    id: 'toolbar-include',
    description: 'Load a11y/a11y.css + a11y/a11y.js in <head>, right after support.js',
    appliesTo: 'full',
    find: '<script src="./support.js"></script>\n',
    replace: '<script src="./support.js"></script>\n' +
      '<link rel="stylesheet" href="./a11y/a11y.css">\n' +
      '<script src="./a11y/a11y.js"></script>\n',
    applied: 'a11y/a11y.js',
    expect: 1
  },
  {
    id: 'toolbar-include-stub',
    description: 'Load the toolbar on the legal placeholder pages too',
    appliesTo: 'stub',
    find: '</head>',
    replace: '<link rel="stylesheet" href="./a11y/a11y.css">\n' +
      '<script src="./a11y/a11y.js"></script>\n' +
      '</head>',
    applied: 'a11y/a11y.js',
    expect: 1
  },

  /* ── Phase 2: foundations ── */
  {
    id: 'skip-link',
    description: 'Skip links as the first focusable elements (outside the app, so re-renders keep them)',
    appliesTo: 'full',
    find: '<body>\n<x-dc>',
    replace: '<body>\n' + SKIP + '\n<x-dc>',
    applied: 'class="a11y-skip"',
    expect: 1
  },
  {
    id: 'skip-link-stub',
    description: 'Skip links on the legal pages',
    appliesTo: 'stub',
    find: '<body>\n',
    replace: '<body>\n' + SKIP + '\n',
    applied: 'class="a11y-skip"',
    expect: 1
  },
  {
    id: 'main-id',
    description: 'id="main-content" on each view\'s <main> (one renders at a time) — the skip-link target',
    appliesTo: 'full',
    find: /^([ \t]*)<main(?=[ >])/gm,
    replace: '$1<main id="main-content"',
    applied: '<main id="main-content"',
    expect: 5
  },
  {
    id: 'stub-lang',
    description: 'Legal pages: declare the page language',
    appliesTo: 'stub',
    find: '<html>',
    replace: '<html lang="en">',
    applied: '<html lang="', /* any declared language counts (the statement is also in ml and hi) */
    expect: 1
  },
  {
    id: 'stub-main',
    description: 'Legal pages: the content box becomes <main>',
    appliesTo: 'stub',
    find: /<div class="container">([\s\S]*?)(\r?\n)  <\/div>(\r?\n)<\/body>/,
    replace: '<main id="main-content" class="container">$1$2  </main>$3</body>',
    applied: '<main id="main-content" class="container">',
    expect: 1
  },

  /* Text alternatives for photos (image-slot.js now passes alt to its <img>). Written from
     what each photo actually shows — the slot placeholders are photo briefs, not descriptions. */
  slotAlt('sh-about-1', 'packages_cards/kerala_backwater.jpg', ALT.backwater),
  slotAlt('sh-about-2', 'packages_cards/kerala_vembanad.jpg', ALT.ashtamudi),
  slotAlt('sh-ab-1', 'packages_cards/kerala_backwater.jpg', ALT.backwater),
  slotAlt('sh-ab-2', 'packages_cards/kerala_alleppey.jpg', ALT.houseboats),
  slotAlt('sh-ab-3', 'packages_cards/kerala_munnar.jpg', ALT.munnar),
  {
    id: 'alt-gallery',
    description: 'Gallery photos: alt from the per-photo caption data (dxPhotoCaps / galleryItems)',
    appliesTo: 'full',
    find: '<image-slot id="{{ g.slotId }}" src="{{ g.photo }}"',
    replace: '<image-slot id="{{ g.slotId }}" alt="{{ g.hint }}" src="{{ g.photo }}"',
    expect: 1
  },
  {
    id: 'alt-lightbox',
    description: 'Lightbox photo: alt from the same caption',
    appliesTo: 'full',
    find: '<image-slot id="{{ lightboxSlot }}" src="{{ lightboxPhoto }}"',
    replace: '<image-slot id="{{ lightboxSlot }}" alt="{{ lightboxHint }}" src="{{ lightboxPhoto }}"',
    expect: 1
  },

  /* Structure */
  {
    id: 'office-map-title',
    description: 'Contact page: name each office map iframe (the offices block exists only in contact.html)',
    appliesTo: ['contact.html'],
    find: '<iframe src="{{ o.embed }}" style=',
    replace: '<iframe src="{{ o.embed }}" title="Map of our {{ o.city }} office" style=',
    expect: 1
  },
  {
    id: 'booking-region',
    description: 'Package page booking card: a named region instead of an <aside> nested in <main>',
    appliesTo: 'full',
    find: /<aside class="dx-aside detail-aside">([\s\S]*?)<\/aside>/,
    replace: '<div class="dx-aside detail-aside" role="region" aria-label="Plan this trip">$1</div>',
    applied: 'aria-label="Plan this trip"',
    expect: 1
  },
  {
    id: 'packages-results-heading',
    description: 'Packages page: a heading (screen-reader only) above the results, so card titles (h3) sit under an h2',
    appliesTo: 'full',
    find: '<div class="px-grid {{ pxSwap }}">',
    replace: '<h2 class="a11y-sr">Packages</h2>\n        <div class="px-grid {{ pxSwap }}">',
    applied: 'Packages</h2>\n        <div class="px-grid {{ pxSwap }}">', /* round 2 adds an id to the h2 */
    expect: 1
  },
  {
    id: 'enquiry-heading',
    description: 'Contact page: "Send an enquiry" is a heading, not a styled div',
    appliesTo: 'full',
    find: '<div id="enquiry-form" style="font-family:\'Fraunces\',serif;font-size:27px;letter-spacing:-.01em;margin-bottom:26px;scroll-margin-top:100px;">Send an enquiry</div>',
    replace: '<h2 id="enquiry-form" style="font-family:\'Fraunces\',serif;font-size:27px;font-weight:400;line-height:1.2;letter-spacing:-.01em;margin:0 0 26px;scroll-margin-top:100px;">Send an enquiry</h2>',
    applied: '<h2 id="enquiry-form"', /* round 2 turns the px font size into rem */
    expect: 1
  },
  {
    id: 'whatsapp-landmark',
    description: 'Floating WhatsApp button sits inside a labelled landmark',
    appliesTo: 'full',
    find: /(<a href="https:\/\/wa\.me\/919072769547" target="_blank" rel="noopener" style="position:fixed;[\s\S]*?<\/a>)/,
    replace: '<aside aria-label="WhatsApp chat">$1</aside>',
    applied: '<aside aria-label="WhatsApp chat">',
    expect: 1
  },
  {
    id: 'call-landmark',
    description: 'Floating call button (built by the bottom-nav script) sits inside a labelled landmark',
    appliesTo: 'full',
    find: '\'<a id="sx-call" href="tel:+919072769547" aria-label="Call Sahapathika Holidays on +91 90727 69547">\' + ic.phone + \'<span>Call us</span></a>\' +',
    replace: '\'<aside aria-label="Call us"><a id="sx-call" href="tel:+919072769547" aria-label="Call Sahapathika Holidays on +91 90727 69547">\' + ic.phone + \'<span>Call us</span></a></aside>\' +',
    applied: '<aside aria-label="Call us"><a id="sx-call"', /* round 2 renames the link inside */
    expect: 1
  },

  /* ── Phase 3: interactive components ──
     Expressions inside {{ }} support === / !== against string literals (support.js resolve()),
     so selected/expanded state is read straight from the class strings the logic already builds. */

  /* Header & menus */
  {
    id: 'unwrap-button-links',
    description: 'A <button> nested in an <a> (nav items, Plan My Trip, CTAs) becomes the link itself',
    appliesTo: 'full',
    find: /<a href="([^"]+)" onClick="(\{\{ [\w.]+ \}\})" style="text-decoration:none; display:contents;"><button ([^>]*)>([\s\S]*?)<\/button><\/a>/g,
    replace: '<a href="$1" onClick="$2" data-a11y-btnlink $3>$4</a>',
    applied: 'data-a11y-btnlink',
    expect: (f) => f === 'index.html' ? 7 : 10
  },
  {
    id: 'dest-menu-button',
    description: 'Destinations button reports open/closed and which panel it controls',
    appliesTo: 'full',
    find: 'aria-haspopup="true">Destinations',
    replace: 'aria-expanded="{{ menuDest }}" aria-controls="sx-mega-dest">Destinations',
    expect: 1
  },
  {
    id: 'mega-roles',
    description: 'Mega-menus hold plain links: role=menu (which promises arrow-key menus) becomes a named group',
    appliesTo: 'full',
    find: /<div class="sx-mega" role="menu" aria-label="(Destinations|Packages)">/g,
    replace: (m, name) => '<div class="sx-mega" id="sx-mega-' + (name === 'Destinations' ? 'dest' : 'pkg') + '" role="group" aria-label="' + name + '">',
    applied: 'id="sx-mega-dest"',
    expect: 2
  },
  {
    id: 'header-bridge',
    description: 'Hidden bridge button wired to the app\'s closeMenu, so a11y.js can close menus on Escape',
    appliesTo: 'full',
    find: '    </sc-if>\n  </header>',
    replace: '    </sc-if>\n    <button type="button" hidden style="display:none" aria-hidden="true" tabindex="-1" aria-label="Close menu" data-a11y-bridge="close-menu" onClick="{{ closeMenu }}"></button>\n  </header>',
    applied: 'data-a11y-bridge="close-menu"',
    expect: 1
  },

  /* Date pickers (home search + package booking card) */
  {
    id: 'calendar-logic',
    description: 'Calendar cells carry a full spoken date, selected and past flags',
    appliesTo: 'full',
    find: 'label: String(d.getDate()), iso,',
    replace: 'label: String(d.getDate()), iso, sel, past, ' +
      'aria: d.toLocaleDateString(\'en-GB\', { weekday: \'long\', day: \'numeric\', month: \'long\', year: \'numeric\' }) + (past ? \', unavailable\' : \'\'),',
    applied: 'aria: d.toLocaleDateString(\'en-GB\', { weekday',
    expect: 1
  },
  {
    id: 'calendar-days',
    description: 'Calendar day buttons: full date name, pressed state, past days disabled',
    appliesTo: 'full',
    find: '<button style="{{ c.style }}" onClick="{{ c.pick }}">{{ c.label }}</button>',
    replace: '<button type="button" style="{{ c.style }}" onClick="{{ c.pick }}" aria-label="{{ c.aria }}" aria-pressed="{{ c.sel }}" disabled="{{ c.past }}" data-a11y-day>{{ c.label }}</button>',
    expect: 2
  },
  {
    id: 'calendar-weekdays-dx',
    description: 'Single-letter weekday row is visual only (each day button says its weekday)',
    appliesTo: 'full',
    find: '<div class="dx-cal-grid dx-cal-wd">',
    replace: '<div class="dx-cal-grid dx-cal-wd" aria-hidden="true">',
    expect: 1
  },
  {
    id: 'calendar-weekdays-hx',
    description: 'Same on the home search calendar',
    appliesTo: ['index.html'],
    find: 'class="hx-cal-grid hx-cal-wd"',
    replace: 'class="hx-cal-grid hx-cal-wd" aria-hidden="true"',
    expect: 1
  },

  /* Home page (index.html only renders the hx view) */
  {
    id: 'hx-search-fields',
    description: 'Home search: each field button reports whether its list is open',
    appliesTo: ['index.html'],
    find: /<button class="hx-seg-btn" onClick="\{\{ toggle(Dest|Exp|Date) \}\}">/g,
    replace: '<button type="button" class="hx-seg-btn" onClick="{{ toggle$1 }}" aria-expanded="{{ open$1List }}" data-a11y-popover-trigger>',
    applied: 'aria-expanded="{{ openDestList }}"',
    expect: 3
  },
  {
    id: 'hx-dest-options-logic',
    description: 'Destination options: a selected flag, and the two group titles marked as titles',
    appliesTo: ['index.html'],
    find: ".map(o => Object.assign({ sub: '', initial: '', pick: () => {} }, o));",
    replace: ".map(o => Object.assign({ sub: '', initial: '', pick: () => {} }, o))" +
      ".map(o => Object.assign(o, { head: o.cls === 'head', sel: o.cls === 'head' ? undefined : /(^| )sel$/.test(o.cls || '') }));",
    applied: "head: o.cls === 'head', sel:",
    expect: 1
  },
  {
    id: 'hx-dest-options',
    description: 'Destination options: pressed state; group titles are not clickable',
    appliesTo: ['index.html'],
    find: '<button class="hx-opt {{ o.cls }}" onClick="{{ o.pick }}"><span class="hx-opt-ic">',
    replace: '<button type="button" class="hx-opt {{ o.cls }}" onClick="{{ o.pick }}" aria-pressed="{{ o.sel }}" disabled="{{ o.head }}"><span class="hx-opt-ic">',
    expect: 1
  },
  {
    id: 'hx-exp-options',
    description: 'Experience options: pressed state',
    appliesTo: ['index.html'],
    find: '<button class="hx-opt {{ o.cls }}" onClick="{{ o.pick }}"><span class="hx-opt-dot"',
    replace: '<button type="button" class="hx-opt {{ o.cls }}" onClick="{{ o.pick }}" aria-pressed="{{ o.cls === \'sel\' }}"><span class="hx-opt-dot"',
    expect: 1
  },
  {
    id: 'hx-tabs',
    description: 'Trending filters: toggle buttons in a group, not tabs without tab panels',
    appliesTo: ['index.html'],
    find: '<div class="hx-tabs hx-reveal" role="tablist">',
    replace: '<div class="hx-tabs hx-reveal" role="group" aria-label="Show journeys">',
    expect: 1
  },
  {
    id: 'hx-tab',
    appliesTo: ['index.html'],
    find: '<button class="hx-tab {{ t.cls }}" onClick="{{ t.pick }}" role="tab">',
    replace: '<button type="button" class="hx-tab {{ t.cls }}" onClick="{{ t.pick }}" aria-pressed="{{ t.cls === \'on\' }}">',
    expect: 1
  },
  {
    id: 'hx-themes',
    description: 'Theme picker: same pattern',
    appliesTo: ['index.html'],
    find: '<div class="hx-themes hx-reveal hx-stagger" role="tablist">',
    replace: '<div class="hx-themes hx-reveal hx-stagger" role="group" aria-label="Travel style">',
    expect: 1
  },
  {
    id: 'hx-theme',
    appliesTo: ['index.html'],
    find: '<button class="hx-theme {{ t.cls }}" onClick="{{ t.pick }}" role="tab"',
    replace: '<button type="button" class="hx-theme {{ t.cls }}" onClick="{{ t.pick }}" aria-pressed="{{ t.cls === \'on\' }}"',
    expect: 1
  },
  {
    id: 'hx-plan-chips',
    description: 'Trip planner chips (month, budget): pressed state',
    appliesTo: ['index.html'],
    find: '<button class="hx-chip-btn {{ o.cls }}" onClick="{{ o.pick }}">',
    replace: '<button type="button" class="hx-chip-btn {{ o.cls }}" onClick="{{ o.pick }}" aria-pressed="{{ o.cls === \'on\' }}">',
    expect: 2
  },
  {
    id: 'hx-plan-pax',
    description: 'Trip planner traveller count is announced when it changes',
    appliesTo: ['index.html'],
    find: '<strong>{{ hxTpPax }}</strong>',
    replace: '<strong aria-live="polite"><span class="a11y-sr">Travellers: </span>{{ hxTpPax }}</strong>',
    expect: 1
  },
  {
    id: 'hx-faq',
    description: 'Home FAQ: question buttons report expanded; closed answers are hidden from screen readers',
    appliesTo: ['index.html'],
    find: '<button class="hx-q-btn" onClick="{{ f.toggle }}"><span>{{ f.q }}</span><i class="hx-q-ic" aria-hidden="true"></i></button>\n              <div class="hx-a">',
    replace: '<button type="button" class="hx-q-btn" onClick="{{ f.toggle }}" aria-expanded="{{ f.cls === \'open\' }}"><span>{{ f.q }}</span><i class="hx-q-ic" aria-hidden="true"></i></button>\n              <div class="hx-a" aria-hidden="{{ f.cls !== \'open\' }}">',
    expect: 1
  },
  {
    id: 'hx-seo-toggle',
    appliesTo: ['index.html'],
    find: '<button class="hx-seo-toggle" onClick="{{ hxToggleSeo }}">',
    replace: '<button type="button" class="hx-seo-toggle" onClick="{{ hxToggleSeo }}" aria-expanded="{{ hxSeoLabel === \'Show less\' }}">',
    expect: 1
  },
  {
    id: 'hx-gallery-tiles',
    description: 'Instagram gallery tiles open the photo viewer: a real (transparent) button over each tile ' +
      '(making the tile itself role=button would nest the image component\'s own controls)',
    appliesTo: ['index.html'],
    find: '<div style="{{ g.wrapStyle }}" onClick="{{ g.open }}">',
    replace: '<div style="{{ g.wrapStyle }}" onClick="{{ g.open }}"><button type="button" class="a11y-tile-btn" onClick="{{ g.open }}" aria-label="Open photo: {{ g.hint }}"></button>',
    expect: 1
  },
  {
    id: 'hx-reviews-rail',
    description: 'Reviews swipe rail (phones) can be scrolled by keyboard',
    appliesTo: ['index.html'],
    find: '<div class="rv-grid hx-reveal">',
    replace: '<div class="rv-grid hx-reveal" role="region" aria-label="Traveller reviews" tabindex="0">',
    expect: 1
  },

  /* Packages page */
  {
    id: 'px-cats-logic',
    description: 'Theme chips: a plain selected flag (their class can be "on yatra")',
    appliesTo: 'full',
    find: "cls: (s.fCat === o.c ? 'on' : '') +",
    replace: "on: s.fCat === o.c, cls: (s.fCat === o.c ? 'on' : '') +",
    expect: 1
  },
  {
    id: 'px-tablists',
    description: 'Theme and region filters: toggle-button groups, not tabs',
    appliesTo: 'full',
    find: /<div class="px-(chips|seg)" role="tablist" aria-label="(Themes|Region)">/g,
    replace: '<div class="px-$1" role="group" aria-label="$2">',
    applied: '<div class="px-chips" role="group"',
    expect: 2
  },
  {
    id: 'px-chip',
    appliesTo: 'full',
    find: '<button class="px-chip {{ c.cls }}" onClick="{{ c.pick }}" role="tab">',
    replace: '<button type="button" class="px-chip {{ c.cls }}" onClick="{{ c.pick }}" aria-pressed="{{ c.on }}">',
    expect: 1
  },
  {
    id: 'px-region',
    appliesTo: 'full',
    find: '<button class="{{ r.cls }}" onClick="{{ r.pick }}" role="tab">',
    replace: '<button type="button" class="{{ r.cls }}" onClick="{{ r.pick }}" aria-pressed="{{ r.cls === \'on\' }}">',
    expect: 1
  },
  {
    id: 'px-sort',
    description: 'Sort button reports open/closed; the menu is a group of pressed-state buttons',
    appliesTo: 'full',
    find: 'px-sort-btn {{ pxSortBtnCls }}" onClick="{{ pxToggleSort }}" aria-haspopup="listbox"',
    replace: 'px-sort-btn {{ pxSortBtnCls }}" onClick="{{ pxToggleSort }}" aria-expanded="{{ pxSortOpen }}" data-a11y-popover-trigger',
    expect: 1
  },
  {
    id: 'px-sort-menu',
    appliesTo: 'full',
    find: '<div class="px-sort-menu" role="listbox">',
    replace: '<div class="px-sort-menu" role="group" aria-label="Sort by">',
    expect: 1
  },
  {
    id: 'px-sort-opt',
    appliesTo: 'full',
    find: 'class="px-sort-opt {{ o.cls }}" onClick="{{ o.pick }}" role="option">',
    replace: 'type="button" class="px-sort-opt {{ o.cls }}" onClick="{{ o.pick }}" aria-pressed="{{ o.cls === \'on\' }}">',
    expect: 1
  },
  {
    id: 'px-sheet-sorts',
    description: 'Filter sheet (phones): sort, region and theme chips report pressed state',
    appliesTo: 'full',
    find: 'class="px-sort-opt {{ o.cls }}" onClick="{{ o.pickKeep }}">',
    replace: 'class="px-sort-opt {{ o.cls }}" onClick="{{ o.pickKeep }}" aria-pressed="{{ o.cls === \'on\' }}">',
    expect: 1
  },
  {
    id: 'px-sheet-regions',
    appliesTo: 'full',
    find: '<button class="px-rchip {{ r.cls }}" onClick="{{ r.pick }}">',
    replace: '<button type="button" class="px-rchip {{ r.cls }}" onClick="{{ r.pick }}" aria-pressed="{{ r.cls === \'on\' }}">',
    expect: 1
  },
  {
    id: 'px-sheet-themes',
    appliesTo: 'full',
    find: '<button class="px-rchip {{ c.cls }}" onClick="{{ c.pick }}">',
    replace: '<button type="button" class="px-rchip {{ c.cls }}" onClick="{{ c.pick }}" aria-pressed="{{ c.on }}">',
    expect: 1
  },

  /* Package detail */
  {
    id: 'dx-view-switch',
    description: 'Itinerary "Day by day / Full plan": toggle buttons, not tabs',
    appliesTo: 'full',
    find: '<div class="dx-seg" role="tablist">\n                  <button class="{{ dx.viewDayCls }}" onClick="{{ dx.viewDay }}" role="tab">Day by day</button>\n                  <button class="{{ dx.viewAllCls }}" onClick="{{ dx.viewAll }}" role="tab">Full plan</button>',
    replace: '<div class="dx-seg" role="group" aria-label="Itinerary view">\n                  <button type="button" class="{{ dx.viewDayCls }}" onClick="{{ dx.viewDay }}" aria-pressed="{{ dx.viewDayCls === \'on\' }}">Day by day</button>\n                  <button type="button" class="{{ dx.viewAllCls }}" onClick="{{ dx.viewAll }}" aria-pressed="{{ dx.viewAllCls === \'on\' }}">Full plan</button>',
    expect: NO_ITINERARY
  },
  {
    id: 'dx-day-stops',
    description: 'Itinerary day buttons: the current day is marked',
    appliesTo: 'full',
    find: '<button class="dx-stop {{ d.cls }}" onClick="{{ d.pick }}" aria-label="{{ d.aria }}">',
    replace: '<button type="button" class="dx-stop {{ d.cls }}" onClick="{{ d.pick }}" aria-label="{{ d.aria }}" aria-current="{{ d.cls === \'on\' }}">',
    expect: NO_ITINERARY
  },
  {
    id: 'dx-day-title-live',
    description: 'Changing day announces the new day title',
    appliesTo: 'full',
    find: '<h3>{{ dx.cur.title }}</h3>',
    replace: '<h3 aria-live="polite">{{ dx.cur.title }}</h3>',
    applied: '<h3 aria-live="polite">',
    markerFrom: 'r2-day-heading', /* round 2 adds a hidden "Day 3 of 6:" inside this heading */
    expect: NO_ITINERARY
  },
  {
    id: 'dx-faq',
    description: 'Package FAQ: expanded state, closed answers hidden from screen readers',
    appliesTo: 'full',
    find: '<button class="dx-fq-b" onClick="{{ f.toggle }}"><span>{{ f.q }}</span><i aria-hidden="true"></i></button>\n                  <div class="dx-fq-a">',
    replace: '<button type="button" class="dx-fq-b" onClick="{{ f.toggle }}" aria-expanded="{{ f.cls === \'open\' }}"><span>{{ f.q }}</span><i aria-hidden="true"></i></button>\n                  <div class="dx-fq-a" aria-hidden="{{ f.cls !== \'open\' }}">',
    expect: 1
  },
  {
    id: 'dx-more',
    appliesTo: 'full',
    find: '<button class="dx-more" onClick="{{ dx.toggleMore }}">',
    replace: '<button type="button" class="dx-more" onClick="{{ dx.toggleMore }}" aria-expanded="{{ dx.moreCls === \'open\' }}">',
    expect: 1
  },
  {
    id: 'dx-date-field',
    description: 'Booking card date field reports whether the calendar is open',
    appliesTo: 'full',
    find: '<button class="dx-field {{ dx.dateCls }}" onClick="{{ toggleDate }}">',
    replace: '<button type="button" class="dx-field {{ dx.dateCls }}" onClick="{{ toggleDate }}" aria-expanded="{{ dx.dateCls === \'on\' }}" data-a11y-popover-trigger>',
    expect: 1
  },
  {
    id: 'dx-steppers',
    description: 'Adults / children counts are announced when they change',
    appliesTo: 'full',
    find: /<b>\{\{ (adults|kids) \}\}<\/b>/g,
    replace: (m, k) => '<b aria-live="polite"><span class="a11y-sr">' + (k === 'adults' ? 'Adults' : 'Children') + ': </span>{{ ' + k + ' }}</b>',
    applied: '<span class="a11y-sr">Adults: </span>',
    expect: 2
  },
  {
    id: 'dx-chips',
    description: 'Stay style and traveller type chips: pressed state',
    appliesTo: 'full',
    find: '<button class="dx-chip {{ o.cls }}" onClick="{{ o.pick }}">',
    replace: '<button type="button" class="dx-chip {{ o.cls }}" onClick="{{ o.pick }}" aria-pressed="{{ o.cls === \'on\' }}">',
    expect: 2
  },
  {
    id: 'dx-related-img',
    description: '"You may also like" card photo repeats the title right after it: decorative',
    appliesTo: 'full',
    find: 'dx-rel-img"><img src="{{ p.photo }}" alt="{{ p.title }}"',
    replace: 'dx-rel-img"><img src="{{ p.photo }}" alt=""',
    expect: 1
  },

  /* Mobile menu lists rebuilt by the end-of-page script: real links, like motion.js */
  {
    id: 'mobile-menu-links',
    description: 'Mobile menu destination/theme entries are links, not buttons',
    appliesTo: 'full',
    find: 'return \'<li><button class="sh-mob-sub-link" data-page="\' + d[1] + \'">\' + (d[2] ? \'<img class="sx-sub-img" src="\' + d[2] + \'" alt="" loading="lazy">\' : \'\') + d[0] + \'</button></li>\';',
    replace: 'return \'<li><a class="sh-mob-sub-link" href="\' + d[1] + \'" data-page="\' + d[1] + \'">\' + (d[2] ? \'<img class="sx-sub-img" src="\' + d[2] + \'" alt="" loading="lazy">\' : \'\') + d[0] + \'</a></li>\';',
    expect: 1
  },

  /* ── Phase 4: forms and media ── */

  /* Contact enquiry form (same code on every page; it renders on contact.html) */
  {
    id: 'enq-send-logic',
    description: 'Enquiry send: works as a form submit, and each error names its field and moves focus there',
    appliesTo: 'full',
    find: /send: \(\) => \{(\s*)const \{ name, phone, email, dates, pkg \} = this\.state\.form;/,
    replace: 'send: (ev) => {$1if (ev && ev.preventDefault) ev.preventDefault();$1' +
      'const fail = (f, m) => { this.setState({ errorMsg: m, errField: f }); setTimeout(() => { const el = document.querySelector(\'[data-enq="\' + f + \'"]\'); if (el) el.focus(); }, 40); };$1' +
      'const { name, phone, email, dates, pkg } = this.state.form;',
    applied: 'const fail = (f, m) => { this.setState({ errorMsg: m, errField: f });',
    expect: 1
  },
  {
    id: 'enq-field-errors',
    description: 'Each validation message is tied to its field',
    appliesTo: 'full',
    find: /return this\.setState\(\{ errorMsg: '(Please enter (your full name|your phone number|your email address|a valid email address|a valid phone number)\.)' \}\);/g,
    replace: (m, msg, what) => "return fail('" + (/name/.test(what) ? 'name' : /phone/.test(what) ? 'phone' : 'email') + "', '" + msg + "');",
    applied: "return fail('name', 'Please enter your full name.');",
    expect: 5
  },
  {
    id: 'enq-sending-clears',
    appliesTo: 'full',
    find: "this.setState({ errorMsg: '', sending: true });",
    replace: "this.setState({ errorMsg: '', errField: '', sending: true });",
    expect: 1
  },
  {
    id: 'enq-success-focus',
    description: 'After sending, focus moves to the "Enquiry received" heading',
    appliesTo: 'full',
    find: '.then(() => this.setState({ sent: true, sending: false }),',
    replace: '.then(() => { this.setState({ sent: true, sending: false }); setTimeout(() => { const d = document.getElementById(\'enq-done\'); if (d) d.focus(); }, 60); },',
    expect: 1
  },
  {
    id: 'enq-render-vals',
    description: 'Per-field invalid flags for the template',
    appliesTo: 'full',
    find: "errorMsg: s.errorMsg || '', hasError: !!s.errorMsg,",
    replace: "errorMsg: s.errorMsg || '', hasError: !!s.errorMsg, " +
      "errName: s.errField === 'name', errPhone: s.errField === 'phone', errEmail: s.errField === 'email', " +
      "errNameId: s.errField === 'name' ? 'enq-error' : undefined, errPhoneId: s.errField === 'phone' ? 'enq-error' : undefined, errEmailId: s.errField === 'email' ? 'enq-error' : undefined,",
    expect: 1
  },
  {
    id: 'enq-reset-focus',
    description: '"Send another" clears errors and puts focus in the name field',
    appliesTo: 'full',
    find: /resetForm: \(\) => this\.setState\(\{ sent: false, form: (\{[^}]*\}) \}\),/,
    replace: 'resetForm: () => { this.setState({ sent: false, errorMsg: \'\', errField: \'\', form: $1 }); setTimeout(() => { const el = document.querySelector(\'[data-enq="name"]\'); if (el) el.focus(); }, 60); },',
    applied: "resetForm: () => { this.setState({ sent: false, errorMsg: '', errField: ''",
    expect: 1
  },
  {
    id: 'enq-form-element',
    description: 'The enquiry fields are a real <form>: Enter submits it',
    appliesTo: 'full',
    find: /<sc-if value="\{\{ notSent \}\}" hint-placeholder-val="\{\{ true \}\}">(\s*)<div>(\s*<h2 id="enquiry-form"[\s\S]*?We reply within one working day — usually much sooner\.<\/div>\s*)<\/div>(\s*)<\/sc-if>/,
    replace: '<sc-if value="{{ notSent }}" hint-placeholder-val="{{ true }}">$1<form noValidate="{{ true }}" onSubmit="{{ send }}" aria-labelledby="enquiry-form">$2</form>$3</sc-if>',
    applied: 'onSubmit="{{ send }}" aria-labelledby="enquiry-form"',
    expect: 1
  },
  {
    id: 'enq-required-note',
    description: 'Say up front what the * means',
    appliesTo: 'full',
    find: 'margin:0 0 26px;scroll-margin-top:100px;">Send an enquiry</h2>',
    replace: 'margin:0 0 26px;scroll-margin-top:100px;">Send an enquiry</h2>\n              <p style="margin:-16px 0 20px;font-size:13.5px;color:#6B655C">Fields marked * are required.</p>',
    applied: '>Fields marked * are required.</p>',
    expect: 1
  },
  {
    id: 'enq-asterisks',
    description: 'The * is visual; the fields themselves are announced as required',
    appliesTo: 'full',
    find: '<b style="color:#C4362C">*</b>',
    replace: '<b style="color:#C4362C" aria-hidden="true">*</b>',
    expect: 3
  },
  {
    id: 'enq-input-name',
    appliesTo: 'full',
    find: '<input required="{{ true }}" autoComplete="name"',
    replace: '<input data-enq="name" required="{{ true }}" aria-invalid="{{ errName }}" aria-describedby="{{ errNameId }}" autoComplete="name"',
    expect: 1
  },
  {
    id: 'enq-input-phone',
    appliesTo: 'full',
    find: '<input required="{{ true }}" type="tel"',
    replace: '<input data-enq="phone" required="{{ true }}" aria-invalid="{{ errPhone }}" aria-describedby="{{ errPhoneId }}" type="tel"',
    expect: 1
  },
  {
    id: 'enq-input-email',
    appliesTo: 'full',
    find: '<input required="{{ true }}" type="email"',
    replace: '<input data-enq="email" required="{{ true }}" aria-invalid="{{ errEmail }}" aria-describedby="{{ errEmailId }}" type="email"',
    expect: 1
  },
  {
    id: 'enq-error-id',
    appliesTo: 'full',
    find: '<div role="alert" style="display:flex;gap:10px;align-items:flex-start;background:#FDE8E4;',
    replace: '<div role="alert" id="enq-error" style="display:flex;gap:10px;align-items:flex-start;background:#FDE8E4;',
    expect: 1
  },
  {
    id: 'enq-submit-button',
    description: 'Send button submits the form (no separate click handler, so no double send)',
    appliesTo: 'full',
    find: 'style-hover="background:#C4362C" onClick="{{ send }}">{{ sendLabel }}</button>',
    replace: 'style-hover="background:#C4362C" type="submit">{{ sendLabel }}</button>',
    applied: 'type="submit">{{ sendLabel }}</button>', /* colour-independent: Phase 5 changes the hover */
    expect: 1
  },
  {
    id: 'enq-success-heading',
    description: '"Enquiry received" is a heading that receives focus',
    appliesTo: 'full',
    find: '<div style="font-family:\'Fraunces\',serif;font-size:30px;letter-spacing:-.015em;margin-bottom:10px">Enquiry received</div>',
    replace: '<h2 id="enq-done" tabindex="-1" style="font-family:\'Fraunces\',serif;font-size:30px;font-weight:400;line-height:1.2;letter-spacing:-.015em;margin:0 0 10px">Enquiry received</h2>',
    applied: '<h2 id="enq-done"', /* round 2 turns the px font size into rem */
    expect: 1
  },

  /* Home "10% off" newsletter (renders on index.html only) */
  {
    id: 'nl-home-logic',
    description: 'Newsletter: works as a form, and an invalid email gets a message instead of silence',
    appliesTo: ['index.html'],
    find: "subscribe: () => {\n        if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test((this.state.email || '').trim())) return;",
    replace: "subscribe: (ev) => {\n        if (ev && ev.preventDefault) ev.preventDefault();\n" +
      "        if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test((this.state.email || '').trim())) { this.setState({ nlError: 'Please enter a valid email address, like name@example.com.' }); setTimeout(() => { const i = document.getElementById('nl-home-email'); if (i) i.focus(); }, 40); return; }",
    applied: "nlError: 'Please enter a valid email address",
    expect: 1
  },
  {
    id: 'nl-home-vals',
    appliesTo: ['index.html'],
    find: 'email: s.email, setEmail: e => this.setState({ email: e.target.value }),',
    replace: "email: s.email, setEmail: e => this.setState({ email: e.target.value, nlError: '' }), " +
      "nlError: s.nlError || '', nlHasError: !!s.nlError, nlErrId: s.nlError ? 'nl-home-err' : undefined,",
    expect: 1
  },
  {
    id: 'nl-home-form',
    description: 'Newsletter box: a real form with a labelled email field and an error message tied to it',
    appliesTo: ['index.html'],
    find: /<div class="nl-pill" style="([^"]*)">\s*<input type="email" placeholder="Email address" value="\{\{ email \}\}" onChange="\{\{ setEmail \}\}" style="([^"]*)" \/>(\s*)<button style="([^"]*)" style-hover="([^"]*)" onClick="\{\{ subscribe \}\}" aria-label="Subscribe">([\s\S]*?)<\/button>(\s*)<\/div>/,
    replace: '<div>\n          <form class="nl-pill" noValidate="{{ true }}" onSubmit="{{ subscribe }}" style="$1">\n' +
      '            <input type="email" id="nl-home-email" aria-label="Email address" autoComplete="email" aria-invalid="{{ nlHasError }}" aria-describedby="{{ nlErrId }}" placeholder="Email address" value="{{ email }}" onChange="{{ setEmail }}" style="$2" />$3' +
      '<button type="submit" style="$4" style-hover="$5" aria-label="Subscribe">$6</button>$7</form>\n' +
      '          <sc-if value="{{ nlHasError }}" hint-placeholder-val="{{ false }}"><p id="nl-home-err" role="alert" style="margin:10px 0 0 24px;font-size:13.5px;font-weight:700;color:#9A1F17">{{ nlError }}</p></sc-if>\n          </div>',
    applied: 'id="nl-home-email"',
    expect: 1
  },
  {
    id: 'nl-home-success',
    description: 'The "you\'re on the list" confirmation is announced',
    appliesTo: ['index.html'],
    find: '<div style="font-weight:700;font-size:15.5px">You\'re on the list — your code is on its way.</div>',
    replace: '<div role="status" style="font-weight:700;font-size:15.5px">You\'re on the list — your code is on its way.</div>',
    applied: '<div role="status" style="font-weight:700;font-size:', /* round 2 turns the px size into rem */
    expect: 1
  },

  /* Footer newsletter: one handler only (two were sending every sign-up twice) */
  {
    id: 'nl-footer-dup-handler',
    description: 'Remove the older duplicate footer-newsletter submit handler',
    appliesTo: 'full',
    find: /<script>\r?\n  document\.body\.addEventListener\('submit', function\(e\) \{[\s\S]*?<\/script>\r?\n/,
    replace: '',
    applied: 'a11y: single footer newsletter handler',
    markerFrom: 'nl-footer-handler', /* done once the replacement handler (next edit) is in place */
    expect: 1
  },
  {
    id: 'nl-footer-handler',
    description: 'Footer newsletter: inline error tied to the field, honest result (no "thank you" on failure), announced',
    appliesTo: 'full',
    find: /\/\* Footer newsletter: send to our inbox without leaving the page \*\/[\s\S]*?\}\)\(\);/,
    replace: FOOTER_NL,
    applied: 'a11y: single footer newsletter handler',
    expect: 1
  },

  {
    id: 'nl-footer-novalidate',
    description: 'Footer newsletter: our handler validates (with a persistent message) instead of the browser\'s brief tooltip',
    appliesTo: 'full',
    find: '<form class="subscribe" action="https://formsubmit.co/sahapathika@gmail.com" method="POST">',
    replace: '<form class="subscribe" action="https://formsubmit.co/sahapathika@gmail.com" method="POST" noValidate="{{ true }}">',
    expect: 1
  },

  /* Media */
  {
    id: 'footer-video-motion',
    description: 'Footer background video is not loaded for visitors who ask for less motion (poster only)',
    appliesTo: 'full',
    find: "if (!document.documentElement.classList.contains('sx-ready') || v.getBoundingClientRect().top > innerHeight + 800) return;",
    replace: "if ((window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || window.__a11yReduceMotion) { if (v.dataset.poster && !v.poster) v.poster = v.dataset.poster; return; }\n" +
      "      if (!document.documentElement.classList.contains('sx-ready') || v.getBoundingClientRect().top > innerHeight + 800) return;",
    applied: "prefers-reduced-motion: reduce)').matches) || window.__a11yReduceMotion) { if (v.dataset.poster",
    expect: 1
  },
  {
    id: 'reels-autoplay-respects-pause',
    description: 'Reels autoplay skips a reel the visitor paused, and all reels while "Pause animations" is on',
    appliesTo: ['index.html'],
    find: 'if (e.isIntersecting && e.intersectionRatio >= 0.55) { if (!reduce || !v.muted) {',
    replace: 'if (e.isIntersecting && e.intersectionRatio >= 0.55) { if ((!reduce || !v.muted) && !v.hasAttribute(\'data-user-paused\') && !window.__a11yReduceMotion) {',
    expect: 1
  },
  {
    id: 'reels-pause-button',
    description: 'Each reel gets a visible Pause / Play button (WCAG 2.2.2); behaviour in a11y.js',
    appliesTo: ['index.html'],
    find: '<article class="hx-reel" style="--i:{{ $index }}">',
    replace: '<article class="hx-reel" style="--i:{{ $index }}">\n              <button type="button" class="a11y-reel-pp" data-a11y-reel-pp aria-pressed="false" aria-label="Pause video: {{ r.title }}"><span aria-hidden="true"></span></button>',
    applied: 'data-a11y-reel-pp',
    expect: 1
  },

  /* ── Phase 5: colour contrast (WCAG 1.4.3 text 4.5:1, large text 3:1; 1.4.11 icons 3:1) ──
     Only colours that sit behind or under text/icons change; decorative bars, dots and
     borders keep the original palette. Every new value was checked with the WCAG formula. */
  cc('cc-coral-var', 'Coral token used for button fills and small text: #E5483D -> #C4362C (5.37:1 under white)',
    '--coral:#E5483D;', '--coral:#C4362C;', 2, 1),
  cc('cc-sx-coral-var', 'Same for the header/menu stylesheet', '--sx-coral:#E5483D;', '--sx-coral:#C4362C;', 1, 1),
  cc('cc-coral-hover-var', 'Hover/eyebrow token one step darker so hover still changes: #C4362C -> #A82E25',
    '--coral-d:#C4362C', '--coral-d:#A82E25', 2, 1),
  cc('cc-heading-accent', 'Big italic heading accents keep the bright brand coral (large text passes at 3.66:1)',
    '.hx-h2 em { font-style:italic; font-weight:330; color:var(--coral); }',
    '.hx-h2 em { font-style:italic; font-weight:330; color:#E5483D; }', 1, 0),
  cc('cc-coral-fills', 'Hard-coded coral fills behind white text (CTAs, Plan My Trip, Send, badges)',
    /background: ?#E5483D; ?color: ?#fff\b/gi, 'background:#C4362C;color:#fff', 8, 11),
  cc('cc-coral-fill-hover', 'Their hover gets darker too', 'style-hover="background:#C4362C"', 'style-hover="background:#A82E25"', 3, 4),
  cc('cc-mob-plan-hover', 'Mobile menu "Plan My Trip" hover', '.sh-mob-plan:hover { background: #C4362C;', '.sh-mob-plan:hover { background: #A82E25;', 1, 1),
  cc('cc-since', 'Header "SINCE 2015" (8.5px): coral -> #C4362C (4.98:1)',
    'color:#E5483D;font-weight:700;line-height:1.6;max-width:74px', 'color:#C4362C;font-weight:700;line-height:1.6;max-width:74px', 1, 1),

  /* Saffron: small text and the orange end of white-text gradients -> #A45F15; large display -> #CD771B */
  cc('cc-saffron-gradients', 'Orange-to-red gradients behind white text (Call us, counts, tags, Show N journeys, step numbers)',
    'linear-gradient(135deg,#E8871E,#C4362C)', 'linear-gradient(135deg,#A45F15,#C4362C)', 7, 6),
  cc('cc-saffron-sheet-deva', 'Bottom sheet Hindi labels (15px)', /(\.sx-bs-fd \{[^}]*?)color:#E8871E;/g, '$1color:#A45F15;', 1, 1),
  cc('cc-saffron-dx-deva', 'Package page Hindi section labels (15px)', /(\.dx-deva \{[^}]*?)color:#E8871E;/g, '$1color:#A45F15;', 1, 1),
  cc('cc-saffron-hero-em', 'Hero "& everywhere beyond" (large): #CD771B (3.12:1)',
    '.hx-hero .hx-h1 em { color:#E8871E; }', '.hx-hero .hx-h1 em { color:#CD771B; }', 1, 0),
  cc('cc-saffron-trust', 'Hero trust numbers (22px on phones, so small-text rule)',
    '.hx-hero .hx-trust-item strong { color:#E8871E; }', '.hx-hero .hx-trust-item strong { color:#A45F15; }', 1, 0),
  cc('cc-saffron-empty', 'Packages "no results" glyph (42px)', /(\.px-empty-ic \{[^}]*?)color:#E8871E;/g, '$1color:#CD771B;', 1, 1),
  cc('cc-saffron-dayn', 'Itinerary big day number (large)', '.dx-day-n { color:#E8871E !important; }', '.dx-day-n { color:#CD771B !important; }', 1, 1),
  cc('cc-saffron-sort-check', 'Sort option tick (white icon on saffron, needs 3:1)',
    '.px-sort-opt.on i { background:#E8871E; border-color:#E8871E; color:#fff; }', '.px-sort-opt.on i { background:#A45F15; border-color:#A45F15; color:#fff; }', 1, 1),
  cc('cc-saffron-fbtn', 'Filter count badge (white 10px)', /(\.px-fbtn b \{[^}]*?)background:#E8871E;/g, '$1background:#A45F15;', 1, 1),

  /* Gold, green, grey */
  cc('cc-gold-text', 'Gold text (labels, kickers): #B5822A -> #8A6316 (5.42:1)', 'color:#B5822A', 'color:#8A6316', 2, (f) => f === 'package-varanasi-tour-packages-from-kerala.html' ? 5 : 4),
  cc('cc-gold-var', 'Gold token', '--gold-d:#B5822A', '--gold-d:#8A6316', 2, 1),
  cc('cc-cat-heritage', 'Category chips with white text: Heritage & Temple / Heritage',
    "'Heritage & Temple': '#B5822A', 'Heritage': '#B5822A',", "'Heritage & Temple': '#8A6316', 'Heritage': '#8A6316',", 1, 1),
  cc('cc-cat-pilgrimage', 'Category chip: Pilgrimage Yatra', "'Pilgrimage Yatra': '#B5822A'", "'Pilgrimage Yatra': '#8A6316'", 1, 1),
  cc('cc-cat-signature', 'Category chip: Signature (kept distinct from Honeymoon #C4362C)', "'Signature': '#E5483D'", "'Signature': '#A82E25'", 1, 1),
  cc('cc-mint-ink', 'Green text on mint panels: #2F7A63 -> #2D745E (4.62:1)', '#2F7A63', '#2D745E', 14, (f) => f === 'package-varanasi-tour-packages-from-kerala.html' ? 15 : 14),
  cc('cc-marquee-grey', 'Marquee text: #8E877C -> #6B655C (5.35:1)', 'color:#8E877C', 'color:#6B655C', 1, 1),
  cc('cc-whatsapp', 'WhatsApp green fills/icons with white: #1FAF55 -> #188641 (4.64:1)', '#1FAF55', '#188641', 8, 5),
  cc('cc-whatsapp-fab', 'Floating WhatsApp button (white icon needs 3:1; was 1.98)', '#25D366', '#188641', 2, 2),

  /* Page-specific */
  {
    id: 'cc-varanasi-h3',
    description: 'Varanasi guide: 18px bold coral sub-headings (below the large-text size)',
    appliesTo: ['package-varanasi-tour-packages-from-kerala.html'],
    find: 'font-size:18px;font-weight:800;margin:24px 0 12px;color:#E5483D',
    replace: 'font-size:18px;font-weight:800;margin:24px 0 12px;color:#C4362C',
    applied: CC_MARK, markerFrom: 'cc-sentinel',
    expect: 4
  },
  {
    id: 'cc-stub-links',
    description: 'Legal pages: coral link text',
    appliesTo: 'stub',
    find: 'a { color: #E5483D; text-decoration: none; }',
    replace: 'a { color: #C4362C; text-decoration: none; }',
    applied: CC_MARK, markerFrom: 'cc-sentinel',
    expect: 1
  },

  {
    id: 'cc-sentinel',
    description: 'Mark the page as colour-updated (must stay after every cc-* edit)',
    appliesTo: 'all',
    find: '</head>',
    replace: CC_MARK + '\n</head>',
    applied: CC_MARK,
    expect: 1
  },

  /* ── Phase 6: accessibility statement ── */
  {
    id: 'footer-statement-link',
    description: 'Footer "Support" column links to the accessibility statement',
    appliesTo: 'full',
    find: '<li><a href="cookies.html">Cookie Notice</a></li>',
    replace: '<li><a href="cookies.html">Cookie Notice</a></li>\n            <li><a href="accessibility.html">Accessibility</a></li>',
    applied: '<li><a href="accessibility.html">Accessibility</a></li>',
    expect: 1
  },

  /* Photo viewer */
  {
    id: 'lightbox-dialog',
    description: 'Photo viewer is a labelled modal dialog (focus handling in a11y.js)',
    appliesTo: 'full',
    find: '<div style="position:fixed;inset:0;z-index:90;background:rgba(15,22,19,.92);',
    replace: '<div role="dialog" aria-modal="true" aria-label="Photo viewer" data-a11y-lightbox style="position:fixed;inset:0;z-index:90;background:rgba(15,22,19,.92);',
    expect: 1
  },
  {
    id: 'lightbox-buttons',
    description: 'Photo viewer buttons get names',
    appliesTo: 'full',
    find: /onClick="\{\{ (closeLightbox|prevLight|nextLight) \}\}">(×|‹|›)<\/button>/g,
    replace: (m, fn, ch) => 'onClick="{{ ' + fn + ' }}" type="button" aria-label="' +
      ({ closeLightbox: 'Close photo viewer', prevLight: 'Previous photo', nextLight: 'Next photo' })[fn] +
      '" data-a11y-lb="' + ({ closeLightbox: 'close', prevLight: 'prev', nextLight: 'next' })[fn] + '">' + ch + '</button>',
    applied: 'aria-label="Close photo viewer"',
    expect: 3
  }

];

/* Colour swap on every full page: nIndex matches expected on index.html, nOthers elsewhere.
   `applied` defaults to the replacement string when it is a plain string. */
/* Colour swaps can't use their new value as a "done" marker (the new colours already occur
   elsewhere in the pages), so all of them key off one comment that the last edit adds. */
function cc(id, description, find, replace, nIndex, nOthers) {
  return {
    id: id, description: description, appliesTo: 'full', find: find, replace: replace,
    expect: (f) => f === 'index.html' ? nIndex : (typeof nOthers === 'function' ? nOthers(f) : nOthers),
    applied: CC_MARK, markerFrom: 'cc-sentinel'
  };
}

function slotAlt(slotId, src, alt) {
  return {
    id: 'alt-' + slotId,
    description: 'Photo alt text for #' + slotId,
    appliesTo: 'full',
    find: '<image-slot id="' + slotId + '" src="' + src + '"',
    replace: '<image-slot id="' + slotId + '" alt="' + alt + '" src="' + src + '"',
    expect: 1
  };
}

/* Round 2 (blind and screen-reader users) */
module.exports.push.apply(module.exports, require('./a11y-edits-r2.js'));
