# Screen-reader test script

**For:** the Sahapathika Holidays team, or a tester working with you.

**Why:** the automated checks (axe, the noise check, hit-testing) find code problems. They can't tell you whether a blind person can actually book a trip. This script can. Run it on the live site after each accessibility change, and before telling customers that the site works with screen readers.

**Time:** about 45 minutes per screen reader for someone who uses it daily. Allow longer for a sighted team member learning it.

## What you need

| Screen reader | Device | Browser | Free? | Start / stop |
|---|---|---|---|---|
| **NVDA** | Windows PC | Chrome | Yes, from nvaccess.org | `Ctrl` + `Alt` + `N` / `Insert` + `Q` |
| **TalkBack** | Android phone | Chrome | Built in | Settings → Accessibility → TalkBack, or hold both volume keys for 3 seconds |
| **VoiceOver** | iPhone | Safari | Built in | Settings → Accessibility → VoiceOver, or triple-click the side button |

In India most blind users browse on an Android phone with TalkBack. If you can test only one, test that.

**Before you start:**
- Turn the screen reader on before opening the site.
- Use a fresh browser window, and don't sign in to anything.
- Have a notepad, or a second person, to record the results.

**Never** press "Send enquiry" with real details. Use the name "Test – please ignore" and your own phone number, or stop at the step before sending.

## The keys and gestures you'll use

| To… | NVDA (keyboard) | TalkBack (Android) | VoiceOver (iPhone) |
|---|---|---|---|
| Next / previous item | `↓` / `↑` | Swipe right / left | Swipe right / left |
| Next heading | `H` | Swipe up then down to choose "Headings", then swipe down | Rotor to "Headings", then swipe down |
| List of headings / links | `Insert` + `F7` | Reading controls → Headings | Rotor |
| Next link / button / form field | `K` / `B` / `F` | Reading controls | Rotor |
| Activate | `Enter` (or `Space` for buttons) | Double-tap | Double-tap |
| Next focusable control | `Tab` | Swipe right | Swipe right |
| Stop speech | `Ctrl` | Tap with two fingers | Tap with two fingers |

## The six tasks

For every task, record:
- **Done?** Yes, yes with help, or no.
- **Presses / swipes:** count them, or estimate.
- **Time.**
- **Anything confusing:** what was announced that made no sense, or what was missing.

The "Expected" lines describe the route the site is built for. The key-press counts were measured with real Tab presses in Chrome on 19 November 2026. A screen-reader user who navigates by headings will often be faster.

### Task 1: Find a Kashmir package

Start on the home page (`index.html`).

**Expected:**
1. The first Tab reaches "Skip to main content".
2. Go to "Packages, 26 journeys" in the header, and press Enter.
3. On the packages page, "Skip to results" is among the first Tab stops.
4. The search field is labelled "Search packages". Type "Kashmir".
5. You hear "4 journeys match your search" without moving.
6. Each card is a single stop: the title, then "5 Days 4 Nights, North India, Hill & Backwater."

**Check that:**
- You never hear "down-pointing triangle", "black star", "right arrow" or Hindi ornaments read out in English names.
- The photo and the "View" link of a card are not repeated.

### Task 2: Hear the full 6-day plan

Open "Kashmir 6 Days Srinagar Sonmarg Gulmarg & Pahalgam" (or Shimla Manali).

**Expected:**
1. Press Tab 4 times to reach "Read the whole itinerary as one list" (about 5 presses in total; previously 26).
2. Press Enter. Focus moves to the list.
3. Each day is a heading: "Day 1: …". Press `H` to jump from day to day.
4. Alternatively, in "Day by day" view, choosing a day announces "Day 3 of 6: …".
5. "Get this itinerary as text" opens a plain version. It has Print and "Save as a text file", and Escape closes it.

### Task 3: Find out what's included

On the same page.

**Expected:**
1. "Skip to what's included" is one of the first Tab stops.
2. "Included" and "Not included" are headings. The ✓ and ✕ marks are not read.
3. On a package with answers in `data/trip-access.json`, an "Accessibility on this trip" section follows.

### Task 4: Enter dates and travellers

On the same page.

**Expected:**
1. "Skip to booking" takes you to the booking card (about 8 presses; previously 44).
2. The calendar works with the arrow keys. **Or** type into "Or type your dates", for example "around Diwali".
3. "More adults" / "Fewer adults" announce the new number.
4. After each choice you hear "Your trip: …" with the summary.

### Task 5: Send an enquiry

From the booking card, choose "Tell us about any access needs". It goes to the enquiry form, with focus on the access-needs checkboxes.

**Expected:**
1. Each field says its name. Required fields say so.
2. Submitting with an empty name moves focus to the name field and reads the error.
3. **Stop here**, or send only with test details as described above.

### Task 6: Call or WhatsApp the team

From any page.

**Expected:**
- **On a phone:** "Call us, +91 90727 69547" sits at the bottom of the screen. Its description says "Starts a phone call".
- **WhatsApp links:** they say "Opens WhatsApp".
- **On a package page:** the booking card's WhatsApp button is about 23 presses from the top (previously 58).

## Also check the toolbar

1. **Opening:** Alt+A opens the accessibility panel (NVDA). On a phone, find the "Accessibility options" button.
2. **Language:** switch to Malayalam, then Hindi. The panel should be read in that language's voice, if the phone has one installed.
3. **Closing:** Escape closes the panel and returns you to where you were.

## Record sheet

Copy this table once per screen reader.

| Task | Done? | Presses / swipes | Time | What was confusing |
|---|---|---|---|---|
| 1. Find Kashmir package | | | | |
| 2. Hear 6-day plan | | | | |
| 3. What's included | | | | |
| 4. Dates and travellers | | | | |
| 5. Enquiry (not sent) | | | | |
| 6. Call / WhatsApp | | | | |
| Toolbar language switch | | | | |

**Screen reader and version, phone or PC, browser, date, tester:**

After the run:
- Add the results to `docs/a11y-baseline.md`.
- Fix what you can.
- Update "Known limitations" in the accessibility statement (all three languages) with anything that can't be fixed yet.
