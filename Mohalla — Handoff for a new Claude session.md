# Mohalla — Handoff for a new Claude session

Nov 24, 2026 · @Raheem

This document brings a new Claude session (or a new teammate) up to speed on Mohalla, a group project for Intro to Web and Mobile Development. Read it before the attached files.

## How to use this

Start a new Claude chat, attach the files below, and paste the starter prompt. Claude links in this project are private to the account that made them, so send exported copies, not links.

| File | What it is | How to get it |
| --- | --- | --- |
| This handoff | Context and decisions | Export as Markdown or PDF |
| Mohalla — Project Spec v1 | Full spec: trust rules, features, data model, API, diagrams, timeline | Export as PDF (keeps the diagrams) |
| mohalla-starter.zip | Starter code: API, web app, worker app, README | Already a file |
| WebDev\_Project.pdf | The proposal slides presented in class | Original file |
| Project\_Summary\_and\_Details.pdf | The written proposal | Original file |
| Rubric screenshot | Grading criteria (also summarised below) | Original image |

**Starter prompt to paste:**

```markdown
I'm working on Mohalla, a group project for Intro to Web and Mobile Development. Attached are a handoff document, the project spec, the starter code (zip), our proposal and the grading rubric.

Please read the handoff first, then the spec, then README.md inside the zip. Treat the decisions marked as settled as final unless I say otherwise. Before changing any trust rule (strikes, disputes, vouching, ratings), check with me.

When you give me code or instructions, explain what each step does and why.

My first task: [describe it here]
```

## Project at a glance

Mohalla is a web and mobile marketplace where households and small businesses in Karachi hire local workers (plumbers, electricians, cleaners, carpenters and more) by service, area, price, availability and reputation. It was presented as "KaamKaaj"; the name changed after feedback.

- **Team:** Afshad Sidhwa (creative director), Azfar Ali, Ikramah Elahi, Ahla Haider
- **Presentation:** expected the first week of December 2026, exact date not confirmed
- **Final submission:** 15 Dec 2026, midnight. What exactly gets submitted (report, demo, deployed link, code) is not yet confirmed with the instructor.
- **Stack:** React (web), Expo / React Native (worker app), Node + Express (API), MongoDB

**Grading rubric (60 points)**

| Criterion | Points |
| --- | --- |
| Functional requirements and features | 10 |
| Problem identification and need | 8 |
| Innovation and creativity | 8 |
| Technical feasibility | 8 |
| Project objectives | 6 |
| UI mockups / wireframes | 6 |
| Project defense / presentation | 6 |
| Technology stack selection | 4 |
| Project organization and professional writing | 4 |

The trust system is the project's main innovation argument, and keeping scope realistic is the feasibility argument. Both matter for about a quarter of the marks.

## What has been done so far

| Date | Step | Result |
| --- | --- | --- |
| 24 Nov | Handoff | This document |
| 23 Nov | Starter code | API, customer and admin web app, Expo worker app, with README and tests (see State of the code) |
| 23 Nov | Spec | "Mohalla — Project Spec v1": features ranked must / should / could, trust rules, data model, API, timeline |
| 23 Nov | Team settled the open disagreements | Voice notes, dispute handling and revenue model agreed (see Settled decisions) |
| 23 Nov | Stress-tested the idea | Looked for weak points: empty marketplace on day one, fake reviews, vouch gaming, quotes that depend on inspection, two-way safety, stale availability, location without GPS, storing ID data |
| 23 Nov | Picked a direction | Afshad chose from presented options: Mohalla name and look, all three trust levels, both booking modes, the Expo worker app |
| 23 Nov | Researched names and competitors | "KaamKaaj" is taken (KaamKaaj.in in India, Kam Kaj in Pakistan); so is "Ustaad". Competitors such as Mahir Company and Mauqa Online vet or employ their own workers |
| Before 23 Nov | Proposal presented | Feedback: change the name; how do you stop scams and non-payment; add ratings; what about workers who don't read well; who settles disputes; won't workers take customers off the app |

## Settled decisions

These were agreed by the team; the spec has the full detail.

| Topic | Decision | Why |
| --- | --- | --- |
| Name and look | "Mohalla" (working name). Warm terracotta, marigold and green on cream, rounded type | The old name was taken; "mohalla" fits a launch neighbourhood by neighbourhood |
| Core trust idea | A job agreement both sides confirm in the app: visit charge, then full quote after inspection, then amendments and parts (with a bill photo). Entries are never edited | Gives disputes a record to check, and stops price padding on arrival |
| Ratings | Both sides rate each other, only on completed jobs; hidden until both rate or 7 days pass | Non-paying customers get a record too; no revenge ratings |
| Reliability | Plain counts ("41 of 43 jobs completed", "95% on time"), "New" under 5 jobs | Honest and easy to explain, unlike a made-up score |
| Vouching | Workers with 10+ jobs and 90%+ completion can vouch for up to 3 newcomers; a newcomer's early strike warns the voucher | Lets new workers get a first job; a voucher's reputation is at stake |
| Disputes | Opened within 48 h. Admin rules only on the record: upheld (strike), unresolved (no strike, both statements shown), or settled | The platform can't judge who's honest; it can judge evidence |
| Strikes | 1 = warning, 2 = 7-day suspension, 3 = ban, within 6 months. 3 unresolved disputes in 30 days flags for review. Safety reports suspend immediately | Patterns, not single bad days, remove people |
| Launch | Start with established businesses, vetted by hand, as "founding" workers and the roots of the vouch network | Solves the empty marketplace and seeds trust |
| Revenue | No commission. Free during launch; founding members free for life; featured listings and shop ads from the start; registration fee once demand is steady | No commission = no reason to leave the platform; no upfront fee scaring off early workers |
| Literacy | English / Roman Urdu toggle, icon-first worker screens, big green Accept / red Decline, numbers over words | Answers the "workers who don't read well" feedback |
| Voice notes | Not in the core. Maybe on job requests after the presentation, else future work | Not needed for the app to work |
| Booking | Direct hire first; posting a job for quotes second | Direct hire is the simpler demo |
| Platform | React web for customers and admin, Expo app for workers, one shared API | Workers are phone-first; one API keeps rules in one place |
| Out of scope (v1) | Payments, GPS tracking, live chat, real ID verification (simulated) | Feasibility within the course |

## State of the code

The starter code covers every must-have feature in the spec, but it has not yet run against a real database.

**Layout of mohalla-starter.zip**

- `api/` Node + Express + Mongoose. All trust rules are in `src/lib/rules.js`; the job flow is in `src/routes/jobs.js`. `npm run seed` loads demo data (every password is `password123`).
- `web/` React + Vite. Customer pages (search, worker page, request, job with agreement, payment, rating, dispute) and admin pages (disputes beside the job record, users, reports).
- `worker-app/` Expo SDK 58. Login, sign-up by tapping icons, home with an availability switch and job tabs, job screen for proposing prices and confirming payment.
- `README.md` explains setup step by step.

**What was checked**

- 19 API tests pass: the trust rules, and that protected routes refuse users who aren't logged in.
- The web app and the worker app both build.
- Both apps were opened in a browser against a fake API with sample data, and the main screens rendered without errors.

**Not yet checked**

- The API against a real MongoDB. `api/test/flow.test.js` runs a whole job from request to dispute ruling. It needs a separate Atlas database because it wipes it (see the README).
- The worker app on a real phone through Expo Go.

**Known gaps**

- Bill and evidence photos are pasted links; real uploads (camera + Cloudinary) aren't built.
- Vouching and assisted signup exist in the API but have no screens yet.
- The Roman Urdu text is a first draft and needs checking by native speakers.
- Not deployed yet.

## Next steps and open questions

The plan aims for the core job flow (request → agreement → complete → payment → rating) to be demoable by 1 Dec.

**Next steps, in order**

- [ ] Set up MongoDB Atlas, run the API and the seed, then run the full flow test
- [ ] Run the worker app on a phone with Expo Go
- [ ] UI mockups / wireframes (6 rubric points). Afshad, as creative director, decides the direction; the built screens can be the starting point
- [ ] Worker interviews: 3 to 5 workers, 10 minutes each, showing an example screen; collect quotes for the report
- [ ] Split ownership: fill the Owner column in the spec's Features table
- [ ] Photo uploads for bills and dispute evidence (expo-image-picker + Cloudinary)
- [ ] Vouching screens in the worker app
- [ ] Assisted signup (someone sets up a worker's profile for them)
- [ ] Deploy: API on Render, web on Vercel, worker app through Expo Go
- [ ] Report and presentation slides

**Open questions**

- [ ] What exactly is submitted on 15 Dec? Ask the instructor.
- [ ] Exact presentation date.
- [ ] Final product name, if not keeping Mohalla (check the Play Store and domains first).

## Notes for Claude

- **Afshad is the creative director.** For design or product choices (name, look, wireframes, new features), present options for him to pick from before building.
- **The team decides trade-offs.** Where teammates disagree, set out the positions and a suggested middle ground rather than picking a side.
- **Respect the scope.** Must-haves come first; should- and could-haves only once the core flow works. Flag anything that threatens the timeline.
- **Keep rules in one place.** Trust rule changes go in `api/src/lib/rules.js` and the spec together, so they never disagree.
- **Be honest about limits.** The presentation should say plainly what is simulated (ID checks) and what the platform can't do (prove what happened inside a home).
- **Students are learning.** Explain what code does and why, and keep it readable over clever.
- **Expo SDK 58** is newer than much training data: check the versioned Expo docs before using an Expo API, and install packages with versions that match the SDK.
