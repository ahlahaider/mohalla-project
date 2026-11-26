# Mohalla — Project Spec v1

Nov 23, 2026 · @Raheem

## Overview

Mohalla (working name, replacing KaamKaaj) is a web and mobile marketplace where households and small businesses in Karachi hire local workers (plumbers, electricians, cleaners, carpenters, mechanics, fumigators) by category, area, price, availability and reputation.

**The problem.** Workers find jobs mostly through personal referrals, which caps how much work they get. Customers struggle to find someone nearby they can trust, and have no record or recourse when a job goes wrong: price inflated on arrival, no-show, unpaid work.

**How we differ.** Existing Pakistani services (Mahir Company, Mauqa Online, Kam Kaj) build trust by vetting or employing staff themselves. Mohalla is an open marketplace with no payments handled, so trust comes from the system design instead: a confirmed job agreement as the record, ratings on both sides, a reliability score, a vouch network seeded by established businesses, and disputes decided only on evidence.

**Team:** Afshad Sidhwa (creative director), Azfar Ali, Ikramah Elahi, Ahla Haider. Course: Intro to Web and Mobile Development. Final submission due 15 Dec 2026, presentation expected the first week of December.

## Decisions log

Settled on 23 Nov after the proposal presentation feedback.

| Topic | Decision | Feedback it answers |
| --- | --- | --- |
| Name | "Mohalla" as a working name; KaamKaaj dropped | KaamKaaj.in (India) and Kam Kaj (Pakistan) already exist |
| Visual direction | Mohalla look: warm terracotta, marigold, green on cream; rounded type | — |
| Trust | All three levels: basics, accountability on both sides, vouch network | How do you stop scams, non-payment, unreliable workers? |
| Booking | Direct hire first; post-a-job-for-quotes as a second mode | — |
| Disputes | Admin rules only on evidence on record; inconclusive cases marked unresolved, no strike | Who settles disputes? |
| Parts and materials | Worker adds a photo of the bill for extra parts to the agreement (Ikramah) | Price padding on arrival |
| Off-platform jobs | No commission; going off-platform only costs the worker reputation, dispute cover and easy rehire | Won't workers take customers off the app? |
| Revenue | Free during launch; founding workers and shops free for life; featured listings and local shop ads from the start; small registration fee once demand is steady | How does it make money? |
| Literacy | English / Roman Urdu toggle, icon-first UI, big Accept and Decline buttons, numbers over words; worker interviews to back the claim | What about workers who don't read well? |
| Voice notes | Out of core scope; optional on job requests after the presentation if time allows, else future work | — |
| Launch strategy | Start with established businesses, vetted by hand, as founding workers and roots of the vouch network | Empty marketplace on day one |
| Platform | React web app (customers, admin) + Expo app (workers) + one Express API | Course covers web and mobile |

## Roles

Three roles share one login system; the role on the account decides which screens and API routes it can use.

| Role | Uses | Can do |
| --- | --- | --- |
| Customer | Web app (works on phone browsers) | Search and filter workers, send a direct job request or post a job for quotes, confirm the job agreement and amendments, mark the job complete, rate the worker, open a dispute, report, favourite and rehire |
| Worker | Expo mobile app | Set up a profile (skills, areas, prices, "available today" toggle), accept or decline requests, quote on posted jobs, propose the agreement and amendments (visit charge, then full quote, parts with bill photo), confirm payment received, rate the customer, vouch for other workers, open a dispute |
| Admin | Web app, admin screens | Approve verification and founding status, review disputes against the record, record outcomes and strikes, suspend or ban accounts, handle reports, manage featured listings |

Someone can set up a worker's profile for them (a vouching worker, a family member or a founding business). This is the "assisted signup" path for workers who aren't comfortable doing it alone.

## Features

The 15 must-haves make up the demo for the presentation; should-haves land before 15 Dec; could-haves are stretch goals or future work. Use the Owner and Status columns to track the build.

| # | Feature | Priority | Owner | Status |
| --- | --- | --- | --- | --- |
| 1 | Sign up and log in as customer, worker or admin; one account per phone number | Must |  | Not started |
| 2 | Worker profile: skills, areas served, price range, photo, "available today" toggle | Must |  | Not started |
| 3 | Search and filter by category, area (plus nearby areas), price, availability, rating; female-worker filter | Must |  | Not started |
| 4 | Worker page: reviews, reliability score, badges (verified, founding, vouched) | Must |  | Not started |
| 5 | Direct job request: problem, area, preferred time | Must |  | Not started |
| 6 | Worker accepts or declines; unanswered requests expire after a few hours | Must |  | Not started |
| 7 | Address and phone hidden until accepted, then Call and WhatsApp buttons | Must |  | Not started |
| 8 | Job agreement: visit charge, then full quote after inspection; both confirm | Must |  | Not started |
| 9 | Amendments: price or scope changes and parts with a bill photo; customer must accept | Must |  | Not started |
| 10 | Complete the job; worker confirms paid in cash | Must |  | Not started |
| 11 | Ratings on both sides, only for completed jobs | Must |  | Not started |
| 12 | Reliability score from on-time arrivals, cancellations, no-shows | Must |  | Not started |
| 13 | Open a dispute within 48 hours; admin records the outcome | Must |  | Not started |
| 14 | Report button; admin verifies, suspends, bans | Must |  | Not started |
| 15 | English / Roman Urdu toggle; icon-first worker screens | Must |  | Not started |
| 16 | Post a job, receive quotes, pick one | Should |  | Not started |
| 17 | Vouching: 10+ completed jobs to vouch, at most 3 active vouches | Should |  | Not started |
| 18 | Dispute evidence uploads and automatic strikes | Should |  | Not started |
| 19 | Favourites and one-tap rehire | Should |  | Not started |
| 20 | Voice note on a job request | Should |  | Not started |
| 21 | Fair-price guide per job type and area | Could |  | Not started |
| 22 | Share a job with a trusted contact (customers and workers) | Could |  | Not started |
| 23 | Featured listings and local shop ads | Could |  | Not started |

## Trust system

The platform never decides who is honest; it keeps a record both sides agreed to and acts on what that record shows.

### Job agreement

- **Two stages.** The worker first proposes a visit charge. After inspecting, they propose the full quote (price, scope, date). The customer confirms each stage in the app.
- **Amendments, never edits.** Any change to price or scope is a new amendment the customer must accept or reject. The original stays visible, so the full history is the record.
- **Parts.** Extra parts are an amendment line with an amount and a photo of the bill.
- **Payment.** On completion the worker confirms "paid in cash" with the amount, and the customer confirms too. A mismatch is grounds for a dispute.

### Ratings

- Both sides rate 1 to 5 with an optional comment, only for completed jobs.
- Ratings stay hidden until both have rated, or 7 days pass, so neither side can retaliate.
- One account per phone number, which makes fake reviewer accounts harder.

### Reliability

Instead of one made-up score, profiles show plain counts: "completed 41 of 43 accepted jobs" and "on time 95%" (the customer answers "Did they arrive on time?" at completion). Customers get the same: "paid on record 18 of 18 jobs". Accounts with fewer than 5 jobs show "New".

### Badges and vouching

- **Verified:** an admin has checked identity. Simulated in this project; no real ID numbers or images are stored.
- **Founding:** an established business vetted by hand during the launch phase.
- **Vouched by N:** a worker can vouch once they have 10+ completed jobs and 90%+ completion. Each has at most 3 active vouches. If a newcomer they vouched for gets a strike within their first 10 jobs, the voucher gets a warning; a second time, they lose the ability to vouch.

### Disputes and strikes

1. Either side opens a dispute within 48 hours of completion (or of the scheduled time, for a no-show), choosing a type: no-show, non-payment, scope disagreement or misconduct.
2. Both sides add a statement and evidence (text, photos, voice note later). The other side has 48 hours to respond.
3. The admin compares the claims with the record: agreement, amendments, bills, photos, payment confirmations.
4. Outcome: **upheld** (the record clearly supports one side; a strike goes to the other), **unresolved** (word against word; no strike, both statements shown on both profiles), or **settled** (the two sides resolved it themselves).

| Strikes within 6 months | Consequence |
| --- | --- |
| 1 | Warning |
| 2 | Suspended for 7 days |
| 3 | Banned |

Two safeguards around this: 3 unresolved disputes within 30 days flags the account for admin review (no automatic strike), and a misconduct or safety report suspends the account immediately while the admin reviews it. For theft or harassment, the platform suspends and points both sides to the police; it is not a court.

## Core user flow

&#91;embedded content: direct hire flow · customer and worker, 11 steps\]

The shaded steps all write to the job agreement. A posted job (quotes mode) joins this flow at the visit charge, once the customer picks a quote. The dispute path is the exception, not a step every job takes.

## Data model

Six MongoDB collections. The job agreement lives inside the job document, because it is only ever read together with its job; its entries are appended, never overwritten, which is what makes it a record.

| Collection | Key fields | Notes |
| --- | --- | --- |
| users | role (customer, worker, admin), name, phone (unique), passwordHash, area, language, status (active, suspended, banned), suspendedUntil, strikes\[\], badges (verified, founding), stats (jobsAccepted, jobsCompleted, onTimeYes, onTimeAsked, paidOnRecord), workerProfile (skills\[\], areasServed\[\], priceMin, priceMax, bio, gender, availableToday) | Worker profile embedded in the user; stats are counters updated when jobs change state |
| jobs | customer, worker, mode (direct, quotes), category, description, area, address, preferredTime, status, expiresAt, quotes\[\], agreement\[\] (kind: visit, quote, amendment, part; amount, scope, billPhotoUrl, status: proposed, accepted, rejected), payment (workerAmount, customerAmount), onTime | Address and customer phone only returned to the worker after acceptance |
| reviews | job, from, to, stars, comment, visibleAt | Hidden until both sides rate or 7 days pass |
| disputes | job, openedBy, against, type, statements\[\] (by, text, evidenceUrls), status (open, upheld, unresolved, settled), ruling (against, note, admin) | One open dispute per job |
| vouches | from, to, active | Max 3 active per voucher |
| reports | from, against, reason, status | Misconduct reports suspend immediately |

Job status moves: requested → accepted → agreed → completed, with declined, expired and cancelled as exits. A posted job starts as open, and becomes accepted once the customer picks a quote.

## API outline

One Express API under `/api`, used by both the web app and the worker app. Every route except register and login needs a login token, and each route checks the caller's role.

| Area | Routes | Who |
| --- | --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` | Anyone |
| Workers | `GET /workers` (filters: category, area, maxPrice, available, female), `GET /workers/:id`, `PATCH /workers/me`, `PATCH /workers/me/availability` | Customers search; workers edit their own |
| Jobs | `POST /jobs`, `GET /jobs/mine`, `GET /jobs/:id`, `GET /jobs/open` (posted jobs), `POST /jobs/:id/accept`, `/decline`, `/cancel`, `/complete` | Customer creates and completes; worker accepts or declines |
| Quotes | `POST /jobs/:id/quotes`, `POST /jobs/:id/quotes/:quoteId/pick` | Worker quotes; customer picks |
| Agreement | `POST /jobs/:id/agreement` (propose visit, quote, amendment or part), `POST /jobs/:id/agreement/:entryId/accept` or `/reject` | Worker proposes; customer decides |
| Payment | `POST /jobs/:id/payment` | Both confirm the amount |
| Reviews | `POST /jobs/:id/review`, `GET /users/:id/reviews` | Both sides, completed jobs only |
| Disputes | `POST /jobs/:id/disputes`, `POST /disputes/:id/statements`, `GET /disputes`, `POST /disputes/:id/ruling` | Parties open and respond; admin lists and rules |
| Vouches | `POST /vouches/:workerId`, `DELETE /vouches/:workerId` | Eligible workers |
| Admin | `PATCH /admin/users/:id` (verify, founding, suspend, ban), `GET /admin/reports`, `POST /reports` | Admin; anyone can report |

## Tech stack and architecture

&#91;embedded content: architecture · two apps, one API, one database\]

The stack stays the one presented in the proposal (React, Node, Express, MongoDB), plus Expo for the worker app.

| Choice | Why |
| --- | --- |
| React + Vite for the web app | What the course covers; Vite starts and rebuilds in seconds |
| Expo (React Native) for workers | Same React knowledge, real phone app; Expo Go runs it on any phone without app store publishing, and it can run in a browser as a demo fallback |
| Node + Express API | One API serves both apps, so business rules (who can accept, when a strike applies) live in one place |
| MongoDB + Mongoose | Jobs carry a growing list of agreement entries, which fits documents better than tables; Mongoose adds schemas and validation |
| JWT login tokens + bcrypt | Stateless login that works the same from web and mobile; passwords stored hashed |
| Free hosting (Atlas, Render, Vercel) | No cost, and a live link for the presentation |

## Revenue model

Mohalla takes no commission, so workers have no money reason to take jobs off the platform.

- **Launch phase:** free for everyone. Founding workers and shops stay free for life, as a reward for joining before there were customers.
- **From day one:** featured listings (a worker pays to appear higher in search for their area) and ads from local hardware and supply shops.
- **Once demand is steady:** a small one-time registration fee for new workers, the way some ride-hailing apps charge drivers to join.

In version 1, featured listings are an admin toggle only; no money moves through the app.

## Timeline and work split

&#91;embedded content: build plan · 23 Nov to 15 Dec\]

The presentation date isn't confirmed yet, so the plan aims to have must-haves 1 to 15 demoable by 1 Dec.

| Workstream | Covers | Owner |
| --- | --- | --- |
| Design | Wireframes, shared colours and type, worker screen icons, the example screen for interviews | Afshad |
| API and database | Models, routes, trust rules (strikes, vouching limits, expiry), seed data |  |
| Customer web app | Search, worker pages, requests, agreement screens, ratings |  |
| Worker app | Requests, accept or decline, propose agreement entries, payment, availability |  |
| Admin, research and report | Admin screens, worker interviews, report write-up |  |

## Limitations, open questions and future work

**Limitations to state openly in the report and presentation**

- No payments, GPS tracking or live chat in version 1. Contact after acceptance is by phone or WhatsApp.
- Identity verification is simulated; a real launch would need a vetting partner and secure ID handling.
- The platform can't prove what happened inside a home. Word-against-word disputes stay unresolved by design.
- Leakage off the platform can't be prevented, only made unattractive.
- Location is by area name, not exact distance.

**Open questions**

- [ ] What exactly gets submitted on 15 Dec (report, demo video, deployed link, code)? Ask the instructor.
- [ ] Exact presentation date.
- [ ] Who owns which part of the build (fill the Owner column in Features).
- [ ] Worker interviews: who talks to whom, by when. Afshad to send the example screen.

**Future work**

- Voice notes on job requests and in disputes
- Urdu script (right-to-left layout)
- In-app payments with escrow
- Live location on the day of the job
- Fair-price guide built from completed agreements
