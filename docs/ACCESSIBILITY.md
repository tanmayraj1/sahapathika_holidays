# Accessibility: how it works and how to keep it working

This site aims at **WCAG 2.2 AA**. The public statement is at [accessibility.html](../accessibility.html). The history of what was measured and fixed is in [a11y-baseline.md](a11y-baseline.md). The original plan is in [ACCESSIBILITY-PLAN.md](ACCESSIBILITY-PLAN.md).

## The pieces

| File | What it does |
|---|---|
| `a11y/a11y.js` | Toolbar (launcher, panel, profiles, read aloud, reading aids). Skip-link behaviour, including page-specific skip links (`EXTRA_SKIPS`: results, trip at a glance, itinerary, whole itinerary as a list, what's included, booking). Reads the booking summary back after each choice. Decorative-SVG hiding, and focus management for menus, popovers and dialogs. Reel pause buttons. Exposes `window.SHA11y = { trapFocus, announce, open, close }`. |
| `a11y/a11y.css` | Focus ring, skip links, toolbar UI, and every toolbar setting (classes on `<html>`). Also small fixes the page styles can't express. |
| `a11y/fonts/` | OpenDyslexic (SIL OFL 1.1; licence in `OpenDyslexic-OFL.txt`). Only downloaded when a visitor turns the dyslexia font on. |
| `motion.js` | Mobile menu: links, `aria-expanded`, `inert` while closed, focus trap and return. Respects "Pause animations". |
| `image-slot.js` | Passes the slot's `alt` attribute to its inner `<img>`. |
| `tools/a11y-inject.js` + `tools/a11y-edits.js` | Every fix made inside the page templates and scripts. Round 2 (blind and screen-reader users) lives in `tools/a11y-edits-r2.js`, loaded by `a11y-edits.js`. |
| `tools/a11y-noise.js` | Screen-reader noise check: Tab stops, repeated links, symbols and Hindi read out in English names, vague names, spoken name ≠ visible label. Load it in a rendered page and call `a11yNoise(document)`. |
| `accessibility.html` | The accessibility statement. |
| `docs/a11y-colour-changes.html` | Before/after colour pairs with contrast ratios. |

## The one rule: edit pages through the injector

Each of the 31 full pages carries its own copy of the whole template and app logic. A fix therefore has to land in every page identically. Do this through `tools/a11y-edits.js`, never by hand in one file:

```bash
node tools/a11y-inject.js            # dry run: shows what would change, per page
node tools/a11y-inject.js --write    # apply
node tools/a11y-inject.js --list     # pages and edits
```

The injector refuses to write anything if:
- an edit matches a different number of times than its `expect` says;
- an edit would mix line endings (the repo checks out as CRLF);
- an edit's "already done" marker also appears in another edit's output (it would be silently skipped).

Re-running is safe: applied edits are skipped. Running it on the current tree reports `0 files would change`.

When the site's design changes (for example, a new section copied into every page), add or adjust an edit and re-run. If an existing edit stops matching, the injector says which page and which edit.

## Rules for new content and features

- **Photos.** On `<image-slot>`, add `alt="…"` describing what the photo actually shows. The `placeholder` text is a photo brief, not a description. Decorative photos get no `alt`.
- **Icons.** An `<svg>` without a `<title>` is hidden from screen readers automatically. The control around it needs its own name (visible text or `aria-label`).
- **Buttons vs links.** A control that goes to another page is an `<a href>`. A control that does something on the page is a `<button type="button">`. Never put one inside the other.
- **State.** Toggles say `aria-pressed`, disclosures say `aria-expanded`, the current step says `aria-current`. The template can compare strings: `aria-pressed="{{ o.cls === 'on' }}"`.
- **Pop-ups.** A new dialog or sheet should be added to the `DIALOGS` list in `a11y.js`. That gives it focus moving in, staying inside, Escape, and focus returning to its opener.
- **Forms.** Every field needs a label. Errors name the field, set `aria-invalid`, are linked with `aria-describedby`, and move focus to the field.
- **Colour.** Text needs 4.5:1 against its background (3:1 if 24px+, or 19px+ bold). Icons and focus rings need 3:1. Use the tokens below. Check new pairs before using them.
- **Video.** Must be pausable, and anything spoken must be captioned (the reels use burned-in captions). Respect `prefers-reduced-motion` and `window.__a11yReduceMotion`.
- **Cards.** One keyboard stop per card. If a card has a photo link and a title link to the same page, the photo link gets `tabIndex="-1" aria-hidden="true"`. Facts shown only on the photo (length, theme) go in an `a11y-sr` line after the title.
- **Whole-card links.** The title comes first in the link's text. Decorative kickers and photos whose alt would repeat the title are hidden (`aria-hidden="true"`, `alt=""`).
- **Symbols.** Arrows, chevrons, stars and ornamental Hindi (॥ … ॥) go in `<span aria-hidden="true">`. If the symbol carries meaning, write it in words ("3 to 4 star").
- **Names.** An `aria-label` starts with the words shown on screen ("All photos, open gallery", "Call us, +91 …"), so voice-control users can say what they see.
- **Before/after.** Run `tools/a11y-noise.js` on the page you changed. The numbers should not go up.

## Colour tokens that pass

| Use | Colour | Ratio |
|---|---|---|
| Button fill behind white text | `#C4362C` (hover `#A82E25`) | 5.37 |
| Small coral / red text on cream | `#C4362C` | 4.98 |
| Red text on mint `#DCEEE7` | `#A82E25` | 5.65 |
| Saffron small text, orange end of white-text gradients | `#A45F15` | 4.61 on cream |
| Saffron large display text only | `#CD771B` | 3.12 |
| Gold text and gold chips | `#8A6316` | 5.42 |
| Green text on mint | `#2D745E` | 4.62 |
| WhatsApp green behind white | `#188641` | 4.64 |
| Muted text on cream | `#6B655C` | 5.35 |
| Large heading accents only | `#E5483D` | 3.66 |

## Re-testing

1. Serve the folder (`python -m http.server 8080`). The browser caches CSS and JS, so force a reload after edits.
2. On each page, load axe-core 4.10.2 from cdnjs and run `axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice'] } })`. Scroll the page first, so reveal animations have finished.
3. Walk the page with the keyboard only:
   - **Tab:** the skip link comes first and the focus ring is always visible.
   - **Escape:** closes any menu or dialog and returns focus to the control that opened it.
4. Test with a real screen reader (NVDA + Chrome on Windows, VoiceOver + Safari on Mac/iPhone). This is still to do. Update the statement's "Known limitations" when it is done.
