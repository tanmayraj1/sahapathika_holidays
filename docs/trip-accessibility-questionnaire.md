# Trip accessibility questionnaire

**For:** the Sahapathika Holidays team, one copy per package.

**Why:** a blind, low-vision, deaf, wheelchair-using or older traveller needs to know before booking what a trip is really like for them. The package page shows your answers under **"Accessibility on this trip"**.

**The one rule:** answer only what you know from running the trip. "We don't know yet" is a fine answer: leave the question out and we won't show it. Nothing here is a promise unless you can keep it every time.

## How answers reach the website

1. Fill in one copy of the questions below for a package.
2. Send it to whoever maintains the site.
3. They add it to `data/trip-access.json` under `packages`, keyed by the package's file name without `package-` and `.html`.

For example, `package-shimla-manali.html` becomes `shimla-manali`:

```json
"packages": {
  "shimla-manali": {
    "reviewed": "2026-12-01",
    "answers": {
      "guide": "Yes, on request. Tell us when you enquire; our guide stays with you on sightseeing days and describes each place.",
      "walking": "Kufri involves a steep 1 km path, usually done on horseback. Solang Valley is mostly flat."
    }
  }
}
```

- The section appears on that package's page as soon as one answer is filled in.
- Write answers in plain sentences, as you'd say them on the phone.
- Put the date you checked in `reviewed`. The page shows it, so travellers know how current it is.

## Questions

**Package:**
**Answered by:**
**Date:**

### For blind and low-vision travellers

1. **A guide or escort who describes the sights.** Can a guide or tour escort travel with the guest and describe what's around them? Always, on request, or not possible? Is there an extra cost?
2. **Spoken briefings before each day.** Can someone talk the guest through the next day's plan the evening before (in person or by phone)?
3. **Help at airports and railway stations.** Do we arrange meet-and-assist at arrival and departure (Indian Railways / airline assistance, or our own staff)?
4. **Showing you around your room on arrival.** Can hotel or our staff walk the guest round the room (bed, bathroom, switches, door) when they check in?
5. **Itinerary in large print or as a text file.** Can we send the final itinerary in large print, or as a plain text or Word file that works with a screen reader? (The website already offers a text version of the standard itinerary.)
6. **Guide dogs.** Are guide dogs accepted by the hotels, vehicles and sites on this route? Which ones don't?

### For everyone with access needs

7. **Walking, steps and uneven ground.** Which days or sites involve long walks, many steps, steep or uneven paths, or crowds? Are there alternatives (pony, palki, e-rickshaw, battery car, wheelchair hire)?
8. **Step-free rooms and vehicle access.** Are ground-floor or lift-access rooms available at each hotel? Can the vehicle take a folding wheelchair? Is a vehicle with a lift possible?
9. **Pace and rest.** Can the trip be slowed down (fewer stops a day, an extra night) for seniors or anyone who tires easily?
10. **Medical help along the route.** How far is the nearest hospital or clinic on each day? Any altitude or weather risks to mention?
11. **Anything else to know.** Anything else a traveller with a disability should know before booking?
