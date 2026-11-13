# Accessibility baseline — before any fixes

Measured 2026-11-13 on commit `3831551` (unchanged `main`). This is the "before" picture for [ACCESSIBILITY-PLAN.md](ACCESSIBILITY-PLAN.md). Every later phase is compared against it.

- **Standard used:** WCAG 2.2 AA. The project states no rule of its own.
- **Tool:** axe-core 4.10.2 (rule tags `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa, best-practice`).
- **Setup:** pages served locally (`python -m http.server 8080`, see `.claude/launch.json`) and opened in a Chromium browser pane. Each was measured about 2.5 s after load, once the app had rendered and the preloader was gone.

> axe only finds what can be checked automatically, roughly a third of real barriers. The keyboard and manual findings further down are just as important. "Incomplete" means axe could not decide, e.g. text over a photo or gradient, and a person has to check it.

## 1. axe-core results

> **Counts move with timing.** axe skips text that is still fading in, so a scan taken before or after the home page's reveal animations finish reports a different number of colour-contrast hits for the same page. For example, the home page showed 3 on one run and 11 on another; the extra 8 were all failing pairs listed in section 4. Compare rule IDs and elements, not raw counts.

| Page | Width | Serious | Moderate | Incomplete | Passed rules |
|---|---|---|---|---|---|
| index.html | desktop | color-contrast ×3, link-name ×1 | region ×2 | color-contrast ×56, video-caption ×3 | 53 |
| index.html | 375 px | color-contrast ×7, link-name ×1, scrollable-region-focusable ×1 | region ×2 | aria-hidden-focus ×1, color-contrast ×67, link-in-text-block ×1, video-caption ×3 | 53 |
| packages.html | desktop | aria-hidden-focus ×1, color-contrast ×2, link-name ×1 | heading-order ×1, region ×2 | color-contrast ×24 | 49 |
| package-shimla-manali.html | desktop | aria-hidden-focus ×1, color-contrast ×11, link-name ×1 | landmark-complementary-is-top-level ×1, region ×2 | color-contrast ×31, frame-tested ×1 | 52 |
| package-kerala-ayurveda-wellness-retreat.html | desktop | aria-hidden-focus ×1, color-contrast ×12, link-name ×1 | landmark-complementary-is-top-level ×1, region ×2 | color-contrast ×32, frame-tested ×1 | 52 |
| about.html | desktop | aria-hidden-focus ×1, color-contrast ×2, link-name ×1 | region ×2 | color-contrast ×3, link-in-text-block ×1 | 43 |
| contact.html | desktop | aria-hidden-focus ×1, color-contrast ×2, frame-title ×2, link-name ×1 | region ×2 | color-contrast ×3, frame-tested ×2 | 43 |
| privacy.html (stub) | desktop | color-contrast ×1, html-has-lang ×1 | landmark-one-main ×1, region ×1 | — | 13 |

**What the repeated violations are:**

| Rule | Where | Plan phase |
|---|---|---|
| `link-name` (every full page) | The header "Plan My Trip" is a `<button>` nested inside an `<a href="contact.html">` with `display:contents`, so the link has no name. | 3: unwrap button-in-link |
| `aria-hidden-focus` (every page except home desktop) | `#sh-mobile-nav`: the closed drawer is `aria-hidden="true"` but its links and buttons can still be focused. | 3: `inert` while closed |
| `region` (every full page) | The floating `#sx-call` button and one link sit outside any landmark. | 2/3 |
| `color-contrast` | The "SINCE 2015" tag, marquee items, the active filter-chip count, `.dx-tabs-cta`, `.cx-btn-p` (white on coral), and the package-page info rows. | 5 |
| `frame-title` (contact) | The two office map `<iframe>`s have no `title`. | 2 |
| `heading-order` (packages) | Package-card titles jump to `h3` with no `h2` before them. | 2 |
| `landmark-complementary-is-top-level` (package pages) | The booking `<aside>` is nested inside `<main>`. | 2 |
| `scrollable-region-focusable` (index, mobile) | The `.rv-grid` reviews swipe rail can't be scrolled by keyboard. | 3 |
| `html-has-lang`, `landmark-one-main` (legal stubs) | No `lang`, no `<main>`. | 2 |
| `video-caption` (index) | The three reels (`videos/moment-0x.mp4`) have no captions track. | 4 |

## 2. Keyboard (real Tab presses, home page)

- **262 focusable elements; 79 are invisible but still focusable.** Most are the closed mobile drawer's copies of the nav (Home, Destinations, Packages, About…). A keyboard user tabs through all 79 with nothing visible on screen.
- **There's no skip link.** The first Tab goes to "SINCE 2015" and the social icons, then the menu, before any content.
- **The focus ring is the browser's thin default** (`outline: auto`, about 0.7 px, gold-orange). It is faint on the cream background and is turned off entirely on several inputs (`outline:none`).
- **Three inputs have no accessible name** (hero search input, newsletter inputs): placeholder only.

## 3. Manual audit findings (from reading the code)

These are not caught by axe. Each one has a fix in the plan.

- **Hover-only controls:** the mega-menus open on hover only, with no `aria-expanded` and no Escape.
- **Popovers and accordions:** the hero search popovers and the FAQ and itinerary accordions have no `aria-expanded`. Closed accordion answers stay in the screen-reader tree.
- **Date picker:** day buttons are bare numbers, and the selected day is shown by colour only.
- **Lightbox:** the × ‹ › buttons have no labels, and there is no Escape, focus trap or focus return.
- **Dialogs without focus handling:** the mobile drawer, bottom sheet and mobile search sheet have no focus trap or focus return.
- **Photos have no text alternative:** `image-slot.js` always renders `<img alt="">`, so about-page photos, the gallery and lightbox images have none.
- **Clickable divs:** gallery tiles and featured cards are clickable divs, unreachable by keyboard.
- **Contact form:**
  - It is not a `<form>`, so Enter does not submit.
  - Errors are one message at a time, with no `aria-invalid` or `aria-describedby`.
  - The `*` required marker is visual only.
- **Footer newsletter:** has two submit handlers, so one signup can POST twice.
- **Videos:** the reels and footer video autoplay with no pause control. The footer video ignores reduced motion.
- **Hard-px text:** almost all text is in hard `px` (about 400 declarations), so browser text-only resizing does little.

## 4. Contrast pairs that fail (small text, WCAG 1.4.3 needs 4.5:1)

| Pair | Ratio |
|---|---|
| Coral `#E5483D` on cream `#FAF6EF` | 3.66 |
| White on coral `#E5483D` (buttons) | 3.94 |
| Gold `#B5822A` on white (11 px labels) | 3.39 |
| Saffron `#E8871E` on cream | 2.46 |
| Mint `#5FA98C` on cream | 2.59 |
| White on WhatsApp green `#25D366` | 1.98 |
| Coral on mint `#DCEEE7` | 3.27 |
| Marquee grey `#8E877C` on cream | 3.30 |
| `#C4362C` on mint `#DCEEE7` | 4.45 |
| Mint ink `#2F7A63` on mint `#DCEEE7` | 4.26 |

Pairs that pass: `#C4362C` on cream (4.98), muted `#6B655C` on cream (5.35), `#3A4A44` on cream (8.69), ink on cream (15.36).

## Not measured

- **Lighthouse:** the `lighthouse` CLI is not installed here; running it means downloading the npm package. It can also be run from Chrome DevTools → Lighthouse. HANDOFF.md sets the target at ≥ 95.
- **Screen-reader behaviour:** NVDA or VoiceOver, a manual step for later phases.
- **Pages not run:** the other 26 package pages share the template with the two measured, so they are expected to match. They will be spot-checked after fixes.

Only the criteria listed above were checked; this is not a full WCAG 2.2 conformance review.

## Re-running this baseline

1. Start the `site` preview (`.claude/launch.json`).
2. On each page, wait about 2.5 s, load `https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js`, then run `axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice'] } })`.

---

## Progress log

### After Phase 2 (foundations) — 2026-11-13

Same axe-core 4.10.2 run, same pages, desktop.

| Page | Violations left | Phase that fixes them |
|---|---|---|
| index.html | aria-hidden-focus ×1, color-contrast ×7, link-name ×1 | 3, 5, 3 |
| packages.html | aria-hidden-focus ×1, color-contrast ×2, link-name ×1 | 3, 5, 3 |
| package-shimla-manali.html | aria-hidden-focus ×1, color-contrast ×11, link-name ×1 | 3, 5, 3 |
| package-kerala-ayurveda-wellness-retreat.html | aria-hidden-focus ×1, color-contrast ×12, link-name ×1 | 3, 5, 3 |
| about.html | aria-hidden-focus ×1, color-contrast ×2, link-name ×1 | 3, 5, 3 |
| contact.html | aria-hidden-focus ×1, color-contrast ×2, link-name ×1 | 3, 5, 3 |
| privacy.html | color-contrast ×1 (coral "Back to Home" link) | 5 |

**Gone on every page:**
- `region`: the floating call and WhatsApp buttons are now inside labelled landmarks.
- `frame-title`: the office maps are titled.
- `heading-order`: the packages page now has an h2 above the cards.
- `landmark-complementary-is-top-level`: the booking card is a named region.
- `html-has-lang` and `landmark-one-main`: fixed on the legal pages.

**Also fixed in Phase 2, but not measurable by axe:**
- Skip links: "Skip to main content" and "Accessibility options".
- A visible focus ring on every control, kept clear of the sticky header.
- Real alt text on photos.
- 28+ decorative icons per page hidden from screen readers.
- "Send an enquiry" is now a heading.

### After Phase 3 (interactive components) — 2026-11-13

| Page | Violations left |
|---|---|
| index.html (desktop / 375 px) | color-contrast ×11 / ×7 |
| packages.html | color-contrast ×2 |
| package-shimla-manali.html | color-contrast ×11 |
| package-varanasi-tour-packages-from-kerala.html | color-contrast ×19 |
| about.html | color-contrast ×2 |
| contact.html | color-contrast ×1 |

**Gone on every page:**
- `aria-hidden-focus`: the closed mobile menu is now `inert`.
- `link-name`: no more `<button>` nested inside `<a>`.
- `scrollable-region-focusable`: the reviews rail on phones.

Colour contrast is all that axe still reports; it is Phase 5.

**Checked with real keyboard presses (not measurable by axe):**
- **Destinations menu:** Enter opens it and moves focus inside; Escape closes it and returns focus to the button; it also closes when focus leaves the header.
- **Home search fields:** focus goes to the current choice; the two section titles are no longer clickable; picking an option returns focus to the field.
- **Calendars:** full spoken dates; past days disabled; arrow keys, Home and End move between days; Escape closes them.
- **Sort menu:** opens on the current choice; picking one returns focus to the sort button.
- **Photo viewer, filter sheet, home search sheet, bottom sheet, mobile menu:** each is a labelled dialog. Focus moves in, Tab stays inside, Escape closes it, and focus returns to the control that opened it. The photo viewer also takes ← / → for previous and next photo.
- **State announced to screen readers:** FAQs report expanded or collapsed, and closed answers are hidden. Chips, filters and themes report pressed. The current itinerary day is marked, and the new day's title is announced. Traveller counts are announced as they change.
- **Mobile menu flash:** no longer slides across the screen while the page loads.

### After Phase 4 (forms and media) — 2026-11-13

axe is unchanged: colour contrast is the only rule it still flags (Phase 5). axe cannot judge captions (`video-caption`, 3 reels): that needs a person — see "Open question" below.

**Forms — tested with the network stubbed out (nothing was sent):**
- **Contact enquiry is a real `<form>`:** Enter submits it, and the Send button no longer has its own click handler as well, so a submit sends once.
- **Each error names its field:** it marks that field `aria-invalid`, links it to the message (`aria-describedby`) and moves focus there. The message is announced.
- **Required fields:** "Fields marked * are required" appears at the top. The `*` itself is hidden from screen readers; the inputs announce "required".
- **After sending:** focus moves to the new "Enquiry received" heading. "Send another" returns focus to an empty name field. A network failure shows the announced error and the button works again.
- **Home "10% off" box:** a real form with a labelled email field. An invalid address now gets an announced message, where before it was silently ignored. The confirmation is announced, and the keyboard focus ring is visible again.
- **Footer newsletter:** the duplicate handler is removed (one send per sign-up, where it used to be two). Invalid addresses get a persistent message tied to the field. A failed send now says so, where before it said "Thank you" anyway.

**Media:**
- **Reels:** a visible Pause / Play button on each (WCAG 2.2.2). A reel the visitor paused stays paused while scrolling. Autoplay is off while the toolbar's "Pause animations" is on, but tapping a reel to hear it still works.
- **Footer background video:** not loaded at all when the visitor asks for reduced motion, or has "Pause animations" on; the poster is shown instead.
- **Smooth scrolling:** off for visitors who ask for reduced motion.

**Reel captions (WCAG 1.2.2) — resolved:** the site owner confirmed on 2026-11-13 that the text burned into each of the three reels captions all of their speech (open captions), so no separate caption track is needed. axe still lists `video-caption` as "needs review" because it cannot see burned-in text; that is expected. Any new reel must be captioned the same way, or get a WebVTT `<track>`.

### After Phase 5 (colour contrast) — 2026-11-13

**axe-core `color-contrast`:**
- **0 violations** on index (desktop and 375 px), packages, package-shimla-manali (desktop and 375 px), package-varanasi, about, contact and privacy.
- Before every scan, the page was scrolled top to bottom so all reveal animations had finished.

**What changed:**
- 26 colour edits (`cc-*` in `tools/a11y-edits.js`) on all 34 pages.
- Before/after samples with ratios: [a11y-colour-changes.html](a11y-colour-changes.html).
- Only colours behind or under text and icons changed. Decorative bars, dots, borders and the large coral heading accents keep the original palette.

**What axe reports as "incomplete":** text on translucent panels over photos, sticky bars and gradient dots. axe can't measure these.
- The gradients were computed by hand: white text is now at least 4.97:1 at both ends.
- Photo overlays were checked by eye.

**Status:** with this, every axe violation from the baseline is fixed on the pages measured.

### Phase 6 (statement and documentation) — 2026-11-13

- **[accessibility.html](../accessibility.html):** the public accessibility statement.
  - Standard: WCAG 2.2 AA, stated as "partially conforms", with known limitations listed.
  - Covers the toolbar, keyboard shortcuts and how to report a barrier (email, phone, WhatsApp).
  - Its own axe run: 0 violations.
- **Where it's linked from:**
  - the "Support" column of every page's footer (edit `footer-statement-link`)
  - the toolbar panel
  - `sitemap.xml`
- **[ACCESSIBILITY.md](ACCESSIBILITY.md):** maintainer guide (how the pieces fit, the injector, rules for new content, colour tokens, how to re-test). Linked from the README.

**Still open (not done by this work):**
- Screen-reader testing with real users (NVDA, VoiceOver).
- A Lighthouse score.
- Real content for the Privacy, Terms and Cookie pages.
