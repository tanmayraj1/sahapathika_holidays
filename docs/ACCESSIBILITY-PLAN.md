# Accessibility for Sahapathika Holidays — plan

## Context
Visually impaired visitors can't use the site comfortably today. An audit of the live static site found the following:
- **Navigation and focus:** no skip link, and focus rings are removed on many inputs. Dialogs (lightbox, mobile drawer, bottom sheet, search sheet) don't trap focus or give it back when they close.
- **Mouse-only and unannounced controls:**
  - Mega-menus open on hover only.
  - Accordions and popovers don't tell a screen reader whether they are open or closed (no `aria-expanded`).
  - Calendar days are read as bare numbers.
  - The lightbox buttons have no labels.
  - Gallery tiles and featured cards are clickable divs that a keyboard can't reach.
- **Images:** every `<image-slot>` photo is announced with an empty `alt`.
- **Forms:** the contact form is not a `<form>`, and its errors are not tied to the fields they belong to.
- **Video:** the reels and footer video autoplay with no way to pause them.
- **Colour contrast:** several small-text colour pairs fail WCAG AA, e.g. coral on cream is 3.66, white on coral is 3.94, and the gold labels are 3.39.

The user wants a UserWay-style toolbar and chose to **build our own** rather than embed UserWay. It will have:
- vision tools
- read aloud
- reading aids
- one-click profiles

The site's own code will also be fixed, because a toolbar cannot fix screen-reader or keyboard problems.

Target standard: **WCAG 2.2 AA** (the project states none of its own). HANDOFF.md asks for Lighthouse Accessibility ≥ 95.

## Constraints that shape the design
- **The site is 33 self-contained HTML files.** 30 are full pages; `privacy`, `terms` and `cookies` are 24-line stubs. Every full page duplicates the whole template and app class. There is no shared CSS file.
  - Shared lines 1–104 are identical on all 30 full pages, ending with `<script src="./support.js">`.
  - Every full page has one `<script src="./motion.js" defer>`.
- **The dc-runtime/React re-renders the template.** Attributes added at runtime can be wiped, so source fixes go into the template itself. Anything added at runtime is re-applied by a `MutationObserver`, following the same pattern as the existing "reveal safety net" script.
- **Font sizes are almost all hard `px`** (about 400 declarations) with no root rem scale. Bigger text therefore uses CSS `zoom` rather than a root font-size change.
- **The live-site files:** `index.html`, `packages.html`, `about.html`, `contact.html` and the `package-*.html` pages. `motion.js` and `image-slot.js` are shared runtime scripts. `nextjs-app/` is out of scope.

## Approach

### Phase 0: Tooling (makes the 33-file edits safe)
- **`tools/a11y-inject.js`:** a Node script, idempotent, using relative paths (not the hard-coded `c:/…/Sahapathika_Holidays` path the old scripts use).
  - It holds a list of `{ find, replace, expectedCount }` template edits and applies them to every page.
  - It **fails loudly when a count doesn't match** (the old `fix-*.js` scripts replaced blindly).
  - It has a `--dry-run` mode that prints per-file counts.
  - Every source fix below lives here, so it can be re-run and reviewed.
- **Baseline before changing anything:** serve the folder locally, then run axe-core and Lighthouse on `index`, `packages`, one `package-*` page and `contact`. The numbers are saved for comparison.

### Phase 1: The accessibility toolbar (new `a11y/` folder, no dependencies)
**Files:** `a11y/a11y.js` and `a11y/a11y.css`.
- Both are loaded in `<head>` right after the `support.js` line. The JS is not deferred: a small boot step reads `localStorage` and puts the saved settings on `<html>` as classes before first paint, so there is no flash. The panel UI is built on `DOMContentLoaded`.
- Everything is vanilla JS; every storage read and write is wrapped in try/catch.

**Launcher**
- A round "Accessibility" button, fixed **bottom-left**. On screens ≤768px it sits above the `#sx-bnav` bottom bar. The call button and WhatsApp stay on the right.
- Keyboard shortcut **Alt+A**.
- It is also listed in the skip-link menu and the footer.

**Panel**
- It is a `role="dialog"` with `aria-modal`. Focus moves into it when it opens, is trapped while it is open, closes on Esc, and returns to the launcher.
- Each tile is a `<button aria-pressed>`. Tiles with several levels announce the current level, e.g. "Bigger text, level 2 of 3".
- The panel also has: Reset all, Move launcher left/right, Hide launcher, and a link to the Accessibility statement.
- Settings persist across pages.

**Features** (each is a class on `<html>` styled in `a11y.css`, or a small JS module)
- **Vision**
  - Contrast cycle: Dark contrast / Light contrast / High contrast (ink and yellow links) / Invert. These use `!important` overrides because the template uses inline styles; Invert re-inverts media.
  - Saturation: low / greyscale / high.
  - Bigger text: 110 / 125 / 150%, applied with `zoom` on `body`.
  - Text spacing (WCAG 1.4.12 values) and line height (1.5 / 1.8 / 2).
  - Highlight links (underline plus outline on `a` and `button`).
  - Big cursor in black or white (SVG data-URI cursors).
  - Hide images (`img`, `image-slot`, `video`, and inline `background-image`), with alt text shown in their place.
  - The colour filters are combined into one `--a11y-filter` on `html`. Putting it on `body` would break `position:fixed`.
- **Read aloud** (Web Speech API, no cost)
  - **Read page:** walks `main`'s headings, paragraphs and list items in order, highlights the block being read, and has Play / Pause / Stop / Speed controls.
  - **Click to read:** reads the element under the pointer, or the one with keyboard focus.
  - Prefers an `en-IN` voice and switches to `hi-IN` for Devanagari text.
  - The panel says this is a help for low-vision and dyslexic readers, not a replacement for a screen reader.
- **Reading aids**
  - Reading guide: a bar that follows the pointer or touch.
  - Reading mask: dims everything above and below a band.
  - Readable font: Atkinson Hyperlegible.
  - Dyslexia font: OpenDyslexic.
  - Both fonts are OFL-licensed and self-hosted in `a11y/fonts/`; I'll ask before downloading them.
  - Text align: left / centre / right.
  - Page structure: a list of headings, landmarks and links built from the live DOM. Choosing one scrolls to it and focuses it.
  - Show labels: a tooltip with an element's alt or aria-label on hover and focus.
- **Pause animations**
  - Turns off CSS animations and transitions and pauses every `<video>`.
  - Stops the marquee, and makes scroll smooth-off.
  - Sets `window.__a11yReduceMotion`, which `motion.js` checks before its parallax and reveals. The existing `prefers-reduced-motion` rules are kept.
- **Profiles** (one click turns on a preset; each still shows which tiles it turned on)

  | Profile | Turns on |
  |---|---|
  | Blind | Read page, highlight links, strong focus |
  | Visually impaired | Bigger text 125%, readable font, highlight links, big cursor |
  | Colour blind | High saturation, highlight links |
  | Dyslexia | Dyslexia font, text spacing, line height 1.8, reading guide |
  | Seizure-safe | Pause animations, low saturation |
  | ADHD | Reading mask, pause animations |
  | Cognitive | Readable font, line height, highlight links, pause animations |
  | Motor / keyboard | Strong focus rings, big cursor |

**Runtime helpers in `a11y.js`** (also used by Phase 3)
- `trapFocus(dialogEl, openerEl)`.
- A `MutationObserver` that re-applies attributes the re-render strips: `aria-hidden`/`focusable=false` on decorative SVGs that have no title, and `inert` on the closed mobile drawer.

### Phase 2: Foundation fixes in the source (through the injector)
- **Skip link** "Skip to main content", the first focusable element on every page. It targets `id="main-content"`, which is added to each view's `<main>` (5 per template; `sc-if` renders one).
- **Global `:focus-visible` ring** in `a11y.css`: a 3px ink outline with a white halo, at least 3:1 against both cream and dark. It uses `!important` so it beats the `outline:none` rules (lines ~148, 431, 1234, 1811, 1835, 3839 in `index.html`, and the contact form's `inputStyle`).
- **Legal stubs** (`privacy`, `terms`, `cookies`): add `lang="en"`, `<main>`, the `a11y/` includes and a proper title.
- **`image-slot.js` line ~504:** pass the element's `alt` attribute through to the inner `<img>`. Then give each slot real alt text, reusing the existing captions in `dxPhotoCaps` and `galleryItems.cap`. Descriptions of temples and religious sites must be accurate and respectful (HANDOFF §12).
- **Headings:** contact's "Send an enquiry" `<div>` becomes an `<h2>`. Run a pass for link text that doesn't say where it goes.

### Phase 3: Interactive components (template edits plus `a11y.js` helpers)
- **Mega-menus:**
  - Triggers become `<button aria-expanded aria-controls>` that also open on click and Enter.
  - Esc closes the menu and returns focus to the trigger.
  - The wrong `role="menu"` is removed; they are plain link lists.
  - The `<button>` nested inside `<a>` in the nav and "Plan My Trip" (~2182–2201) is unwrapped.
- **Hero search popovers:**
  - Add `aria-expanded`, and close on Esc on every page (today only `index` does).
  - Calendar days get a full-date `aria-label`, plus `aria-pressed` for the selected day and `aria-disabled` for past days. Month arrows get labels.
  - Arrow keys move between days.
  - The mobile search sheet uses `trapFocus`.
- **Accordions** (FAQ and itinerary): add `aria-expanded` and `aria-controls`. Closed panels get `hidden`/`inert` so screen readers stop reading collapsed answers.
- **Steppers:** the adult/child counts get `aria-live="polite"`.
- **Choice chips:** filter chips and `dx-seg` get `aria-pressed`. The wrong `role="tab"` comes off (it has no tab panels), and the sort `listbox` options get `aria-selected`.
- **Clickable divs:** gallery tiles become `<button>`s, featured cards become real `<a href>`, and the backdrops are left as mouse conveniences with Esc as the keyboard equivalent.
- **Dialogs:**
  - The lightbox gets labelled × ‹ › buttons, Esc, arrow keys and `trapFocus`.
  - The mobile drawer `#sh-mobile-nav` (`motion.js` ~160–303) gets `trapFocus`, `inert` while closed and `aria-expanded` on its sub-toggles.
  - The bottom sheet `#sx-bsheet` gets `trapFocus`.
- **Icon-only controls:** the rail ‹ › and `dx-nav` prev get `aria-label`s.

### Phase 4: Forms and media
- **Contact enquiry form:**
  - Wrap it in a real `<form novalidate>` so Enter submits.
  - Each field gets its own error message, linked with `aria-describedby` and `aria-invalid`; on submit, focus moves to the first invalid field.
  - The visual `*` gets screen-reader text "(required)".
  - Add `autocomplete` for the remaining fields, and a `role="status"` success message.
- **Home newsletter:** add a visually hidden label (it is placeholder-only today).
- **Footer newsletter:** remove the duplicate submit handler (the first of the two at the end of every page) so one signup sends one email.
- **Reels (`moment-0x.mp4`):**
  - Add a visible Pause/Play button per reel (WCAG 2.2.2) and a short text description.
  - Add a `<track>` of captions if any reel has speech; I'll ask.
- **Footer video:** respect `prefers-reduced-motion` and the toolbar's Pause animations.
- **Smooth scrolling:** `scroll-behavior:smooth` only applies when the visitor hasn't asked for reduced motion.

### Phase 5: Colour contrast (a visible design change; small and targeted)
Keep the coral brand colour for large text and large shapes. Swap only the small-text and button pairs that fail:

| Element | Fix |
|---|---|
| Small coral text and white-on-coral buttons | `#C4362C` (already the hover colour) |
| 11px gold labels | `#8A6316` (already a token) |
| Saffron and mint text | Darker variants that reach 4.5:1 |
| WhatsApp button | Dark text or a darker green |

I'll check each pair with the contrast formula, change them in the injector, and show before/after screenshots for sign-off.

### Phase 6: Statement and documentation
- **`accessibility.html`:** what the toolbar does, keyboard shortcuts, known limitations, and a contact (sahapathika@gmail.com / WhatsApp) for reporting barriers. It is linked from the footer's legal nav and the panel, and added to `sitemap.xml`.
- **A repo `CLAUDE.md`/README section** on the a11y files and how to re-run the injector.

## Files
- **New:**
  - `a11y/a11y.js`, `a11y/a11y.css`, `a11y/fonts/*`
  - `tools/a11y-inject.js`
  - `accessibility.html`
- **Modified:**
  - All 33 HTML pages, through the injector (head includes, skip link, template fixes). Representative ones: `index.html`, `contact.html`, `package-shimla-manali.html`, `privacy.html`.
  - `motion.js` (drawer focus/inert, reduced-motion flag), `image-slot.js` (alt pass-through), `sitemap.xml`.

## Verification
1. **Local server:** `.claude/launch.json` running `npx http-server -p 8080`, opened in the Browser pane.
2. **Automated:**
   - Inject axe-core 4.10 into each representative page and compare against the Phase 0 baseline; the target is zero serious or critical issues.
   - Lighthouse Accessibility ≥ 95 on mobile and desktop.
3. **Keyboard-only walkthrough** of each page:
   - Tab order follows reading order and the focus ring is always visible.
   - Mega-menu, date picker, accordions, lightbox, drawer and bottom sheet all open, trap focus, close on Esc and return focus.
   - The booking flow works with no mouse.
4. **Toolbar:**
   - Every tile and profile works on index, packages, a package page and contact, and persists after navigating.
   - Reset restores the original look.
   - No horizontal scroll at 125% / 150% text at 375px and 1440px widths.
   - Read aloud works in Chrome and Edge.
5. **Screen reader (manual, your step):** NVDA (free, Windows) plus Chrome. Check headings list, landmarks, image alts, form errors, and calendar day names.
6. **Regression:** the site looks unchanged with the toolbar off (apart from the Phase 5 contrast swaps), and the enquiry and newsletter forms each still deliver one email.

Nothing is committed until you approve. I'll suggest committing one phase at a time.
