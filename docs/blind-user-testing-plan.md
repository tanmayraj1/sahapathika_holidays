# Testing with blind and low-vision travellers

**Why:**
- The automated checks and our own screen-reader runs (`docs/screen-reader-test-script.md`) show the site is built correctly.
- Only people who use a screen reader every day can show whether it is *easy*: where they get lost, what they skip, what they don't trust.
- The accessibility statement also promises this testing ("still to come"), so it needs to happen before the statement can drop that line.

**Who:** 3 to 5 people. Five usually find most problems; three already find the big ones. Aim for a mix of:
- **Blind screen-reader users on Android (TalkBack):** at least 2. This is the most common setup in India.
- **A blind NVDA or JAWS user on a Windows PC:** 1.
- **A low-vision user** who uses zoom, large text or high contrast rather than a screen reader: 1.
- **Language:** at least 1 tester more comfortable in Malayalam or Hindi than English, to try the toolbar's language switch.
- **Age:** ideally one older traveller, since many yatra customers are seniors.

## Where to find testers

Contact these organisations yourselves. Explain that you are a travel company that wants blind travellers to test your website, and that you will pay testers for their time.

- **National Association for the Blind (NAB) India:** Kerala and Delhi branches.
- **Kerala Federation of the Blind.**
- **Local blind schools and their alumni groups** in Kochi.
- **Your own customers:** past travellers who mentioned a visual impairment, or travelled with someone who has one.

## What to offer

- **Payment for their time:** ₹1,000–₹1,500 for a one-hour session is a reasonable starting point. Decide this with the organisation, and pay promptly, the same day if you can.
- **A choice of format:** remote over a phone or video call, sharing their own phone screen and audio, or in person at the Kochi office.
- **Their own device and settings:** never ask a tester to use yours.
- **A written consent note**, sent beforehand in a format that works with a screen reader (plain email or a Word file). It should say:
  - what you will record;
  - that it stays inside the company;
  - that they can stop at any time and still be paid.

## The session (about 60 minutes)

1. **Introduction (5 min):** "We are testing the website, not you. Anything that is hard is our fault, and exactly what we want to hear."
2. **Their setup (5 min):** which device, screen reader and speech rate they normally use. Don't change anything.
3. **Tasks (40 min):** the six tasks from `docs/screen-reader-test-script.md`, said in everyday words. For example: "You'd like to take your parents to Kashi. Find a trip that fits and find out what's included."
   - Don't explain how the site works. Don't mention the skip links or the toolbar unless they are stuck for more than 3 minutes.
   - Ask them to think aloud.
   - Note the time and where they hesitate.
   - **They must not submit the enquiry form with real details**, unless they actually want to enquire.
4. **The toolbar (5 min):** "There's an accessibility button on every page. Have a look." Note whether they find it, and whether any of it helps or gets in the way.
5. **Wrap-up (5 min):**
   - What was the hardest part?
   - What would make them trust booking with us?
   - Would they rather book on the site, on WhatsApp or by phone?

## Afterwards

- **Write up each session within a day,** using the record sheet in the test script plus quotes.
- **Sort the problems** into "stops the task", "slows it down" and "annoying". Fix the first group first.
- **Add a summary to `docs/a11y-baseline.md`,** and update the statement's "Known limitations" in all three languages. Replace "testing with screen readers by disabled users is still to come" with what you tested, when, and what is still being fixed.
- **Thank the testers,** and tell them what changed because of them.
