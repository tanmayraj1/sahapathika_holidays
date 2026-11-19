/*
 * Accessibility round 2 edits (blind and screen-reader users), loaded by tools/a11y-edits.js.
 * Same format as a11y-edits.js. Measured with tools/a11y-noise.js before and after
 * (see docs/a11y-baseline.md). Pages carry different sections: the home-page parts
 * exist only in index.html, the social cards only in contact.html.
 */
'use strict';

var HOME_ONLY = (n) => (f) => f === 'index.html' ? n : 0;
var CONTACT_ONLY = (n) => (f) => f === 'contact.html' ? n : 0;
var NO_ITINERARY = (f) => f === 'package-varanasi-tour-packages-from-kerala.html' ? 0 : 1;
var SOCIAL = {
  instagram: 'Instagram, @sahapathika_holidays',
  facebook: 'Facebook, sahapathika',
  threads: 'Threads, @sahapathika_holidays',
  youtube: 'YouTube, @sahapathikateam8537'
};

module.exports = [

  /* ── Round 2, Phase 1: a quiet, fast page for screen readers ── */

  /* Header: the logo link repeats the "Home" link right after it; keep one stop */
  {
    id: 'r2-logo-link',
    description: 'Header logo link: out of the Tab order and hidden (the Home link follows it)',
    find: '<a href="index.html" onClick="{{ goHome }}" style="display:flex;align-items:center;gap:14px;cursor:pointer;flex:0 0 auto;text-decoration:none;color:inherit;">',
    replace: '<a href="index.html" onClick="{{ goHome }}" tabIndex="-1" aria-hidden="true" style="display:flex;align-items:center;gap:14px;cursor:pointer;flex:0 0 auto;text-decoration:none;color:inherit;">',
    expect: 1
  },
  {
    id: 'r2-nav-chevrons',
    description: 'Header menu arrows (▾) are not read; "Packages 26" reads "Packages, 26 journeys"',
    find: /(Destinations |Packages <span class="sx-nav-count">\{\{ sxPkgCount \}\}<\/span>)<span style="font-size:10px">&#x25BE;<\/span>/g,
    replace: (m, lead) => (lead.indexOf('Packages') === 0
      ? 'Packages <span class="sx-nav-count"><span class="a11y-sr">, </span>{{ sxPkgCount }}<span class="a11y-sr"> journeys</span></span>'
      : lead) + '<span style="font-size:10px" aria-hidden="true">&#x25BE;</span>',
    applied: '<span style="font-size:10px" aria-hidden="true">&#x25BE;</span>',
    expect: 2
  },
  {
    id: 'r2-nav-current',
    description: 'Header links say which page you are on (aria-current)',
    find: /style="\{\{ nav(Home|Pkg|About|Contact)Style \}\}"/g,
    replace: (m, k) => m + ' aria-current="{{ ' + ({ Home: 'isHome', Pkg: 'isPackages', About: 'isAbout', Contact: 'isContact' })[k] + ' }}"',
    applied: 'aria-current="{{ isHome }}"',
    expect: 4
  },
  {
    id: 'r2-crumbs-packages',
    description: 'Packages breadcrumb: slashes not read, current page marked',
    find: '<a href="index.html">Home</a><span>/</span><b>Packages</b></nav>',
    replace: '<a href="index.html">Home</a><span aria-hidden="true">/</span><b aria-current="page">Packages</b></nav>',
    expect: 1
  },
  {
    id: 'r2-crumbs-detail',
    description: 'Package breadcrumb: slashes not read, current page marked',
    find: '<a href="index.html">Home</a><span>/</span><a href="packages.html">Packages</a><span>/</span><b>{{ detail.title }}</b></nav>',
    replace: '<a href="index.html">Home</a><span aria-hidden="true">/</span><a href="packages.html">Packages</a><span aria-hidden="true">/</span><b aria-current="page">{{ detail.title }}</b></nav>',
    expect: 1
  },
  {
    id: 'r2-deva-kickers',
    description: 'Decorative Hindi kickers (॥ यात्रा ॥) that repeat an English heading are not read',
    find: / class="(sx-promo-deva|hx-deva|hx-arch-deva|hx-festc-deva|px-deva|px-yatra|dx-deva|dx-book-deva)" lang="(hi|sa)">/g,
    replace: ' class="$1" lang="$2" aria-hidden="true">',
    applied: 'class="px-yatra" lang="hi" aria-hidden="true"',
    expect: (f) => f === 'index.html' ? 19 : (f === 'package-varanasi-tour-packages-from-kerala.html' ? 13 : 14)
  },
  {
    id: 'r2-arrows',
    description: 'Arrows at the end of link text (→) are not read',
    find: / →<\/(em|span|a)>/g,
    replace: ' <span aria-hidden="true">→</span></$1>',
    applied: 'Explore yatras <span aria-hidden="true">→</span>',
    expect: (f) => f === 'index.html' ? 12 : 9
  },

  /* Package cards: one stop per card (the title); photo and "View" stay clickable by mouse */
  {
    id: 'r2-card-media',
    description: 'Card photo links: mouse only (the title link is the one stop)',
    find: /<a class="(hx-card-media|px-card-media)" href="\{\{ p\.href \}\}">/g,
    replace: '<a class="$1" href="{{ p.href }}" tabIndex="-1" aria-hidden="true">',
    applied: '<a class="px-card-media" href="{{ p.href }}" tabIndex="-1" aria-hidden="true">',
    expect: (f) => f === 'index.html' ? 2 : 1
  },
  {
    id: 'r2-card-view',
    description: 'Card "View" links: mouse only (same page as the title link)',
    find: /<a class="(hx-view|px-view)" href="\{\{ p\.href \}\}">/g,
    replace: '<a class="$1" href="{{ p.href }}" tabIndex="-1" aria-hidden="true">',
    applied: '<a class="px-view" href="{{ p.href }}" tabIndex="-1" aria-hidden="true">',
    expect: (f) => f === 'index.html' ? 2 : 1
  },
  {
    id: 'r2-card-region',
    description: 'Card region line is read after the title instead (see r2-card-facts)',
    find: /<div class="(hx-card-region|px-card-reg)">/g,
    replace: '<div class="$1" aria-hidden="true">',
    applied: '<div class="px-card-reg" aria-hidden="true">',
    expect: (f) => f === 'index.html' ? 2 : 1
  },
  {
    id: 'r2-card-facts',
    description: 'After each card title: "6 Days 5 Nights, North India, Hill & Backwater."',
    find: /<div class="(hx-feats|px-feats)">/g,
    replace: '<p class="a11y-sr">{{ p.dur }}, {{ p.region }}, {{ p.cat }}.</p><div class="$1">',
    applied: '<p class="a11y-sr">{{ p.dur }}, {{ p.region }}, {{ p.cat }}.</p><div class="px-feats">',
    expect: (f) => f === 'index.html' ? 2 : 1
  },
  {
    id: 'r2-card-wa',
    description: 'Card WhatsApp buttons name their package',
    find: /<a class="(hx-wa|px-wa)" href="\{\{ p\.wa \}\}" target="_blank" rel="noopener" aria-label="Get a quote on WhatsApp">/g,
    replace: '<a class="$1" href="{{ p.wa }}" target="_blank" rel="noopener" aria-label="Get a quote for {{ p.title }} on WhatsApp">',
    applied: 'aria-label="Get a quote for {{ p.title }} on WhatsApp"',
    expect: (f) => f === 'index.html' ? 2 : 1
  },

  /* Whole-card links: title first, photos not described twice */
  {
    id: 'r2-dest-img',
    description: 'Home destination tiles: photo not described twice',
    find: '<img src="{{ d.img }}" alt="{{ d.name }}" loading="lazy" /></sc-if>',
    replace: '<img src="{{ d.img }}" alt="" loading="lazy" /></sc-if>',
    expect: HOME_ONLY(1)
  },
  {
    id: 'r2-dest-order',
    description: 'Home destination tiles: "Himachal, Shimla · Manali, 5 journeys"',
    find: '<span class="hx-dest-kicker">{{ d.kicker }}</span>\n                <span class="hx-dest-name">{{ d.name }}</span>',
    replace: '<span class="hx-dest-kicker" aria-hidden="true">{{ d.kicker }}</span>\n                <span class="hx-dest-name">{{ d.name }}<span class="a11y-sr">, {{ d.kicker }},</span></span>',
    expect: HOME_ONLY(1)
  },
  {
    id: 'r2-arch-img',
    description: 'Home yatra tiles: photo not described twice',
    find: '<img src="{{ t.img }}" alt="{{ t.name }}" loading="lazy" />',
    replace: '<img src="{{ t.img }}" alt="" loading="lazy" />',
    expect: HOME_ONLY(1)
  },
  {
    id: 'r2-tcard',
    description: 'Home theme cards: photo not described twice; length and region read after the title',
    find: '<span class="hx-tcard-img"><img src="{{ p.photo }}" alt="{{ p.title }}" loading="lazy" /></span>\n                <span class="hx-tcard-body">\n                  <span class="hx-tcard-top">',
    replace: '<span class="hx-tcard-img"><img src="{{ p.photo }}" alt="" loading="lazy" /></span>\n                <span class="hx-tcard-body">\n                  <span class="hx-tcard-top" aria-hidden="true">',
    expect: HOME_ONLY(1)
  },
  {
    id: 'r2-tcard-facts',
    description: 'Home theme cards: "Shimla Manali, 6 Days 5 Nights, North India."',
    find: '<span class="hx-tcard-title">{{ p.title }}</span>',
    replace: '<span class="hx-tcard-title">{{ p.title }}<span class="a11y-sr">, {{ p.dur }}, {{ p.region }}.</span></span>',
    expect: HOME_ONLY(1)
  },
  {
    id: 'r2-fest',
    description: 'Festival cards: festival name first',
    find: '<span class="hx-festc-top">',
    replace: '<span class="hx-festc-top" aria-hidden="true">',
    expect: HOME_ONLY(1)
  },
  {
    id: 'r2-fest-when',
    description: 'Festival cards: "Deepavali, Oct – Nov This season,"',
    find: '<span class="hx-festc-name">{{ f.name }}</span>',
    replace: '<span class="hx-festc-name">{{ f.name }}<span class="a11y-sr">, {{ f.when }} {{ f.tag }},</span></span>',
    expect: HOME_ONLY(1)
  },
  {
    id: 'r2-related',
    description: '"You may also like": title, length, region, theme',
    find: '<span class="dx-rel-cat" style="{{ p.catBg }}">{{ p.cat }}</span></span>\n              <span class="dx-rel-b"><strong>{{ p.title }}</strong><small>{{ p.dur }} · {{ p.region }}</small>',
    replace: '<span class="dx-rel-cat" style="{{ p.catBg }}" aria-hidden="true">{{ p.cat }}</span></span>\n              <span class="dx-rel-b"><strong>{{ p.title }}</strong><small>{{ p.dur }}<span class="a11y-sr">,</span><span aria-hidden="true"> ·</span> {{ p.region }}<span class="a11y-sr">, {{ p.cat }}.</span></small>',
    expect: 1
  },

  /* Package page */
  {
    id: 'r2-gallery',
    description: 'Package photos: one "All photos" button instead of three identical stops',
    find: /<button class="dx-g dx-g(1|2|3)" onClick="\{\{ openGallery \}\}" aria-label="Open photo gallery">/g,
    replace: (m, n) => n === '3'
      ? '<button class="dx-g dx-g3" onClick="{{ openGallery }}" aria-label="All photos, open gallery">'
      : '<button class="dx-g dx-g' + n + '" onClick="{{ openGallery }}" tabIndex="-1" aria-hidden="true">',
    applied: 'aria-label="All photos, open gallery"',
    expect: 3
  },
  {
    id: 'r2-review-star',
    description: 'Review box star icon is not read',
    find: '<div class="dx-review-ic">★</div>',
    replace: '<div class="dx-review-ic" aria-hidden="true">★</div>',
    expect: 1
  },
  {
    id: 'r2-stay-words',
    description: 'Stay style "3★ – 4★" becomes "3 to 4 star" (read as words)',
    find: "['Comfort', '3★ – 4★']",
    replace: "['Comfort', '3 to 4 star']",
    expect: 1
  },
  {
    id: 'r2-day-heading',
    description: 'Day-by-day heading says "Day 3 of 6:" (announced when the day changes)',
    find: '<h3 aria-live="polite">{{ dx.cur.title }}</h3>',
    replace: '<h3 aria-live="polite"><span class="a11y-sr">Day {{ dx.cur.n }} of {{ dx.nTotal }}: </span>{{ dx.cur.title }}</h3>',
    expect: NO_ITINERARY
  },
  {
    id: 'r2-day-side',
    description: 'Day-by-day side number is not read twice',
    find: '<div class="dx-day-side">',
    replace: '<div class="dx-day-side" aria-hidden="true">',
    expect: NO_ITINERARY
  },
  {
    id: 'r2-day-total',
    description: 'Logic: number of days for the heading',
    find: 'days, cur: curDay, nPad:',
    replace: 'days, cur: curDay, nTotal: String(n), nPad:',
    expect: 1
  },
  {
    id: 'r2-full-plan-headings',
    description: 'Full plan: each day is a heading, "Day 1: Delhi to Shimla"',
    find: '<span class="dx-all-n">{{ d.num }}</span>\n                      <div class="dx-all-b">\n                        <h4>{{ d.title }}</h4>',
    replace: '<span class="dx-all-n" aria-hidden="true">{{ d.num }}</span>\n                      <div class="dx-all-b">\n                        <h4><span class="a11y-sr">Day {{ d.n }}: </span>{{ d.title }}</h4>',
    expect: NO_ITINERARY
  },

  /* Booking card: dates can be typed instead of picked from the calendar */
  {
    id: 'r2-date-typed-field',
    description: 'Booking card: "Or type your dates" text field under the date picker',
    find: '<button class="dx-cal-flex" onClick="{{ dx.flexDate }}">I\'m flexible with dates</button>\n                </div>\n              </sc-if>',
    replace: '<button class="dx-cal-flex" onClick="{{ dx.flexDate }}">I\'m flexible with dates</button>\n                </div>\n              </sc-if>\n' +
      '              <label class="sh-date-type"><span>Or type your dates</span><input type="text" value="{{ dx.dateTyped }}" onChange="{{ dx.setDateTyped }}" placeholder="e.g. 12 to 18 December, or around Diwali" autoComplete="off" data-a11y-date-typed /></label>',
    applied: 'class="sh-date-type"',
    expect: 1
  },
  {
    id: 'r2-date-typed-logic',
    description: 'Logic: typed dates fill the date field, summary, WhatsApp and email enquiry',
    find: "    const stay = s.dxStay || '', type = s.dxType || '';\n    const filled = [!!s.date, true, !!stay, !!type]",
    replace: "    const typedDates = (s.dxDateTyped || '').trim();\n" +
      "    if (!s.date && typedDates) { dateMain = typedDates; dateSub = 'Dates typed in'; dateText = typedDates; }\n" +
      "    const stay = s.dxStay || '', type = s.dxType || '';\n    const filled = [!!(s.date || typedDates), true, !!stay, !!type]",
    applied: 'const typedDates =',
    expect: 1
  },
  {
    id: 'r2-date-typed-summary',
    description: 'Logic: summary uses typed dates',
    find: "(s.date ? 'from ' + dateText : 'dates flexible')",
    replace: "(s.date ? 'from ' + dateText : (typedDates ? 'dates: ' + typedDates : 'dates flexible'))",
    expect: 1
  },
  {
    id: 'r2-date-typed-wa',
    description: 'Logic: WhatsApp message uses typed dates',
    find: "'• Start date: ' + (s.date ? dateText : 'Flexible')",
    replace: "'• Start date: ' + ((s.date || typedDates) ? dateText : 'Flexible')",
    expect: 1
  },
  {
    id: 'r2-date-typed-mail',
    description: 'Logic: email enquiry uses typed dates',
    find: "'&dates=' + encodeURIComponent(s.date ? dateText : '')",
    replace: "'&dates=' + encodeURIComponent((s.date || typedDates) ? dateText : '')",
    expect: 1
  },
  {
    id: 'r2-date-typed-state',
    description: 'Logic: typed-dates value and handler; "I\'m flexible" clears it',
    find: "        dateMain, dateSub,\n        flexDate: () => this.setState({ date: null, field: null }),",
    replace: "        dateMain, dateSub,\n        dateTyped: s.dxDateTyped || '', setDateTyped: e => this.setState({ dxDateTyped: e.target.value }),\n" +
      "        flexDate: () => this.setState({ date: null, field: null, dxDateTyped: '' }),",
    applied: 'setDateTyped: e =>',
    expect: 1
  },

  /* Packages page: the results count is announced; results have a jump target */
  {
    id: 'r2-results-status',
    description: 'Packages: "10 journeys match your search" is announced after each change',
    find: '<p><strong>{{ pxCount }}</strong> {{ pxCountLabel }}</p>',
    replace: '<p role="status"><strong>{{ pxCount }}</strong> {{ pxCountLabel }}</p>',
    expect: 1
  },
  {
    id: 'r2-results-target',
    description: 'Packages: "Skip to results" target',
    find: '<h2 class="a11y-sr">Packages</h2>',
    replace: '<h2 class="a11y-sr" id="px-results">Packages</h2>',
    expect: 1
  },

  /* Names start with the visible words (WCAG 2.5.3); specific link text */
  {
    id: 'r2-call-name',
    description: 'Mobile "Call us" button: name starts with its visible words',
    find: 'aria-label="Call Sahapathika Holidays on +91 90727 69547">\' + ic.phone + \'<span>Call us</span>',
    replace: 'aria-label="Call us, +91 90727 69547">\' + ic.phone + \'<span>Call us</span>',
    expect: 1
  },
  {
    id: 'r2-contact-socials',
    description: 'Contact page social cards read their visible name and handle',
    find: /class="cx-s cx-s-(instagram|facebook|threads|youtube)" (href="[^"]+" target="_blank" rel="noopener") aria-label="Sahapathika Holidays on [A-Za-z]+"/g,
    replace: (m, k, rest) => 'class="cx-s cx-s-' + k + '" ' + rest + ' aria-label="' + SOCIAL[k] + '"',
    applied: 'aria-label="Instagram, @sahapathika_holidays"',
    expect: CONTACT_ONLY(4)
  },
  {
    id: 'r2-seo-more',
    description: 'Home "Read more" says what it opens',
    find: "hxSeoLabel: s.hxSeo ? 'Show less' : 'Read more',",
    replace: "hxSeoLabel: s.hxSeo ? 'Show less' : 'Read more about us',",
    expect: HOME_ONLY(1)
  },

  /* Words glued together in names ("Trending11", "DestinationAny destination") */
  {
    id: 'r2-pick-tabs',
    description: 'Home journey tabs read "Kashmir, 4 journeys" instead of "Kashmir4"',
    find: '{{ t.label }}<small>{{ t.count }}</small></button>',
    replace: '{{ t.label }}<small><span class="a11y-sr">, </span>{{ t.count }}<span class="a11y-sr"> journeys</span></small></button>',
    expect: HOME_ONLY(1)
  },
  {
    id: 'r2-hero-fields',
    description: 'Home search fields read "Destination: Any destination"',
    find: /<small>(Destination|Experience|Travel date)<\/small><strong>/g,
    replace: '<small>$1</small><span class="a11y-sr">: </span><strong>',
    applied: '<small>Destination</small><span class="a11y-sr">: </span>',
    expect: HOME_ONLY(3)
  },

  /* Page change: say where we're going during the 200 ms wipe */
  {
    id: 'r2-go-announce',
    description: 'Logic: "Opening Shimla Manali…" is announced before the page changes',
    find: '      this.setState({ wiping: true, menu: null, field: null });',
    replace: "      if (window.SHA11y && window.SHA11y.announce) window.SHA11y.announce('Opening ' + (page === 'detail' ? ((this.packages || []).find(x => extra && x.slug === extra.slug) || { title: 'the package' }).title : ({ home: 'the home page', packages: 'all packages', about: 'About us', contact: 'Contact us' })[page] || 'the page') + '…');\n" +
      '      this.setState({ wiping: true, menu: null, field: null });',
    applied: "window.SHA11y.announce('Opening '",
    expect: 1
  }
];
