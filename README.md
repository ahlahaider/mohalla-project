# Mohalla

A marketplace for hiring local workers in Karachi (plumbers, electricians, cleaners and more), with trust built in through a confirmed job agreement, ratings on both sides, vouching and evidence-based disputes. The full spec is in the team's "Mohalla — Project Spec v1" doc.

```
mohalla/
├── api/          Node + Express + MongoDB. One API for both apps; all trust rules live here.
├── web/          React + Vite. Customers (search, request, agreement, rating) and admin screens.
└── worker-app/   Expo (React Native) + Expo Router. Workers: requests, prices, parts with bill photos, cash, ratings, earnings, vouching.
```

## How the pieces fit

- **Both apps only talk to the API.** Neither app decides anything important. The API checks who you are, what state the job is in, and whether the action is allowed. That way the web app and the worker app can never disagree about the rules.
- **The trust rules are all in `api/src/lib/rules.js`.** Expiry times, the 48-hour dispute window, strike consequences and vouching limits are all set there. Change a number there and it changes everywhere. These rules have unit tests in `api/test/rules.test.js`.
- **The job agreement lives inside each job** (`api/src/models/Job.js`). Entries are only ever added or accepted/rejected, never edited. That list is "the record" disputes are judged against.

## The customer web app (`web/`)

Built phone-first for customers who may read slowly: big buttons and chips, an icon beside every service, action and time slot, and English (or Roman Urdu, with the toggle) with Urdu script underneath key labels.

| Screen | Address | Needs login? |
| --- | --- | --- |
| 1 Home: pick area, pick a service | `/` | No |
| 2 Results with filter chips | `/find/:category` | No |
| 3 Worker profile | `/workers/:id` | No |
| 4 Log in / sign up (number → code → name → PIN) | `/login?returnTo=…` | — |
| 5 Request: problem, day + time, address | `/workers/:id/request` | Yes |
| 6 Job page: the price agreement timeline | `/jobs/:id` | Yes |
| 7 Finish: on time? cash? stars | `/jobs/:id/finish` | Yes |
| Post a job: workers nearby send prices, you pick one | `/find/:category/post` (then `/jobs/:id`) | Yes |
| My jobs, Something wrong?, Help | `/jobs`, `/jobs/:id/problem`, `/help` | Yes (Help: no) |
| Me: my details (name, home area, saved address), change PIN, change number, language, log out, close account | `/me`, `/me/details`, `/me/pin`, `/me/phone`, `/me/close` | Yes |

Login only appears when someone taps "Ask [name] to come" or opens My jobs, and then sends them back where they were.

- `web/src/ui/app.css`: the whole look (colours are variables at the top).
- `web/src/ui/kit.jsx`: shared pieces (bilingual labels, icons, keypad, pop-up sheets).
- `web/src/i18n.jsx`: every word as [English, Roman Urdu, Urdu]. **Have native speakers check the Urdu.**
- Icons are [Phosphor](https://phosphoricons.com) "duotone", recoloured per service in `app.css`; their movements are the `mo-*` animations there.
- Admin screens keep their original desktop look at `/admin` (password login at `/admin/login`).

## The worker app (`worker-app/`)

Same look, words and moving icons as the customer website, rebuilt for phones with Expo. Every file in `worker-app/src/app/` is a screen (Expo Router).

| Screen | File |
| --- | --- |
| Welcome: I'm new / I have an account / Someone is helping me | `welcome.js` |
| Log in (number → PIN, forgot PIN) | `login.js` |
| Sign up in 4 steps: number + code → work → areas + price → name, man/woman, photo, PIN | `signup.js` |
| Home: "I'm working today" switch, new requests with a countdown ring, my jobs | `home.js` |
| New request: customer's rating and paid-in-full record, problem, photos, when; yes / no | `request/[id].js` |
| Job page: address + call/WhatsApp/map, the 4 steps (visit charge, full price, parts and extra work, cash) | `job/[id]/index.js` |
| Send a price (visit charge, full price or extra work) | `job/[id]/price.js` |
| Add a part with a photo of the bill | `job/[id]/part.js` |
| Got the cash? Rate the customer | `job/[id]/paid.js` |
| Report a problem (with photos) | `job/[id]/problem.js` |
| Jobs near you: posted jobs to send a price for, and the prices I sent | `near.js`, `post/[id].js` |
| My earnings (week / month), vouching | `earnings.js`, `vouch.js` |
| Me: "get more requests" checklist, my profile, my work, how customers see me, change PIN, change number, language, help, log out, close account | `me.js`, `settings/*.js`, `help.js` |

- `src/ui/theme.js`: the colours (same as `web/src/ui/app.css`). `src/ui/kit.js`: buttons, chips, cards, keypad, sheets.
- `src/ui/motion.js`: the icon movements. Icons dance once when a screen opens and again each time their button is pressed (or hovered in the web preview).
- `src/lib/i18n.js`: every word as [English, Roman Urdu, Urdu]. **Have native speakers check the Urdu.**
- Home checks for new requests every 15 seconds while the app is open and buzzes when one arrives. (Phone notifications while the app is closed need a development build; see "Next" below.)

## Posted jobs ("let workers send prices")
Besides asking one worker, a customer can post a job from the results page. Workers whose services and areas match see it under **Near you** and send one full price each (with a short note). The customer sees every price with the worker's rating and jobs done, but no phone numbers, and picks one: that price goes on the record as the agreed full price, and the job continues like any other (extras still need the customer's OK). A post stays open for 24 hours (`POST_OPEN_HOURS` in `rules.js`).

## Closing an account
"Close my account" (customers and workers) needs the PIN and is refused while a job is going on or a problem report is open. Waiting requests are cancelled; old jobs and ratings stay on the record because disputes are judged by it. A closed number can't log in (admin can reopen it).

## Photos
Bill photos, the customer's problem photos, dispute evidence and worker profile photos are stored in MongoDB (`api/src/models/Photo.js`), so no extra account is needed. Both apps shrink each photo to 1200px before uploading (about 100–300 KB). `POST /api/photos` returns an address like `/api/photos/<long random key>` that is saved on the job.

## Setting it up (first time)

You need **Node.js 20 or newer** and a free **MongoDB Atlas** account.

### 1. Create the database
1. Sign up at mongodb.com/atlas and create a free cluster.
2. Under Database Access, add a user with a password.
3. Under Network Access, allow your IP (or 0.0.0.0/0 for the course project).
4. Click Connect → Drivers and copy the connection string. It starts with `mongodb+srv://`.

*Why Atlas:* it's free, nobody has to install MongoDB locally, and the whole team shares one database.

### 2. Run the API
```bash
cd api
npm install                 # downloads Express, Mongoose, etc.
cp .env.example .env        # then paste your connection string into MONGO_URI
npm run seed                # fills the database with demo users and jobs (wipes it first!)
npm run dev                 # starts the API on http://localhost:4000, restarts when you save
```
`npm run seed` prints the demo logins:
- Customers (website, number + PIN `1234`): `03001111111` (Sana), `03002222222` (Bilal), `03003333333` (Khadija)
- Workers (worker app, number + PIN `1234`): `03111111111` (Rashid, electrician: has a new request waiting), `03112222222` (Imran, plumber), `03113333333` (Shabana, cleaner)
- Admin (website at `/admin/login`, password `password123`): `03000000000`

Check it works: open http://localhost:4000/api/health. It should say `{"ok":true}`.

### Login: number + PIN, with sign-up codes (customers and workers)
Nobody gets a password (except admin). The first time, people enter their number, choose **WhatsApp or SMS** for a 4-number code, then their details and a 4-number PIN. After that it is just number + PIN. 5 wrong PINs lock the number for 10 minutes (`PIN_LOCK` in `api/src/lib/rules.js`).

Each app tells the API which app it is, so a worker's number typed on the customer website (or a customer's number in the worker app) gets a clear "use the other app" message.

How codes are sent is decided by **one setting per channel** in `api/.env`:

| Setting | `demo` (default) | real sending |
| --- | --- | --- |
| `OTP_SMS_MODE` | No SMS is sent. The code is always `1234` and the app shows it on screen. | Future work: real SMS needs a paid service (Twilio or Firebase). |
| `OTP_WHATSAPP_MODE` | Same as above. | `twilio` or `meta`: a real WhatsApp message (see below). |

We say openly in the presentation that SMS codes are simulated, the same way ID checks are.

### WhatsApp codes (for the presentation)
Pick **one** of these. Twilio is quicker to set up.

**Option A: Twilio WhatsApp sandbox (free trial)**
1. Sign up at twilio.com (the free trial credit is enough). Copy the **Account SID** and **Auth Token** from the console.
2. Go to Messaging → Try it out → Send a WhatsApp message. Note the sandbox number (usually `+1 415 523 8886`) and the **join code** (e.g. `join happy-tiger`).
3. On **every phone that will receive codes** (e.g. the presenter's phone), send that `join …` message to the sandbox number on WhatsApp. It stays joined for 3 days, so re-join before the presentation.
4. Within 24 hours before the demo, send any message (e.g. "hi") from that phone to the sandbox. WhatsApp only lets the sandbox start a chat within 24 hours of the person's last message.
5. In `api/.env` set `OTP_WHATSAPP_MODE=twilio`, `TWILIO_ACCOUNT_SID=…`, `TWILIO_AUTH_TOKEN=…`. Restart the API.

**Option B: Meta WhatsApp Cloud API**
1. At developers.facebook.com create an app with the WhatsApp product. Meta gives you a test number and lets you add up to 5 recipient numbers. Add the presenter's phone.
2. Create a message template of category **Authentication** named `mohalla_code` (or set `META_WA_TEMPLATE`), and wait for it to be approved.
3. Copy the **Phone number ID** and an **access token**. The temporary token expires after 24 hours; for the presentation, make a permanent one with a System User in Business settings.
4. In `api/.env` set `OTP_WHATSAPP_MODE=meta`, `META_WA_ACCESS_TOKEN=…`, `META_WA_PHONE_NUMBER_ID=…`. Restart the API.

If sending fails, the app tells the customer to try again or choose SMS, and the real reason is printed in the API's terminal (e.g. Twilio error 63015 = that phone hasn't joined the sandbox).

### 3. Run the web app
```bash
cd web
npm install
npm run dev                 # opens on http://localhost:5173
```
In development, Vite forwards every `/api` request to port 4000 (see `web/vite.config.js`), so the web app needs no extra settings.

### 4. Run the worker app
1. Install **Expo Go** on your phone (Play Store / App Store).
2. Find your laptop's Wi-Fi IP address (`ipconfig` on Windows, `ipconfig getifaddr en0` on Mac). The phone and laptop must be on the same Wi-Fi.
3. Start the app, telling it where the API is:
```bash
cd worker-app
npm install
EXPO_PUBLIC_API_URL=http://YOUR-LAPTOP-IP:4000/api npx expo start
```
Expo Go must support the project's Expo SDK (58). If Expo Go says the project is incompatible, update Expo Go from the store.
On Windows PowerShell, set the variable first: `$env:EXPO_PUBLIC_API_URL="http://YOUR-LAPTOP-IP:4000/api"; npx expo start`.

4. Scan the QR code with your phone's camera (iPhone) or with Expo Go (Android).

*Why the IP address:* on the phone, "localhost" means the phone itself, not your laptop.

*No phone handy?* Press `w` in the Expo terminal to open the worker app in a browser. It runs the same code.

## Tests
```bash
cd api
npm test
```
- `rules.test.js` checks the trust rules (no database needed).
- `app.test.js` checks the API starts and protected routes refuse users who aren't logged in (no database needed).
- `flow.test.js` runs a whole job end to end: request → accept → visit charge → quote → part with bill → complete → payment → ratings → dispute → ruling. It needs its own database because it **wipes it**: create a second database in Atlas (e.g. `.../mohalla-test`) and run `TEST_MONGO_URI="mongodb+srv://.../mohalla-test" npm test`.

## API at a glance

| Area | Routes |
| --- | --- |
| Auth | `POST /api/auth/phone` (has an account?), `POST /api/auth/otp/request`, `POST /api/auth/otp/verify`, `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/pin/reset`, `GET /api/auth/me` (each takes `app: 'customer' \| 'worker'`) |
| Workers | `GET /api/workers` (filters: category, area, maxPrice, available, female), `GET /api/workers/:id`, `PATCH /api/workers/me`, `PATCH /api/workers/me/availability`, `GET /api/workers/me/summary?period=week\|month` (earnings + vouching) |
| Settings | `PATCH /api/users/me` (customer name, area, address), `POST /api/auth/pin/change`, `POST /api/auth/phone/change` (after a code with purpose `change`), `POST /api/auth/close` |
| Posted jobs | `POST /api/jobs` with `mode: 'quotes'`, `GET /api/jobs/open` (worker: jobs near you), `GET /api/jobs/bids` (worker: my prices), `POST /api/jobs/:id/quotes`, `POST /api/jobs/:id/quotes/:quoteId/pick` |
| Photos | `POST /api/photos` (`{ data: "data:image/jpeg;base64,…" }`), `GET /api/photos/:key` |
| Jobs | `POST /api/jobs`, `GET /api/jobs/mine`, `GET /api/jobs/open`, `GET /api/jobs/:id`, `POST /api/jobs/:id/accept` · `decline` · `cancel` · `complete` · `payment` · `review` · `disputes` |
| Quotes | `POST /api/jobs/:id/quotes`, `POST /api/jobs/:id/quotes/:quoteId/pick` |
| Agreement | `POST /api/jobs/:id/agreement`, `POST /api/jobs/:id/agreement/:entryId/accept` (or `reject`) |
| Disputes | `POST /api/disputes/:id/statements`, `GET /api/disputes/mine`, `GET /api/disputes` (admin), `POST /api/disputes/:id/ruling` (admin) |
| Vouches | `POST /api/vouches` (`{ phone }`), `POST /api/vouches/:workerId`, `DELETE /api/vouches/:workerId` |
| Admin | `GET /api/admin/users`, `PATCH /api/admin/users/:id`, `GET /api/admin/reports`, `PATCH /api/admin/reports/:id`, `POST /api/reports` |

Every request (except the auth routes, search and worker pages) needs the header `Authorization: Bearer <token>`, which login returns.

## What's done and what's next

Done (must-haves from the spec): login for three roles, worker profiles, search with area neighbours and filters, direct requests that expire after 4 hours, accept/decline, contact details hidden until acceptance, the two-stage agreement with amendments and parts, completion with "on time?", two-sided payment confirmation, hidden-until-both ratings, reliability counts, disputes with admin rulings and strikes, safety reports, admin badges/suspensions, English / Roman Urdu. Posted jobs with quotes and vouching rules are also in the API.

Also done: photo uploads (bills, problem photos, evidence, profile photos), vouching screens, assisted sign-up ("Someone is helping me"), replying to a reported problem on both sides, worker earnings.

Next, in rough order:
1. **Phone notifications** for new requests while the worker app is closed (`expo-notifications`; needs a development build, not Expo Go).
2. **Deploy**: API to Render, web to Vercel (set `VITE_API_URL` to the Render URL + `/api`), worker app via Expo Go.
3. A "read aloud" button for slow readers (skipped for the course project).
4. Voice notes on job requests, if there's time after the presentation.

The Roman Urdu text is a first draft (`web/src/i18n.jsx`, `worker-app/src/lib/i18n.js`). Have the team and the workers you interview fix anything that sounds off.
