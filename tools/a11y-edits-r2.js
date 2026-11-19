/*
 * Accessibility round 2 edits (blind and screen-reader users), loaded by tools/a11y-edits.js.
 * Same format as a11y-edits.js. Measured with tools/a11y-noise.js before and after
 * (see docs/a11y-baseline.md). Pages carry different sections: the home-page parts
 * exist only in index.html, the social cards only in contact.html.
 */
'use strict';

var HOME_ONLY = (n) => (f) => f === 'index.html' ? n : 0;
var CONTACT_ONLY = (n) => (f) => f === 'contact.html' ? n : 0;
var REM_MARK = '<!-- a11y: rem text v1 -->';
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
    applied: '" aria-hidden="true">&#x25BE;</span>', /* font size becomes rem in Phase 4 */
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
  },

  /* ── Round 2, Phase 2: content blind travellers can use ── */

  /* Video descriptions (WCAG 1.2.5). Drafted from still frames of each video, without
     sound: the team should check them against the videos (docs/a11y-baseline.md). */
  reelDesc('Explore the Varanasi yatra',
    'A young woman in a cream Kerala saree with a gold border and a blue blouse stands in front of a glass-fronted building. ' +
    'Smiling, with her hands joined, she sings to the camera. The whole video is this one shot.'),
  reelDesc('Browse pilgrimage yatras',
    'A woman from our team, in a dark blazer, walks slowly towards the camera in front of a wall of green ivy, talking as she goes. ' +
    'The whole video is this one shot.'),
  reelDesc('Explore Kerala holidays',
    'A presenter in a red T-shirt, sitting in a studio beside a plant and a red lamp, introduces a 7-night, 8-day fixed-departure Kerala tour. ' +
    'Between her lines the video shows: an aerial view of a road running through the backwaters; green paddy fields below hills; ' +
    'people walking a forest path in morning light; clouds rolling over the Munnar hills; the giant stone bird sculpture at Jatayu Earth\\\'s Center; ' +
    'the words \\u201CKochi to\\u201D over backwaters and paddy fields; a resort pool with the words \\u201CDeluxe double, sharing stay\\u201D; ' +
    'a banana-leaf sadhya meal; a canoe on a palm-lined canal; \\u201C2 nights Munnar, Thekkady\\u201D; \\u201CAlleppey\\u201D over misty hills; ' +
    'and a sunset over the backwaters. It ends on the Sahapathika Holidays logo with a \\u201CBook now\\u201D button.'),
  {
    id: 'r2-reel-desc-block',
    description: 'Each reel: a "Video description" disclosure under it, linked to the video',
    find: '</article>\n          </sc-for>\n          <a class="hx-reel hx-reel-more"',
    replace: '<details class="sh-vdesc"><summary>Video description</summary><p id="reel-desc-{{ $index }}">{{ r.desc }}</p></details>\n' +
      '            </article>\n          </sc-for>\n          <a class="hx-reel hx-reel-more"',
    applied: 'class="sh-vdesc"',
    expect: HOME_ONLY(1)
  },
  {
    id: 'r2-reel-describedby',
    description: 'Each reel frame is described by its video description',
    find: '<div class="hx-reel-frame" role="button" tabIndex="0" aria-label="{{ r.aria }}">',
    replace: '<div class="hx-reel-frame" role="button" tabIndex="0" aria-label="{{ r.aria }}" aria-describedby="reel-desc-{{ $index }}">',
    expect: HOME_ONLY(1)
  },

  /* Itinerary to take along: a plain text version, and a link to share on WhatsApp */
  {
    id: 'r2-itin-tools',
    description: 'Package page: "Get this itinerary as text" and "Send the link on WhatsApp" under the itinerary',
    find: '            <sc-if value="{{ detail.noItinerary }}" hint-placeholder-val="{{ false }}">',
    replace: '            <sc-if value="{{ detail.hasItinerary }}" hint-placeholder-val="{{ true }}">\n' +
      '              <div class="sh-itin-tools"><button type="button" data-a11y-itin-text>Get this itinerary as text</button>' +
      '<a href="{{ dx.shareWa }}" target="_blank" rel="noopener">Send the link on WhatsApp</a></div>\n' +
      '            </sc-if>\n' +
      '            <sc-if value="{{ detail.noItinerary }}" hint-placeholder-val="{{ false }}">',
    applied: 'data-a11y-itin-text',
    expect: NO_ITINERARY
  },
  {
    id: 'r2-itin-share-link',
    description: 'Logic: WhatsApp share text for the itinerary link',
    find: "        waItin: wa(",
    replace: "        shareWa: 'https://wa.me/?text=' + encodeURIComponent(p.title + ' — day-by-day itinerary from Sahapathika Holidays: ' + (typeof location !== 'undefined' ? location.origin + location.pathname : '')),\n        waItin: wa(",
    applied: "shareWa: 'https://wa.me/?text='",
    expect: 1
  },
  {
    id: 'r2-inc-headings',
    description: '"Included" / "Not included" are headings; their ✓ ✕ marks are not read',
    find: /<div class="dx-inc-h"><span>(✓|✕)<\/span>/g,
    replace: '<div class="dx-inc-h" role="heading" aria-level="3"><span aria-hidden="true">$1</span>',
    applied: '<div class="dx-inc-h" role="heading" aria-level="3">',
    expect: 2
  },

  /* Tell us your access needs: enquiry form + a link from the booking card */
  {
    id: 'r2-access-field',
    description: 'Enquiry form: optional "Any access needs?" checkboxes',
    find: '<label style="display:block;margin-bottom:24px"><span style="{{ labelStyle }}">Message</span>',
    replace: '<fieldset id="enq-access" class="sh-access"><legend style="{{ labelStyle }}">Any access needs? <span class="sh-access-opt-l">(optional)</span></legend>' +
      '<div class="sh-access-opts"><sc-for list="{{ accessOpts }}" as="o" hint-placeholder-count="6"><label class="sh-access-opt"><input type="checkbox" checked="{{ o.on }}" onChange="{{ o.toggle }}" /><span>{{ o.label }}</span></label></sc-for></div>' +
      '<p class="sh-access-note">Tell us, and we\'ll talk through what\'s possible on your trip.</p></fieldset>\n' +
      '              <label style="display:block;margin-bottom:24px"><span style="{{ labelStyle }}">Message</span>',
    applied: 'id="enq-access"',
    expect: 1
  },
  {
    id: 'r2-access-logic',
    description: 'Logic: access-needs options and toggles',
    find: '      setMessage: e => this.setState({ form: Object.assign({}, s.form, { message: e.target.value }) }),',
    replace: '      setMessage: e => this.setState({ form: Object.assign({}, s.form, { message: e.target.value }) }),\n' +
      "      accessOpts: ['Blind', 'Low vision', 'Deaf or hard of hearing', 'Wheelchair user or limited walking', 'Senior travellers who need a gentle pace', 'Something else (say in your message)'].map(l => ({\n" +
      '        label: l, on: (s.form.access || []).indexOf(l) >= 0,\n' +
      '        toggle: () => { const a = this.state.form.access || []; this.setState({ form: Object.assign({}, this.state.form, { access: a.indexOf(l) >= 0 ? a.filter(x => x !== l) : a.concat(l) }) }); }\n' +
      '      })),',
    applied: 'accessOpts: [',
    expect: 1
  },
  {
    id: 'r2-access-send',
    description: 'Logic: access needs are sent with the enquiry email',
    find: '            message: this.state.form.message,\n',
    replace: "            message: this.state.form.message,\n            access_needs: (this.state.form.access || []).join(', ') || 'None given',\n",
    applied: 'access_needs: (this.state.form.access',
    expect: 1
  },
  {
    id: 'r2-access-link',
    description: 'Booking card: "Tell us about any access needs" link to the enquiry form',
    find: '<a class="dx-btn dx-btn-line dx-btn-full" href="{{ dx.mailLink }}">Send an email enquiry</a>',
    replace: '<a class="dx-btn dx-btn-line dx-btn-full" href="{{ dx.mailLink }}">Send an email enquiry</a>\n' +
      '            <a class="sh-access-link" href="{{ dx.mailLink }}#enq-access">Tell us about any access needs</a>',
    applied: 'class="sh-access-link"',
    expect: 1
  },

  /* "Accessibility on this trip": an empty, hidden slot after "What's included". a11y/a11y.js
     fills and shows it from data/trip-access.json, only for packages the team has answered
     the questionnaire for (docs/trip-accessibility-questionnaire.md). */
  {
    id: 'r2-trip-access-slot',
    description: 'Package page: hidden "Accessibility on this trip" slot, filled from data/trip-access.json',
    find: '          <div class="dx-sec" id="dx-map">',
    replace: '          <div class="dx-sec sh-trip-access" id="dx-access" hidden="{{ true }}"></div>\n\n          <div class="dx-sec" id="dx-map">',
    applied: 'id="dx-access"',
    expect: 1
  },

  /* ── Round 2, Phase 4: low vision ──
     Font sizes in rem instead of px, so text follows the visitor's own browser or phone
     font-size setting (WCAG 1.4.4). The site sets no root size, so 1rem = 16px and nothing
     changes at default settings. Line-heights are already unitless. clamp() sizes are left
     alone. The rem edit must stay before its sentinel. */
  {
    id: 'r2-rem-text',
    description: 'Font sizes: px → rem (follows the browser font-size setting)',
    appliesTo: 'all',
    find: /font-size:(\s?)(\d*\.?\d+)px/g,
    replace: (m, sp, n) => 'font-size:' + sp + (+(n / 16).toFixed(6)) + 'rem',
    applied: REM_MARK, markerFrom: 'r2-rem-sentinel',
    expect: { min: 1 }
  },
  {
    id: 'r2-rem-sentinel',
    description: 'Marks pages whose font sizes are in rem',
    appliesTo: 'all',
    find: '</head>',
    replace: REM_MARK + '\n</head>',
    applied: REM_MARK,
    expect: 1
  }
];

/* Adds a description to one reel's data, found by its unique call-to-action text */
function reelDesc(cta, text) {
  return {
    id: 'r2-reel-desc-' + cta.split(' ').pop().toLowerCase(),
    description: 'Reel data: video description for "' + cta + '"',
    find: "cta: '" + cta + "' }",
    replace: "cta: '" + cta + "', desc: '" + text + "' }",
    applied: "cta: '" + cta + "', desc:",
    expect: HOME_ONLY(1)
  };
}
